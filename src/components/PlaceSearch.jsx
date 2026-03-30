import { useRef, useEffect } from 'react';
import { usePlaceSearch } from '../hooks/usePlaceSearch';

function PlaceSearch({ onSelect }) {
  const { query, results, loading, search, clearResults } = usePlaceSearch();
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        clearResults();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearResults]);

  const handleSelect = (place) => {
    onSelect(place);
    clearResults();
  };

  return (
    <div className="place-search" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Search a place to add marker..."
        className="search-input"
        aria-label="Search places"
        autoComplete="off"
      />
      {loading && <div className="search-loading" aria-live="polite">Searching...</div>}
      {results.length > 0 && (
        <ul className="search-results" role="listbox" aria-label="Search results">
          {results.map((place) => (
            <li
              key={place.id}
              role="option"
              tabIndex={0}
              onClick={() => handleSelect(place)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelect(place)}
            >
              {place.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PlaceSearch;
