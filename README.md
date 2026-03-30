# Route Map

Multi-marker route map app with place search, route connectivity, and layer switching — built with React, Vite, and open-source map libraries.

**Live Demo:** [https://route-map-five.vercel.app/](https://route-map-five.vercel.app/)

## Features

- Search places via Nominatim (no API key needed)
- Click on map to add markers with reverse geocoding
- Route polylines between markers with distance calculation
- Reorder, remove, and manage markers
- Save/load/edit named marker groups (localStorage)
- Multiple base layers (Street, Satellite, Topo, Dark, Light)
- Optional overlay layers (Transport, Cycling, Hiking trails)
- Responsive sidebar with mobile drawer
- Dark mode support

## Maps

| Library | Route | Status |
|---------|-------|--------|
| Leaflet | `/leaflet` | Ready |
| MapLibre GL JS | `/maplibre` | Coming Soon |
| OpenLayers | `/openlayers` | Coming Soon |

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables (optional)

Copy `.env.example` to `.env` and fill in any optional keys:

```bash
cp .env.example .env
```

## Tech Stack

- React 19 + Vite 8
- React Router v7
- Leaflet + react-leaflet
- Axios
- Nominatim geocoding API
