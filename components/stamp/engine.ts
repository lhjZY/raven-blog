import { BALL_FS, BALL_VS, COPY_FS, COPY_VS, PRINT_FS, PRINT_VS } from "./shaders";

type Vec2 = [number, number];
type Quat = [number, number, number, number];

export type StampOptions = {
  /** Where the path starts. The ball rolls down from here, `gutter` pixels left of its parent. */
  start: HTMLElement;
  gutter: number;
  /** Sideways sway in pixels; 0 rolls a straight line. */
  sway: number;
  /** Absolutely placed in the document; clips the paper canvas to the path. */
  floor: HTMLElement;
  paper: HTMLCanvasElement;
  ball: HTMLCanvasElement;
  shadow: HTMLElement;
  radius: number;
  mark: string;
  word: string;
  bodyColor: string;
  wordColor: string;
};

const STIFF = 70;
const DAMP = 11;
const PIXEL_BUDGET = 12e6;

function program(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const compile = (type: number, src: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "");
    return shader;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "");
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(p, "corner");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const cache = new Map<string, WebGLUniformLocation | null>();
  const u = (name: string) => {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(p, name));
    return cache.get(name)!;
  };
  return { p, vao, u };
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const qmul = ([ax, ay, az, aw]: Quat, [bx, by, bz, bw]: Quat): Quat => [
  aw * bx + ax * bw + ay * bz - az * by,
  aw * by - ax * bz + ay * bw + az * bx,
  aw * bz + ax * by - ay * bx + az * bw,
  aw * bw - ax * bx - ay * by - az * bz,
];

