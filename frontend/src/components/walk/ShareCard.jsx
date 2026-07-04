import { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import html2canvas from 'html2canvas';
import 'leaflet/dist/leaflet.css';

// Local FitBounds component to adjust the static map to the walk path
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      map.fitBounds(positions, { padding: [30, 30] });
    }
  }, [positions, map]);
  return null;
}

export default function ShareCard({ summary, onClose }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!summary) return null;

  const { distanceMeters, durationSeconds, positions } = summary;

  const km = (distanceMeters / 1000).toFixed(2);
  
  // Format Time
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Format Pace
  const getPace = () => {
    if (!distanceMeters || distanceMeters === 0) return '0:00 /km';
    const totalMinutes = durationSeconds / 60;
    const distanceKm = distanceMeters / 1000;
    const rawPace = totalMinutes / distanceKm;
    const paceMin = Math.floor(rawPace);
    const paceSec = Math.floor((rawPace - paceMin) * 60);
    return `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec} /km`;
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // Create clone or print options for high-res output
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.5, // Ultra-high resolution output
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#0f172a',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `walkwars-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-10 overflow-y-auto">
      <div className="relative flex flex-col items-center max-w-sm w-full">
        {/* The Card Container */}
        <div
          ref={cardRef}
          className="w-full bg-slate-900 text-slate-100 p-6 rounded-3xl shadow-2xl border border-slate-800/80 flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex justify-between items-end border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-2xl font-black tracking-tighter text-orange-500">WALKWARS</h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-450 mt-0.5">DAILY CONQUEST</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                WARPATH
              </span>
            </div>
          </div>

          {/* Minimalist Map Container (No Labels Dark Map) */}
          <div className="relative w-full h-[260px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
            {positions && positions.length > 0 ? (
              <MapContainer
                center={positions[0]}
                zoom={15}
                zoomControl={false}
                dragging={false}
                doubleClickZoom={false}
                scrollWheelZoom={false}
                attributionControl={false}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
              >
                <TileLayer
                  crossOrigin="anonymous"
                  url="https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                />
                <Polyline
                  positions={positions}
                  pathOptions={{
                    color: '#f97316', // Glowing Orange path
                    weight: 5,
                    opacity: 0.95,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
                <FitBounds positions={positions} />
              </MapContainer>
            ) : (
              <span className="text-sm text-slate-500">No route coordinates</span>
            )}

            {/* Territory Claimed Overlay Badge */}
            {summary.territoryCreated && (
              <div className="absolute top-3 left-3 z-10 bg-orange-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded shadow-lg border border-orange-500 animate-pulse tracking-wider">
                ⚔️ TERRITORY CLAIMED
              </div>
            )}
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/40 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Distance</span>
              <p className="text-2xl font-black text-white mt-1.5">{km}</p>
              <span className="text-[9px] text-slate-400 mt-0.5">km</span>
            </div>
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/40 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Time</span>
              <p className="text-2xl font-black text-white mt-1.5">{formatTime(durationSeconds)}</p>
              <span className="text-[9px] text-slate-400 mt-0.5">duration</span>
            </div>
            <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/40 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Avg Pace</span>
              <p className="text-2xl font-black text-white mt-1.5 truncate">{getPace().split(' ')[0]}</p>
              <span className="text-[9px] text-slate-400 mt-0.5">/km</span>
            </div>
          </div>

          {/* Footer Card */}
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 border-t border-slate-800/50 pt-4">
            <span className="font-medium">DATE: {new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
            <span className="font-semibold tracking-wider text-slate-400">WALKWARS.RUN</span>
          </div>
        </div>

        {/* Buttons Overlay */}
        <div className="flex gap-4 mt-6 w-full px-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-slate-800 py-3 text-sm font-semibold hover:bg-slate-700 text-slate-200 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50 transition shadow-lg shadow-orange-600/20"
          >
            {downloading ? 'Capturing...' : 'Download Image'}
          </button>
        </div>
      </div>
    </div>
  );
}
