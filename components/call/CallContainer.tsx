/**
 * CallContainer.tsx
 * Contained call area below the pipeline — fills remaining viewport height.
 */

"use client";

type CallContainerProps = {
  children: React.ReactNode;
};

/** Explicit call box height — leaves room for navbar, back link, and pipeline. */
export const CALL_BOX_HEIGHT_CSS = "calc(100dvh - 14rem)";

/**
 * Dark call region filling space below navbar + pipeline.
 */
export function CallContainer({ children }: CallContainerProps): React.ReactElement {
  return (
    <div
      className="call-container-root mt-4 flex min-h-[520px] flex-1 flex-col"
      style={{ height: CALL_BOX_HEIGHT_CSS, minHeight: 520 }}
    >
      <div className="call-stage-slot">{children}</div>
    </div>
  );
}
