export default function ScoreGauge({ score }) {
  const value = typeof score === 'number' ? score : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const color = value >= 80 ? '#2563EB' : value >= 50 ? '#F59E0B' : '#EF4444';
  const label = value >= 80 ? 'Excellent' : value >= 50 ? 'Needs Work' : 'Critical';

  return (
    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
      <svg width="112" height="112" viewBox="0 0 100 100" className="-rotate-90 filter drop-shadow-sm">
        {/* Background track */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="8" />
        {/* Animated Progress circle */}
        <circle
          cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={typeof score === 'number' ? offset : circumference}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-heading font-extrabold text-2xl tracking-tight" style={{ color }}>
          {typeof score === 'number' ? score : '—'}
        </span>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
          {typeof score === 'number' ? label : 'Score'}
        </span>
      </div>
    </div>
  );
}

