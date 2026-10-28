import type { ArtName } from "./PostArt";

/** A small line icon for a post's row in the list, matching its illustration. */
export default function PostIcon({ art }: { art: ArtName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {art === "board" && (
        <>
          <rect x="3" y="4" width="5" height="16" rx="1.5" />
          <rect x="9.5" y="4" width="5" height="16" rx="1.5" />
          <rect x="16" y="4" width="5" height="16" rx="1.5" />
          <path d="M10.5 9h3M17 12h3M4 9h3M4 12h3" />
        </>
      )}
      {art === "raven" && (
        <>
          <path d="M12 6c5 0 8 3.5 8 7.5S16.5 20 12 20s-8-2.5-8-6.5S7 6 12 6z" />
          <path d="M11 6c-1-1.5-.5-3 1-3.2M13 6c.5-1.2 1.8-1.8 3-1.4" />
          <circle cx="9.5" cy="12" r="0.8" fill="currentColor" />
          <circle cx="14.5" cy="12" r="0.8" fill="currentColor" />
          <path d="M11 14h2l-1 1.4z" />
        </>
      )}
      {art === "calendar" && (
        <>
          <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
          <path d="M3.5 9.5h17M8 3v4M16 3v4" />
          <circle cx="16" cy="14.5" r="2" />
        </>
      )}
    </svg>
  );
}
