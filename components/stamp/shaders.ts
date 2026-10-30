// Screen and paper coordinates are CSS pixels, x right and y down; the ball's z axis points into the page.

/** The ball's surface in its own coordinates: a paper cap with the raven around -z, the word around +z. */
const PATTERN = `
  const float CAP = 0.8;
  const float FIT = 0.82;
  const float WORD = 0.9;
  const vec3 PAPER = vec3(0.980, 0.976, 0.961);
  const vec3 INK = vec3(0.078, 0.078, 0.075);
  uniform sampler2D raven;
  uniform sampler2D word;
  uniform vec3 bodyColor;
  uniform vec3 wordColor;
  vec3 pattern(vec3 b) {
    float a = acos(clamp(-b.z, -1.0, 1.0));
    float aw = max(fwidth(a), 1e-4);

    // Rolling prints mirror along the motion, so the raven sits upside down on the ball
    // and lands upright on the page when rolling downwards.
    vec2 uv = vec2(b.x, -b.y) / sin(CAP) / FIT;
    vec3 cap = mix(PAPER, INK, texture(raven, uv * 0.5 + 0.5).a * float(b.z < 0.0));

    // The word meets the paper after whole turns rather than half turns, so it needs no flip.
    vec2 wv = b.xy / sin(WORD);
    vec3 body = mix(bodyColor, wordColor, texture(word, wv * 0.5 + 0.5).a * float(b.z > 0.0));

    return mix(cap, body, smoothstep(CAP - aw, CAP + aw, a));
  }`;

export const BALL_VS = `#version 300 es
  in vec2 corner;
  out vec2 p;
  void main() { p = vec2(corner.x, -corner.y); gl_Position = vec4(corner, 0.0, 1.0); }`;

export const BALL_FS = `#version 300 es
  precision highp float;
  in vec2 p;
  out vec4 color;
  uniform mat3 orient;
  uniform float px;
  ${PATTERN}
  void main() {
    float d2 = dot(p, p);
    float edge = clamp((1.0 - sqrt(d2)) * px, 0.0, 1.0);
    if (edge <= 0.0) discard;
    vec3 n = vec3(p, -sqrt(max(0.0, 1.0 - d2)));
    vec3 c = pattern(orient * n);
    vec3 L = normalize(vec3(-0.45, -0.55, -0.7));
    float diff = max(dot(n, L), 0.0);
    float spec = pow(max(dot(n, normalize(L + vec3(0.0, 0.0, -1.0))), 0.0), 40.0);
    c = c * (0.55 + 0.5 * diff) + spec * 0.3;
    color = vec4(min(c, 1.0) * edge, edge);
  }`;

/** Moves the paper's pixels up by `shift` device rows (down when negative) when it runs out of room. */
export const COPY_VS = `#version 300 es
  in vec2 corner;
  void main() { gl_Position = vec4(corner, 0.0, 1.0); }`;

export const COPY_FS = `#version 300 es
  precision highp float;
  out vec4 color;
  uniform sampler2D source;
  uniform int shift;
  void main() {
    ivec2 at = ivec2(gl_FragCoord.xy) - ivec2(0, shift);
    color = at.y >= 0 && at.y < textureSize(source, 0).y ? texelFetch(source, at, 0) : vec4(0.0);
  }`;

/** A capsule from the previous contact point to the current one, in paper coordinates. */
export const PRINT_VS = `#version 300 es
  in vec2 corner;
  uniform vec2 lo, hi, size;
  out vec2 at;
  void main() {
    at = mix(lo, hi, corner * 0.5 + 0.5);
    gl_Position = vec4(at.x / size.x * 2.0 - 1.0, 1.0 - at.y / size.y * 2.0, 0.0, 1.0);
  }`;

export const PRINT_FS = `#version 300 es
  precision highp float;
  in vec2 at;
  out vec4 color;
  uniform vec2 from, to;
  uniform float halfWidth, radius, dpr;
  uniform mat3 orient;
  ${PATTERN}
  void main() {
    vec2 ab = to - from;
    float t = clamp(dot(at - from, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
    float a = clamp((halfWidth - length(at - (from + ab * t))) * dpr + 0.5, 0.0, 1.0);
    if (a <= 0.0) discard;
    // Unroll the ground around the contact point onto the ball's underside: arc length equals distance.
    vec2 g = at - to;
    float len = length(g);
    vec2 dir = len > 1e-4 ? g / len : vec2(0.0);
    vec3 n = vec3(sin(len / radius) * dir, cos(len / radius));
    color = vec4(pattern(orient * n) * a, a);
  }`;
