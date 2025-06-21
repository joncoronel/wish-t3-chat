import { cn } from "@/lib/utils";

interface ShimmerTextProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

export function ShimmerText({
  children,
  as: Component = "span",
  className,
  duration = 1.2,
  spread = 2,
}: ShimmerTextProps) {
  const dynamicSpread = children.length * spread;

  return (
    <Component
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text",
        "text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]",
        "bg-no-repeat [--bg:linear-gradient(90deg,transparent_calc(50%-var(--spread)),var(--base-gradient-color),transparent_calc(50%+var(--spread)))]",
        "dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff]",
        "animate-shimmer-text",
        className,
      )}
      style={
        {
          "--spread": `${dynamicSpread}px`,
          backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
          animationDuration: `${duration}s`,
        } as React.CSSProperties
      }
    >
      {children}
    </Component>
  );
}
