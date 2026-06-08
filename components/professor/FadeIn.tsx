/**
 * FadeIn.tsx
 * Subtle fade-in + slide-up when content appears after loading.
 */

type FadeInProps = {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4;
  className?: string;
};

const DELAY_CLASS: Record<NonNullable<FadeInProps["delay"]>, string> = {
  0: "",
  1: "animate-fade-in-up-delay-1",
  2: "animate-fade-in-up-delay-2",
  3: "animate-fade-in-up-delay-3",
  4: "animate-fade-in-up-delay-4",
};

/**
 * Wraps content in a short fade-in-up animation.
 */
export function FadeIn({
  children,
  delay = 0,
  className = "",
}: FadeInProps): React.ReactElement {
  return (
    <div className={`animate-fade-in-up ${DELAY_CLASS[delay]} ${className}`.trim()}>
      {children}
    </div>
  );
}
