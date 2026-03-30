import { useState } from 'react';

function SaveGroup({ markers, onSave }) {
  const [name, setName] = useState('');

  const handleSave = () => {
    if (!name.trim() || markers.length === 0) return;
    onSave(name);
    setName('');
  };

  if (markers.length === 0) return null;

  return (
    <div className="save-group">
      <div className="save-group-row">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="Group name (e.g. Friends Home)"
          className="save-group-input"
        />
        <button
          className="btn-save"
          onClick={handleSave}
          disabled={!name.trim()}
        >
          Save
        </button>
      </div>
      <p className="save-group-hint">{markers.length} place(s) will be saved</p>
    </div>
  );
}

function SavedGroups({ groups, onLoad, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  if (groups.length === 0) return null;

  return (
    <div className="saved-groups">
      <button
        className="saved-groups-toggle"
        onClick={() => setExpanded((v) => !v)}
      >
        <span>Saved Groups ({groups.length})</span>
        <span className="toggle-icon">{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <ul className="saved-groups-list">
          {groups.map((g) => (
            <li key={g.id}>
              <div className="group-info" onClick={() => onLoad(g)}>
                <strong>{g.name}</strong>
                <small>{g.markers.length} places</small>
              </div>
              <button
                className="btn-remove"
                onClick={() => onDelete(g.id)}
                title="Delete group"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { SaveGroup, SavedGroups };
