function MarkerList({ markers, onRemove, onClear, onReorder, numbered }) {
  if (markers.length === 0) return null;

  return (
    <div className="marker-list">
      <div className="marker-list-header">
        <h3>Markers ({markers.length})</h3>
        <button className="btn-clear" onClick={onClear}>
          Clear All
        </button>
      </div>
      <ul>
        {markers.map((m, i) => (
          <li key={m.id}>
            {numbered && <span className="marker-num">{i + 1}</span>}
            <span className="marker-name" title={m.name}>
              {m.name}
            </span>
            {onReorder && (
              <div className="reorder-btns">
                <button
                  className="btn-reorder"
                  onClick={() => onReorder(i, i - 1)}
                  disabled={i === 0}
                  title="Move up"
                >
                  ▲
                </button>
                <button
                  className="btn-reorder"
                  onClick={() => onReorder(i, i + 1)}
                  disabled={i === markers.length - 1}
                  title="Move down"
                >
                  ▼
                </button>
              </div>
            )}
            <button className="btn-remove" onClick={() => onRemove(m.id)}>
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MarkerList;
