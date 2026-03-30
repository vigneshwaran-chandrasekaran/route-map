import { useState } from 'react';

function SaveGroup({ markers, onSave, editingGroup, onUpdate, onCancelEdit }) {
  const [name, setName] = useState('');
  const [editedName, setEditedName] = useState(editingGroup?.name || '');

  const isEditing = !!editingGroup;

  const handleSave = () => {
    if (!name.trim() || markers.length === 0) return;
    onSave(name);
    setName('');
  };

  const handleUpdate = () => {
    if (!editedName.trim() || markers.length === 0) return;
    onUpdate(editingGroup.id, editedName);
  };

  const handleCancel = () => {
    onCancelEdit();
  };

  if (markers.length === 0 && !isEditing) return null;

  if (isEditing) {
    return (
      <div className="save-group editing">
        <div className="editing-badge">Editing Group</div>
        <div className="save-group-row">
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
            placeholder="Group name"
            className="save-group-input"
          />
          <button
            className="btn-save btn-update"
            onClick={handleUpdate}
            disabled={!editedName.trim() || markers.length === 0}
          >
            Update
          </button>
        </div>
        <div className="edit-actions">
          <p className="save-group-hint">{markers.length} place(s) • modify markers above, then update</p>
          <button className="btn-cancel-edit" onClick={handleCancel}>
            Cancel Edit
          </button>
        </div>
      </div>
    );
  }

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

function SavedGroups({ groups, onLoad, onDelete, onEdit, editingGroupId }) {
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
            <li key={g.id} className={editingGroupId === g.id ? 'group-editing' : ''}>
              <div
                className="group-info"
                role="button"
                tabIndex={0}
                onClick={() => onLoad(g)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onLoad(g)}
              >
                <strong>{g.name}</strong>
                <small>
                  {g.markers.length} places
                  {g.updatedAt && ' • edited'}
                </small>
              </div>
              <div className="group-actions">
                <button
                  className="btn-edit"
                  onClick={() => onEdit(g)}
                  title="Edit group"
                  aria-label={`Edit ${g.name}`}
                  disabled={editingGroupId === g.id}
                >
                  ✎
                </button>
                <button
                  className="btn-remove"
                  onClick={() => onDelete(g.id)}
                  title="Delete group"
                  aria-label={`Delete ${g.name}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { SaveGroup, SavedGroups };
