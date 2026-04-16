import { useState, useRef, useEffect } from 'react';
import useStore from '../store/useStore';

export function UserDropdown() {
  const userId = useStore((s) => s.userId);
  const setUserId = useStore((s) => s.setUserId);
  const users = useStore((s) => s.users);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selectedUser = users.find((u) => u.id === userId);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="custom-dropdown" ref={ref}>
      <button
        className="custom-dropdown-trigger"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <span className="custom-dropdown-text">
          {selectedUser?.name || 'Select user...'}
        </span>
        <span className={`custom-dropdown-arrow ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="custom-dropdown-menu">
          {users.map((u) => (
            <button
              key={u.id}
              className={`custom-dropdown-item ${u.id === userId ? 'active' : ''}`}
              onClick={() => {
                setUserId(u.id);
                setOpen(false);
              }}
              type="button"
            >
              <span className="custom-dropdown-item-avatar">
                {u.name.charAt(0)}
              </span>
              <span className="custom-dropdown-item-name">{u.name}</span>
              {u.id === userId && <span className="custom-dropdown-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
