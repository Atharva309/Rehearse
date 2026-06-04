/**
 * CallContainer.tsx
 * Contained call area below the pipeline — fills remaining viewport height.
 */

"use client";

type CallContainerProps = {
  children: React.ReactNode;
};

/** Explicit height for the dark call box (viewport minus navbar + chrome above). */
export const CALL_BOX_HEIGHT_CSS = "calc(100dvh - 4rem - 8rem)";

/** Minimum call box height on small screens. */
export const CALL_BOX_MIN_HEIGHT_PX = 720;

/**
 * Dark call region filling all space below navbar, back link, and pipeline.
 */
export function CallContainer({ children }: CallContainerProps): React.ReactElement {
  return (
    <div
      className="call-container-root mt-2 flex min-h-0 flex-1 flex-col"
      style={{ height: CALL_BOX_HEIGHT_CSS, minHeight: CALL_BOX_MIN_HEIGHT_PX }}
    >
      <div className="call-stage-slot">{children}</div>
    </div>
  );
}
