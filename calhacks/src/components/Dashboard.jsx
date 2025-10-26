import React from 'react';

const Dashboard = ({ entries }) => {
  return (
    <div className="dashboard-container">
      <h2>Audio Dashboard</h2>
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Minute</th>
            <th>Transcript</th>
            <th>Confidence Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => (
            <tr key={entry.id || idx}>
              <td>{entry.minuteLabel || `Minute ${idx + 1}`}</td>
              <td>{entry.transcript || <span className="placeholder">Processing...</span>}</td>
              <td>{entry.confidence !== undefined ? `${(entry.confidence * 100).toFixed(1)}%` : <span className="placeholder">-</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
