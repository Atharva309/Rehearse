/**
 * CallContainer.tsx
 * Contained call area below the pipeline — not full viewport takeover.
 */

"use client";

import {
  APP_NAVBAR_HEIGHT_PX,
  PIPELINE_SECTION_HEIGHT_PX,
} from "@/lib/constants";

type CallContainerProps = {
  children: React.ReactNode;
};

const containerStyle = {
  "--navbar-h": `${APP_NAVBAR_HEIGHT_PX}px`,
  "--pipeline-h": `${PIPELINE_SECTION_HEIGHT_PX}px`,
} as React.CSSProperties;

/**
 * Dark call region filling space below navbar + pipeline.
 */
export function CallContainer({ children }: CallContainerProps): React.ReactElement {
  return (
    <div className="call-container-root" style={containerStyle}>
      {children}
    </div>
  );
}
