function MarkerList({ markers, onRemove, onClear }) {
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
        {markers.map((m) => (
          <li key={m.id}>
            <span className="marker-name" title={m.name}>
              {m.name}
            </span>
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
