/**
 * CallContainer.tsx
 * Contained call area below the pipeline — not full viewport takeover.
 */

"use client";

import {
  APP_NAVBAR_HEIGHT_PX,
  CALL_CONTAINER_PADDING_PX,
  PIPELINE_SECTION_HEIGHT_PX,
} from "@/lib/constants";

type CallContainerProps = {
  children: React.ReactNode;
};

/** Space above call box: header, page padding, back link, pipeline (approx). */
const CALL_CHROME_OFFSET_PX =
  APP_NAVBAR_HEIGHT_PX + PIPELINE_SECTION_HEIGHT_PX + 96;

const containerStyle = {
  "--call-container-padding": `${CALL_CONTAINER_PADDING_PX}px`,
  "--call-chrome-offset": `${CALL_CHROME_OFFSET_PX}px`,
} as React.CSSProperties;

/**
 * Dark call region filling space below navbar + pipeline.
 */
export function CallContainer({ children }: CallContainerProps): React.ReactElement {
  return (
    <div className="call-container-root mx-6 mb-6" style={containerStyle}>
      <div className="call-stage-slot">{children}</div>
    </div>
  );
}
