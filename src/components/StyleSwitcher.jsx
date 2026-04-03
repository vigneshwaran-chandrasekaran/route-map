function StyleSwitcher({ styles, activeStyle, onStyleChange }) {
  return (
    <div className="style-switcher">
      <label className="style-label">Map Style</label>
      <div className="style-options">
        {Object.entries(styles).map(([key, style]) => (
          <button
            key={key}
            className={`style-btn ${activeStyle === key ? 'active' : ''}`}
            onClick={() => onStyleChange(key)}
          >
            {style.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default StyleSwitcher;
