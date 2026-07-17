import { motion } from "framer-motion";
import type { RiskLevel } from "@/types/admin.security";

const LEVEL_COLOR: Record<string, string> = {
  LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#f97316", CRITICAL: "#ef4444",
};

/** Radial 0–100 risk gauge with an animated arc — matches the enterprise look. */
export function RiskGauge({ score, level, size = 132 }: {
  score: number; level: RiskLevel; size?: number;
}) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const color = LEVEL_COLOR[level] ?? "#64748b";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={9}
          className="stroke-ink-900/[0.07]" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={9}
          strokeLinecap="round" stroke={color}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-serif text-3xl text-ink-900">{score}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{level}</p>
        </div>
      </div>
    </div>
  );
}
