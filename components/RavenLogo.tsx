import styles from "./RavenLogo.module.css";

/** The raven from Raven Todo's icon, filled amber: it blinks now and then and hops on hover. */
export default function RavenLogo({ size = 40 }: { size?: number }) {
  const ink = "var(--on-amber)";
  return (
    <svg
      className={styles.raven}
      width={size}
      height={size}
      viewBox="14 10 92 108"
      role="img"
      aria-label="Raven"
    >
      <g className={styles.body}>
        <ellipse cx="50" cy="107" rx="6.5" ry="5.5" fill={ink} />
        <ellipse cx="70" cy="107" rx="6.5" ry="5.5" fill={ink} />
        <path
          d="M55 32C49 27 49 18 57 16C61 20 62 27 60 31ZM63 31C64 25 70 20 77 22C77 28 72 32 66 33Z"
          fill={ink}
          stroke={ink}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M60 31C86 31 100 50 100 71C100 93 83 105 60 105C37 105 20 93 20 71C20 50 34 31 60 31Z"
          fill="var(--amber9)"
          stroke={ink}
          strokeWidth="6"
        />
        <g className={styles.eyes} fill={ink}>
          <circle cx="46" cy="63" r="7" />
          <circle cx="74" cy="63" r="7" />
        </g>
        <path
          d="M53.5 71Q60 68.5 66.5 71Q63.5 76.5 60 79.5Q56.5 76.5 53.5 71Z"
          fill={ink}
          stroke={ink}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M28 66C22 76 26 87 41 89M92 66C98 76 94 87 79 89"
          fill="none"
          stroke={ink}
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
