import { useState } from 'react';

export function Tooltip({ children, blockedByTitles }) {
  const [visible, setVisible] = useState(false);

  if (!blockedByTitles || blockedByTitles.length === 0) return children;

  return (
    <div
      className="tooltip-container"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="tooltip">
          <div className="tooltip-title">Waiting for</div>
          <ul className="tooltip-list">
            {blockedByTitles.map((title, i) => (
              <li key={i}>{title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