/** Starts the ball. Returns null when WebGL2 is unavailable; call the returned function to stop it. */
export function createStamp(o: StampOptions): (() => void) | null {
  const R = o.radius;
  const halfWidth = 0.85 * R;
  const pgl = o.paper.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
  const bgl = o.ball.getContext("webgl2", { antialias: false });
  if (!pgl || !bgl) return null;

  const ballProg = program(bgl, BALL_VS, BALL_FS);
  const printProg = program(pgl, PRINT_VS, PRINT_FS);
  const copyProg = program(pgl, COPY_VS, COPY_FS);
  pgl.enable(pgl.BLEND);
  pgl.blendFunc(pgl.ONE, pgl.ONE_MINUS_SRC_ALPHA);

  // Each context gets the raven on texture unit 0 and the word on unit 1.
  const textures = [
    { gl: bgl, prog: ballProg },
    { gl: pgl, prog: printProg },
  ].map(({ gl, prog }) => {
    gl.useProgram(prog.p);
    gl.uniform1i(prog.u("raven"), 0);
    gl.uniform1i(prog.u("word"), 1);
    gl.uniform3fv(prog.u("bodyColor"), rgb(o.bodyColor));
    gl.uniform3fv(prog.u("wordColor"), rgb(o.wordColor));
    const make = (unit: number) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return tex;
    };
    return { gl, units: [make(0), make(1)] };
  });
  const upload = (unit: number, source: TexImageSource) => {
    for (const { gl, units } of textures) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, units[unit]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.generateMipmap(gl.TEXTURE_2D);
    }
    wake();
  };

  const mark = new Image();
  mark.onload = () => upload(0, mark);
  mark.src = o.mark;

  const label = document.createElement("canvas");
  label.width = label.height = 512;
  const ctx = label.getContext("2d")!;
  const family = getComputedStyle(document.documentElement).getPropertyValue("--mono") || "monospace";
  ctx.font = `700 100px ${family}`;
  const fontSize = Math.floor((100 * 512 * 0.86) / ctx.measureText(o.word).width);
  ctx.font = `700 ${fontSize}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(o.word, 256, 256);

  // Orientation (body -> view). Start with the raven just ahead of the contact point.
  let q: Quat = [0, 0, 0, 1];
  const roll = (dx: number, dy: number) => {
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-6) return;
    const s = Math.sin(dist / R / 2) / dist;
    q = qmul([dy * s, -dx * s, 0, Math.cos(dist / R / 2)], q);
    const n = Math.hypot(...q);
    q = q.map((v) => v / n) as Quat;
  };
  roll(0, R * 2.2);
  // Row-major body -> view, uploaded untransposed so GLSL sees view -> body.
  const orient = () => {
    const [x, y, z, w] = q;
    return new Float32Array([
      1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y),
      2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x),
      2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y),
    ]);
  };

  // Past the bottom of the page, wheel input keeps going as `extra`: the page stays put while the ball
  // keeps rolling and the paper slides up under it. Prints live in virtual coordinates (document y plus
  // `extra`); canvas row 0 sits at virtual y `origin`, which moves down whenever the paper is rebased.
  let extra = 0;
  let extraGoal = 0;
  let origin = 0;

  // The canvas holds the lane from the top of the document down; the floor element shows only the part
  // from the start point to the bottom of its parent, so prints never slide over the header or footer.
  // It is allocated taller than needed so height changes rarely clear the prints.
  let floorTop = 0;
  let floorLeft = 0;
  let floorW = 0;
  let allocH = 0;
  let dpr = 1;
  const container = o.start.parentElement ?? o.start;
  const laneX = () => container.getBoundingClientRect().left - o.gutter;
  // A screen of real, empty page after the content: the ball rolls on into it with the scrollbar still
  // moving, and wheel input only turns into `extra` once the scrollbar reaches the true bottom.
  const runout = document.createElement("div");
  runout.setAttribute("aria-hidden", "true");
  runout.style.height = "100vh";
  container.append(runout);
  const sizeFloor = () => {
    const left = Math.round(laneX() + scrollX - o.sway - R * 2);
    const w = Math.round((o.sway + R * 2) * 2);
    const h = Math.ceil(container.getBoundingClientRect().bottom + scrollY);
    floorTop = Math.floor(o.start.getBoundingClientRect().top + scrollY - R);
    o.floor.style.top = `${floorTop}px`;
    o.floor.style.height = `${h - floorTop}px`;
    if (left !== floorLeft || w !== floorW) {
      floorLeft = left;
      o.floor.style.left = `${left}px`;
      o.floor.style.width = `${w}px`;
    }
    if (w === floorW && h <= allocH) return;
    floorW = w;
    // Reallocating clears the canvas; start it at document y 0 again.
    origin = extra;
    allocH = Math.ceil((Math.max(h, innerHeight * 2) + 512) / 1024) * 1024;
    const max = Math.min(...(pgl.getParameter(pgl.MAX_VIEWPORT_DIMS) as Int32Array), 16384);
    const scale = Math.min(devicePixelRatio || 1, 2, max / w, max / allocH, Math.sqrt(PIXEL_BUDGET / (w * allocH)));
    o.paper.width = Math.round(w * scale);
    o.paper.height = Math.round(allocH * scale);
    o.paper.style.width = `${w}px`;
    o.paper.style.height = `${allocH}px`;
    // Browsers may still shrink the buffer; measure what was actually given.
    dpr = pgl.drawingBufferHeight / allocH;
    pgl.viewport(0, 0, pgl.drawingBufferWidth, pgl.drawingBufferHeight);
  };

  // Keep the visible part of the paper inside the canvas: near the bottom, move every pixel up and
  // advance `origin`; scrolling back above the top, move them down again. Prints pushed off the far
  // edge are lost.
  const rebase = () => {
    const top = scrollY + extra - R * 2 - origin;
    const bottom = scrollY + extra + innerHeight + R * 2 - origin;
    let rows = 0;
    if (bottom > allocH) rows = Math.ceil((bottom - allocH + allocH / 4) * dpr);
    else if (top < 0 && origin > 0) rows = -Math.ceil(Math.min(-top + allocH / 4, origin) * dpr);
    if (!rows) return;
    const width = pgl.drawingBufferWidth;
    const height = pgl.drawingBufferHeight;
    const tex = pgl.createTexture();
    pgl.activeTexture(pgl.TEXTURE2);
    pgl.bindTexture(pgl.TEXTURE_2D, tex);
    pgl.texParameteri(pgl.TEXTURE_2D, pgl.TEXTURE_MIN_FILTER, pgl.NEAREST);
    pgl.copyTexImage2D(pgl.TEXTURE_2D, 0, pgl.RGBA, 0, 0, width, height, 0);
    pgl.clearColor(0, 0, 0, 0);
    pgl.clear(pgl.COLOR_BUFFER_BIT);
    pgl.useProgram(copyProg.p);
    pgl.bindVertexArray(copyProg.vao);
    pgl.uniform1i(copyProg.u("source"), 2);
    pgl.uniform1i(copyProg.u("shift"), rows);
    pgl.drawArrays(pgl.TRIANGLE_STRIP, 0, 4);
    pgl.deleteTexture(tex);
    pgl.activeTexture(pgl.TEXTURE0);
    origin = Math.max(0, origin + rows / dpr);
  };

  const atBottom = () => scrollY + innerHeight >= document.documentElement.scrollHeight - 1;
  // Scrolling back up unwinds `extra` at least four times faster than it built up, and faster still the
  // deeper it went, so about two screens of wheel always hand control back to the scrollbar.
  let unwind = 0;
  const onWheel = (event: WheelEvent) => {
    const dy = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (!atBottom() || (dy <= 0 && extraGoal <= 0)) return;
    event.preventDefault();
    if (dy > 0) unwind = 0;
    else unwind ||= Math.max(4, extraGoal / (2 * innerHeight));
    extraGoal = Math.max(0, extraGoal + (dy < 0 ? dy * unwind : dy));
    wake();
  };

  const ballDpr = Math.min(devicePixelRatio || 1, 3);
  o.ball.width = o.ball.height = Math.round(R * 2 * ballDpr);
  bgl.viewport(0, 0, o.ball.width, o.ball.height);

  const capsule = (from: Vec2, to: Vec2) => {
    const { p, vao, u } = printProg;
    const a: Vec2 = [from[0] - floorLeft, from[1] - origin];
    const b: Vec2 = [to[0] - floorLeft, to[1] - origin];
    const h = halfWidth + 2;
    pgl.useProgram(p);
    pgl.bindVertexArray(vao);
    pgl.uniform2f(u("lo"), Math.min(a[0], b[0]) - h, Math.min(a[1], b[1]) - h);
    pgl.uniform2f(u("hi"), Math.max(a[0], b[0]) + h, Math.max(a[1], b[1]) + h);
    pgl.uniform2f(u("size"), floorW, allocH);
    pgl.uniform2f(u("from"), ...a);
    pgl.uniform2f(u("to"), ...b);
    pgl.uniform1f(u("halfWidth"), halfWidth);
    pgl.uniform1f(u("radius"), R);
    pgl.uniform1f(u("dpr"), dpr);
    pgl.uniformMatrix3fv(u("orient"), false, orient());
    pgl.drawArrays(pgl.TRIANGLE_STRIP, 0, 4);
  };

  const drawBall = () => {
    const { p, vao, u } = ballProg;
    bgl.useProgram(p);
    bgl.bindVertexArray(vao);
    bgl.clearColor(0, 0, 0, 0);
    bgl.clear(bgl.COLOR_BUFFER_BIT);
    bgl.uniformMatrix3fv(u("orient"), false, orient());
    bgl.uniform1f(u("px"), R * ballDpr);
    bgl.drawArrays(bgl.TRIANGLE_STRIP, 0, 4);
  };

  // Where the ball wants to be in the viewport. It waits at the start point until that scrolls up to the
  // ball's resting height, then stays there while the page moves under it; the resting height drifts
  // down with scroll progress so the ball reaches the end of the content. Past the bottom of the page
  // it eases towards the middle of the path's visible part.
  const target = (): Vec2 => {
    const start = o.start.getBoundingClientRect().top + R;
    const end = container.getBoundingClientRect().bottom - R;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const progress = Math.min(Math.max(scrollY / max, 0), 1);
    const rest = innerHeight * 0.3 + (innerHeight - R - 48 - innerHeight * 0.3) * progress;
    let y = Math.min(Math.max(start, rest), end);
    const t = Math.min(extra / (innerHeight * 1.5), 1);
    const middle = (Math.max(start, 0) + Math.min(end, innerHeight)) / 2;
    y += (middle - y) * t * t * (3 - 2 * t);
    return [laneX() + Math.sin((scrollY + extra + y) / 230) * o.sway, y];
  };

  let pos = target();
  let vel: Vec2 = [0, 0];
  let last: Vec2 | null = null;
  let prevTime = 0;
  let frameId = 0;

  const frame = (now: number) => {
    frameId = 0;
    const dt = prevTime ? Math.min((now - prevTime) / 1000, 1 / 30) : 1 / 60;
    prevTime = now;
    // Scrolling the page itself away from the bottom ends the endless part.
    if (!atBottom()) extraGoal = 0;
    extra = Math.abs(extraGoal - extra) < 0.5 ? extraGoal : extra + (extraGoal - extra) * (1 - Math.exp(-dt / 0.12));
    document.documentElement.style.overscrollBehaviorY = extra > 0 ? "none" : "";
    sizeFloor();
    rebase();
    o.paper.style.translate = `0 ${origin - extra - floorTop}px`;

    const [tx, ty] = target();
    const ax = STIFF * (tx - pos[0]) - DAMP * vel[0];
    const ay = STIFF * (ty - pos[1]) - DAMP * vel[1];
    vel = [vel[0] + ax * dt, vel[1] + ay * dt];
    pos = [pos[0] + vel[0] * dt, pos[1] + vel[1] * dt];

    // Roll by the ball's travel over the document, printing the contact patch in small steps.
    const doc: Vec2 = [pos[0] + scrollX, pos[1] + scrollY + extra];
    let moved = 0;
    if (last) {
      const dx = doc[0] - last[0];
      const dy = doc[1] - last[1];
      moved = Math.hypot(dx, dy);
      if (moved > 800) {
        roll(dx, dy);
      } else if (moved > 0.05) {
        const steps = Math.min(200, Math.ceil(moved / (R * 0.25)));
        let from = last;
        for (let i = 1; i <= steps; i++) {
          const to: Vec2 = [last[0] + (dx * i) / steps, last[1] + (dy * i) / steps];
          roll(dx / steps, dy / steps);
          capsule(from, to);
          from = to;
        }
      }
    }
    last = doc;

    drawBall();
    o.ball.style.translate = `${pos[0] - R}px ${pos[1] - R}px`;
    const s = o.shadow.offsetWidth / 2;
    o.shadow.style.translate = `${pos[0] - s + R * 0.35}px ${pos[1] - s + R * 0.45}px`;

    const resting =
      Math.hypot(...vel) < 0.5 && Math.hypot(tx - pos[0], ty - pos[1]) < 0.3 && moved < 0.05 && extra === extraGoal;
    if (!resting) wake();
  };
  function wake() {
    if (!frameId) frameId = requestAnimationFrame(frame);
  }

  addEventListener("scroll", wake, { passive: true });
  addEventListener("resize", wake);
  addEventListener("wheel", onWheel, { passive: false });
  const observer = new ResizeObserver(wake);
  observer.observe(document.body);
  upload(1, label);

  return () => {
    cancelAnimationFrame(frameId);
    removeEventListener("scroll", wake);
    removeEventListener("resize", wake);
    removeEventListener("wheel", onWheel);
    document.documentElement.style.overscrollBehaviorY = "";
    observer.disconnect();
    runout.remove();
    pgl.getExtension("WEBGL_lose_context")?.loseContext();
    bgl.getExtension("WEBGL_lose_context")?.loseContext();
  };
}
