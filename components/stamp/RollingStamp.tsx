"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createStamp } from "./engine";
import styles from "./stamp.module.css";

// Wide layouts only: the ball needs the gutter beside the content.
const QUERY = "(min-width: 861px) and (prefers-reduced-motion: no-preference)";

/**
 * A ball that rolls down beside its parent as the page scrolls, printing the raven and a word onto
 * the page. Where it is placed is where the path starts; it runs to the bottom of the parent and,
 * past the end of the page, keeps rolling.
 */
export default function RollingStamp({
  radius = 28,
  gutter = 32,
  sway = 0,
  word = "RAVEN",
  bodyColor = "#ffc53d",
  wordColor = "#4f3422",
}: {
  radius?: number;
  /** Distance from the parent's left edge to the middle of the ball's path. */
  gutter?: number;
  sway?: number;
  word?: string;
  bodyColor?: string;
  wordColor?: string;
}) {
  const start = useRef<HTMLDivElement>(null);
  const floor = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLCanvasElement>(null);
  const ball = useRef<HTMLCanvasElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = matchMedia(QUERY);
    const update = () => setEnabled(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled || !start.current || !floor.current || !paper.current || !ball.current || !shadow.current) return;
    const stop = createStamp({
      start: start.current,
      gutter,
      sway,
      floor: floor.current,
      paper: paper.current,
      ball: ball.current,
      shadow: shadow.current,
      radius,
      mark: "/stamp/raven-mark.png",
      word,
      bodyColor,
      wordColor,
    });
    return () => stop?.();
  }, [enabled, radius, gutter, sway, word, bodyColor, wordColor]);

  const size = radius * 2;
  return (
    <>
      <div ref={start} aria-hidden="true" />
      {enabled &&
        createPortal(
          <>
            <div ref={floor} className={styles.floor} aria-hidden="true">
              <canvas ref={paper} />
            </div>
            <div
              ref={shadow}
              className={styles.shadow}
              aria-hidden="true"
              style={{ width: size * 1.3, height: size * 1.3 }}
            />
            <canvas ref={ball} className={styles.ball} aria-hidden="true" style={{ width: size, height: size }} />
          </>,
          document.body,
        )}
    </>
  );
}
