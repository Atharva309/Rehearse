/**
 * CallContainer.tsx
 * Contained call area below the pipeline — fills remaining viewport height.
 */

"use client";

type CallContainerProps = {
  children: React.ReactNode;
};

/** Minimum call box height on small screens. */
export const CALL_BOX_MIN_HEIGHT_PX = 680;

/**
 * Dark call region filling all space below navbar, back link, and pipeline.
 */
export function CallContainer({ children }: CallContainerProps): React.ReactElement {
  return (
    <div
      className="call-container-root mt-2 flex min-h-0 flex-1 flex-col"
      style={{ minHeight: CALL_BOX_MIN_HEIGHT_PX }}
    >
      <div className="call-stage-slot">{children}</div>
    </div>
  );
}
