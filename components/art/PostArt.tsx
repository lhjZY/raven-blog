import styles from "./art.module.css";

export type ArtName = "board" | "raven" | "calendar";

/** A post's animated illustration on an amber square. */
export default function PostArt({ art, size }: { art: ArtName; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        padding: Math.round(size * 0.1),
        background: "var(--amber9)",
        flex: "none",
      }}
    >
      {art === "board" && <BoardArt />}
      {art === "raven" && <RavenArt />}
      {art === "calendar" && <CalendarArt />}
    </div>
  );
}

const line = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Raven Todo's board: at "midnight" a card hops from 明天 into 今天, then gets ticked off. */
function BoardArt() {
  return (
    <svg viewBox="0 0 120 120" className={styles.art} aria-hidden="true">
      <g {...line} strokeWidth={3}>
        <rect x="12" y="20" width="30" height="84" rx="5" />
        <rect x="45" y="20" width="30" height="84" rx="5" />
        <rect x="78" y="20" width="30" height="84" rx="5" />
        {/* Column marks: tray, star, moon */}
        <path d="M21 31h12l-2 5h-8z" />
        <path
          d="M60 27l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z"
          strokeWidth={2.4}
        />
        <path d="M97.5 37a6 6 0 0 1-7.5-7.5a6 6 0 1 0 7.5 7.5z" strokeWidth={2.4} />
        <rect x="17" y="46" width="20" height="10" rx="3" />
        <rect x="17" y="62" width="20" height="10" rx="3" />
        <rect x="50" y="46" width="20" height="10" rx="3" />
        <rect x="83" y="62" width="20" height="10" rx="3" />
      </g>
      <g className={styles.mover}>
        <rect x="83" y="46" width="20" height="10" rx="3" fill="currentColor" />
        <path
          className={styles.tick}
          d="M88.5 51l3 3 6-6"
          {...line}
          stroke="var(--amber9)"
          strokeWidth={2.4}
          pathLength={1}
        />
      </g>
    </svg>
  );
}

/** The raven draws itself line by line, opens its eyes and blinks. */
function RavenArt() {
  const parts: [string, string][] = [
    [styles.line, "M60 31C86 31 100 50 100 71C100 93 83 105 60 105C37 105 20 93 20 71C20 50 34 31 60 31Z"],
    [styles.line2, "M55 32C49 27 49 18 57 16C61 20 62 27 60 31ZM63 31C64 25 70 20 77 22C77 28 72 32 66 33Z"],
    [styles.line3, "M28 66C22 76 26 87 41 89M92 66C98 76 94 87 79 89"],
    [styles.line3, "M50 81H70Q79 81 79 90V96Q79 105 70 105H50Q41 105 41 96V90Q41 81 50 81Z"],
    [styles.line4, "M50 93L55 97.5L62.5 89M67 93H70"],
    [
      styles.line4,
      "M47 105C45 110 46 114 50 114C53 114 54 110 52 105M68 105C66 110 67 114 71 114C74 114 75 110 73 105",
    ],
  ];
  return (
    <svg viewBox="14 8 92 112" className={styles.art} aria-hidden="true">
      <g {...line} strokeWidth={4}>
        {parts.map(([className, d]) => (
          <path key={d} className={`${styles.line} ${className}`} d={d} pathLength={1} />
        ))}
      </g>
      <g className={styles.face} fill="currentColor">
        <g className={styles.eyes}>
          <circle cx="46" cy="63" r="6.5" />
          <circle cx="74" cy="63" r="6.5" />
        </g>
        <path d="M53.5 71Q60 68.5 66.5 71Q63.5 76.5 60 79.5Q56.5 76.5 53.5 71Z" />
      </g>
    </svg>
  );
}

/** A month page: the days fill in, a 休 and a 班 badge pop up, and the selection moves. */
function CalendarArt() {
  const days = Array.from({ length: 28 }, (_, i) => ({
    x: 25 + (i % 7) * 11.7,
    y: 52 + Math.floor(i / 7) * 14,
    delay: `${(i * 0.04).toFixed(2)}s`,
  }));
  return (
    <svg viewBox="0 0 120 120" className={styles.art} aria-hidden="true">
      <g {...line} strokeWidth={3}>
        <rect x="14" y="22" width="92" height="86" rx="10" />
        <path d="M14 40H106M38 14V28M82 14V28" />
      </g>
      {days.map((day) => (
        <circle
          key={`${day.x}-${day.y}`}
          className={styles.day}
          cx={day.x}
          cy={day.y}
          r="2.6"
          fill="currentColor"
          style={{ animationDelay: day.delay }}
        />
      ))}
      <circle className={styles.pick} cx="48.4" cy="80" r="6.5" {...line} strokeWidth={2.6} />
      <g className={styles.badge}>
        <circle cx="83.8" cy="52" r="7" fill="currentColor" />
        <path d="M80.8 52h6M83.8 49v6" stroke="var(--amber9)" strokeWidth={2} strokeLinecap="round" />
      </g>
      <g className={`${styles.badge} ${styles.late}`}>
        <circle cx="95.5" cy="66" r="7" fill="currentColor" />
        <path d="M92.5 66h6" stroke="var(--amber9)" strokeWidth={2} strokeLinecap="round" />
      </g>
    </svg>
  );
}
