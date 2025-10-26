import React from 'react';

// Segmented circular indicator using SVG arcs
const SegmentedCircle = ({ value = 0, size = 64, segments = 10, stroke = 8, gapDeg = 4 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - stroke) / 2;
  const segAngle = 360 / segments;
  const filled = Math.round(Math.max(0, Math.min(1, value)) * segments);

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const arcForSegment = (i) => {
    const startAngle = i * segAngle + gapDeg / 2;
    const endAngle = (i + 1) * segAngle - gapDeg / 2;
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  return (
    <div className="confidence-circle" role="img" aria-label={`Confidence ${Math.round(value * 100)}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="c-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.45" />
          </filter>
        </defs>
        <g filter="url(#c-shadow)">
          {Array.from({ length: segments }).map((_, i) => (
            <path
              key={i}
              d={arcForSegment(i)}
              stroke={i < filled ? 'url(#gradActive)' : 'rgba(255,255,255,0.06)'}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </g>
        <defs>
          <linearGradient id="gradActive" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="confidence-text">
          {Math.round(value * 100)}%
        </text>
      </svg>
    </div>
  );
};

const Dashboard = ({ entries }) => {
  return (
    <div className="dashboard-container">
      <h2>Audio Dashboard</h2>
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Minute</th>
            <th>Transcript</th>
            <th style={{ width: 140 }}>Parkinson's Confidence</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={entry.id || idx}>
              <td>{entry.minuteLabel || `Minute ${idx + 1}`}</td>
              <td>{entry.transcript || <span className="placeholder">Processing...</span>}</td>
              <td>
                {entry.confidence !== undefined ? (
                  <div className="confidence-cell">
                    <SegmentedCircle value={entry.confidence} size={64} segments={10} stroke={8} gapDeg={6} />
                  </div>
                ) : (
                  <span className="placeholder">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 13 }}>
        The segmented circle shows an estimated confidence that the audio contains Parkinson's-related markers. Higher = more likely.
      </p>
    </div>
  );
};

export default Dashboard;
