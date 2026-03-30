import { usePlaceSearch } from '../hooks/usePlaceSearch';

function PlaceSearch({ onSelect }) {
  const { query, results, loading, search, clearResults } = usePlaceSearch();

  const handleSelect = (place) => {
    onSelect(place);
    clearResults();
  };

  return (
    <div className="place-search">
      <input
        type="text"
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Search a place to add marker..."
        className="search-input"
      />
      {loading && <div className="search-loading">Searching...</div>}
      {results.length > 0 && (
        <ul className="search-results">
          {results.map((place) => (
            <li key={place.id} onClick={() => handleSelect(place)}>
              {place.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PlaceSearch;
