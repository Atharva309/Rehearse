/**
 * CallIcons.tsx
 * SVG icons for call control buttons (Stitch call UI).
 */

type IconProps = {
  className?: string;
};

/**
 * Microphone icon for unmuted state.
 */
export function MicIcon({ className = "w-5 h-5" }: IconProps): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V19H9v2h6v-2h-2v-1.08A7 7 0 0 0 19 11h-2z" />
    </svg>
  );
}

/**
 * Muted microphone with strikethrough (Stitch spec).
 */
export function MicMutedIcon({ className = "w-5 h-5" }: IconProps): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V19H9v2h6v-2h-2v-1.08A7 7 0 0 0 19 11h-2z" />
      <path
        d="M4 4l16 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Camera on/off icon.
 */
export function CameraIcon({ className = "w-5 h-5" }: IconProps): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17 10.5V7a2 2 0 0 0-2-2H5A2 2 0 0 0 3 7v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5l4 2.5V8l-4 2.5z" />
    </svg>
  );
}

/**
 * End call handset icon.
 */
export function PhoneEndIcon({ className = "w-5 h-5" }: IconProps): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .55-.45 1-1 1H4.5c-.55 0-1-.45-1-1v-5c0-.55.45-1 1-1h2.3c3.4-2.4 7.5-3.8 12.2-3.8.55 0 1 .45 1 1v5c0 .55-.45 1-1 1h-1.9c-.55 0-1-.45-1-1v-3.1A15.9 15.9 0 0 0 12 9z" />
    </svg>
  );
}
