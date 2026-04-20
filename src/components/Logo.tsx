import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
  showWordmark?: boolean;
  size?: number;
}

export const Logo = ({ className, variant = "dark", showWordmark = true, size = 20 }: LogoProps) => {
  const textColor = variant === "dark" ? "text-foreground" : "text-white";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="rounded-md bg-accent flex items-center justify-center"
        style={{ width: size + 4, height: size + 4 }}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" fill="none" width={size - 4} height={size - 4}>
          <path
            d="M5 6h14v9a2 2 0 0 1-2 2H10l-5 4V6z"
            stroke="white"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
      {showWordmark && (
        <span className={cn("font-serif", textColor)} style={{ fontSize: size }}>
          ReviewReply
        </span>
      )}
    </div>
  );
};
