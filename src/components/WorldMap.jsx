import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom "Vintage" styles
const vintageMapStyle = {
    filter: 'sepia(0.8) contrast(1.2) brightness(0.9) hue-rotate(-15deg)',
};

export default function WorldMap({ idioms, activeConcept, heroMode = false }) {
    // Default center (roughly equirectangular)
    const center = [20, 0];

    const containerClass = heroMode
        ? "h-full w-full absolute inset-0"
        : "h-[400px] w-full border-2 border-black/10 rounded-sm overflow-hidden relative shadow-inner bg-[#F3F0E6]";

    return (
        <div className={containerClass}>
            {!heroMode && (
                <div className="absolute top-2 right-2 z-[500] bg-white/80 px-2 py-1 text-xs font-serif italic border border-black/10">
                    Cartography: OpenStreetMap
                </div>
            )}

            <MapContainer
                center={center}
                zoom={2}
                scrollWheelZoom={false}
                zoomControl={!heroMode} // Disable zoom controls in hero mode
                attributionControl={!heroMode}
                className="h-full w-full"
                style={{ background: '#F3F0E6' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className="vintage-tiles"
                />

                {idioms.map((idiom, idx) => {
                    if (!idiom.geolocation) return null;

                    return (
                        <Marker
                            key={idx}
                            position={[idiom.geolocation.lat, idiom.geolocation.lng]}
                        >
                            <Popup className="font-serif">
                                <div className="text-center">
                                    <div className="text-2xl mb-1">{activeConcept.emoji}</div>
                                    <div className="font-bold text-ink mb-1">{idiom.language}</div>
                                    <div className="italic text-ink/70">"{idiom.script}"</div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            {/* CSS Injection for the map tiles specifically */}
            <style>{`
        .vintage-tiles {
          filter: sepia(0.5) contrast(1.1) brightness(0.95);
        }
      `}</style>
        </div>
    );
}
