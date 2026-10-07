import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  badge?: ReactNode;
  sub?: string;
  sparklineColor?: string;
  iconBg?: string;
  iconColor?: string;
  accent?: string;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  badge,
  sub,
  sparklineColor,
  iconBg = "bg-slate-50",
  iconColor = "text-slate-500",
  accent,
  className,
}: StatCardProps) {
  const finalIconBg = accent ? undefined : iconBg;
  const finalIconStyle = accent ? { backgroundColor: `${accent}15`, color: accent } : undefined;

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {label}
          </p>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl text-sm",
              finalIconBg,
              iconColor
            )}
            style={finalIconStyle}
            aria-hidden="true"
          >
            {icon}
          </div>
        </div>

        {/* Value */}
        <div className="mt-2 text-2xl font-black tracking-tight text-slate-900 whitespace-nowrap">
          {value}
        </div>
      </div>

      {/* Footer / Badge & Sub */}
      <div className="mt-3.5">
        {(badge || sub) && (
          <div className="flex items-center justify-between gap-2 text-[11px]">
            {badge && <div className="shrink-0">{badge}</div>}
            {sub && (
              <span className="ml-auto truncate font-medium text-slate-400 text-[11px]">
                {sub}
              </span>
            )}
          </div>
        )}

        {/* Mini Sparkline Curve */}
        {sparklineColor && (
          <div className="mt-2 -mx-1">
            <svg
              className="h-6 w-full overflow-visible opacity-80"
              viewBox="0 0 100 24"
              fill="none"
              preserveAspectRatio="none"
            >
              <path
                d="M0 19 C 20 14, 40 20, 60 11 C 80 4, 90 14, 100 8"
                stroke={sparklineColor}
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M0 19 C 20 14, 40 20, 60 11 C 80 4, 90 14, 100 8 L 100 24 L 0 24 Z"
                fill={sparklineColor}
                opacity="0.08"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
