import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function WalkMap({ center = [12.9716, 77.5946], zoom = 15, children, className = '' }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`${className} z-0`}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url={OSM_URL}
      />
      {children}
    </MapContainer>
  );
}
