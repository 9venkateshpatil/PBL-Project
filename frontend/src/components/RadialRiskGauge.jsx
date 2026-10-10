import React from 'react';

const RadialRiskGauge = ({ score = 20, level = 'LOW', size = 220 }) => {
  // Clamped score
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine colors and glows based on level
  const isLow = level === 'LOW' || clampedScore <= 30;
  const isMed = level === 'MEDIUM' || (clampedScore > 30 && clampedScore <= 70);
  const isHigh = level === 'HIGH' || clampedScore > 70;

  const strokeColor = isHigh
    ? '#EF4444' // red
    : isMed
    ? '#F59E0B' // amber
    : '#22D3EE'; // cyan

  const glowShadow = isHigh
    ? 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.6))'
    : isMed
    ? 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))'
    : 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.6))';

  const badgeBg = isHigh
    ? 'bg-red-500/10 text-red-400 border-red-500/30'
    : isMed
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';

  // SVG parameters (Gauge arc from 135deg to 405deg, total 270deg)
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  // Use a 260-degree sweep
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * clampedScore) / 100;

  return (
    <div className="relative flex flex-col items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        className="transform -rotate-90"
      >
        {/* Background track circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="#1E293B"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          fill="none"
        />

        {/* Animated Active Arc */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke={strokeColor}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          fill="none"
          style={{
            filter: glowShadow,
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
          }}
        />

        {/* Outer subtle ticks / radar ring */}
        <circle
          cx="100"
          cy="100"
          r="92"
          stroke="rgba(34, 211, 238, 0.15)"
          strokeWidth="1"
          strokeDasharray="2 6"
          fill="none"
        />
      </svg>

      {/* Central content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
        <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">
          RISK SCORE
        </span>
        <div className="flex items-baseline space-x-1 my-0.5">
          <span className="text-4xl font-extrabold tracking-tight font-mono text-slate-100">
            {clampedScore}
          </span>
          <span className="text-sm font-semibold text-slate-400">/100</span>
        </div>
        <div className={`mt-1 text-xs px-2.5 py-0.5 rounded-full font-mono uppercase tracking-widest border ${badgeBg}`}>
          {level} RISK
        </div>
      </div>
    </div>
  );
};

export default RadialRiskGauge;
