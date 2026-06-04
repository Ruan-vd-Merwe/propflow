import type { RiskScore } from "@/lib/types";

interface RiskBadgeProps {
  risk: RiskScore;
  size?: "sm" | "md" | "lg";
}

const colourMap = {
  green: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  red: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

export function RiskBadge({ risk, size = "md" }: RiskBadgeProps) {
  const c = colourMap[risk.colour];

  const padding =
    size === "sm" ? "px-2 py-0.5" : size === "lg" ? "px-4 py-2" : "px-3 py-1";
  const textSize =
    size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";
  const scoreSize =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${padding} ${textSize} ${c.bg} ${c.text} ${c.border}`}
    >
      <span className={`rounded-full ${dotSize} ${c.dot}`} />
      <span className={scoreSize}>{risk.score}</span>
      {size !== "sm" && (
        <span className="font-normal opacity-75">{risk.label}</span>
      )}
    </span>
  );
}
