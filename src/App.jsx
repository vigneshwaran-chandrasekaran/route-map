import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import NotFound from './pages/NotFound';
import LeafletMap from './pages/LeafletMap';
import MapLibreMap from './pages/MapLibreMap';
import OpenLayersMap from './pages/OpenLayersMap';
import DeckGLMap from './pages/DeckGLMap';
import PigeonMap from './pages/PigeonMap';
import CesiumMap from './pages/CesiumMap';
import './App.scss';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="leaflet" element={<LeafletMap />} />
        <Route path="maplibre" element={<MapLibreMap />} />
        <Route path="openlayers" element={<OpenLayersMap />} />
        <Route path="deckgl" element={<DeckGLMap />} />
        <Route path="pigeon" element={<PigeonMap />} />
        <Route path="cesium" element={<CesiumMap />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
