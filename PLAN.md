# Route Map — Implementation Plan

## Goal
Build a multi-marker map app with place search using **three different open-source map libraries**, each on its own route. All use **Nominatim** (OpenStreetMap) for free geocoding — no API keys needed.

## Shared Features (All Maps)
- Search box with place autocomplete (Nominatim API)
- Add markers by searching and selecting a place
- Multiple markers displayed simultaneously
- Map auto-fits to show all markers
- Marker list with remove option
- No API keys required

## Routes & Packages

| # | Route | Map Library | Package | Status |
|---|-------|-------------|---------|--------|
| 1 | `/leaflet` | Leaflet | `react-leaflet` + `leaflet` | ✅ Done |
| 2 | `/maplibre` | MapLibre GL JS | `react-map-gl` + `maplibre-gl` | ✅ Done |
| 3 | `/openlayers` | OpenLayers | `ol` | ✅ Done |

## Geocoding
- **Nominatim API** — free, no key, no signup
- Endpoint: `https://nominatim.openstreetmap.org/search`
- Rate limit: 1 request/second (debounced search)

## Tile Sources
- Leaflet & OpenLayers: OpenStreetMap raster tiles
- MapLibre: OpenFreeMap vector tiles (no key)

## Implementation Order
1. ✅ Base React app with Vite + React Router + Axios
2. ✅ Leaflet map page (`/leaflet`)
3. ✅ MapLibre map page (`/maplibre`)
4. ✅ OpenLayers map page (`/openlayers`)
5. ✅ Update Home page with links to all maps
