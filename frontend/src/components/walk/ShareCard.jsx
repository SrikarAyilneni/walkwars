import { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import html2canvas from 'html2canvas';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!summary) return null;

  const { distanceMeters, durationSeconds, positions } = summary;

  const km = (distanceMeters / 1000).toFixed(2);
  const steps = Math.round(distanceMeters / 0.75);
  
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

    // 1. Temporarily translate Leaflet CSS transforms to top/left values
    const leafletElements = cardRef.current.querySelectorAll(
      '.leaflet-map-pane, .leaflet-tile-container, .leaflet-marker-pane, .leaflet-marker-icon, .leaflet-tile, .leaflet-zoom-animated, canvas'
    );
    const originalStyles = [];

    leafletElements.forEach((el) => {
      const transform = el.style.transform;
      if (transform) {
        const match3d = transform.match(/translate3d\(([^px]+)px,\s*([^px]+)px,\s*([^px]+)px\)/);
        const match2d = transform.match(/translate\(([^px]+)px,\s*([^px]+)px\)/);

        let x = 0, y = 0;
        if (match3d) {
          x = parseFloat(match3d[1]);
          y = parseFloat(match3d[2]);
        } else if (match2d) {
          x = parseFloat(match2d[1]);
          y = parseFloat(match2d[2]);
        }

        if (match3d || match2d) {
          originalStyles.push({
            el,
            transform,
            left: el.style.left,
            top: el.style.top,
          });
          el.style.transform = 'none';
          el.style.left = `${parseFloat(el.style.left || 0) + x}px`;
          el.style.top = `${parseFloat(el.style.top || 0) + y}px`;
        }
      }
    });

    // 2. Intercept window.getComputedStyle to translate oklch/oklab to rgb/rgba
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function (el, pseudoElt) {
      const style = originalGetComputedStyle.call(window, el, pseudoElt);
      return new Proxy(style, {
        get(target, prop) {
          const value = target[prop];
          if (typeof value === 'string') {
            let processed = value;
            if (processed.includes('oklch')) {
              processed = processed.replace(/oklch\([^)]+\)/gi, (m) => oklchToRgb(m));
            }
            if (processed.includes('oklab')) {
              processed = processed.replace(/oklab\([^)]+\)/gi, (m) => oklabToRgb(m));
            }
            return processed;
          }
          if (prop === 'getPropertyValue') {
            return function (propertyName) {
              const val = target.getPropertyValue(propertyName);
              if (typeof val === 'string') {
                let processedVal = val;
                if (processedVal.includes('oklch')) {
                  processedVal = processedVal.replace(/oklch\([^)]+\)/gi, (m) => oklchToRgb(m));
                }
                if (processedVal.includes('oklab')) {
                  processedVal = processedVal.replace(/oklab\([^)]+\)/gi, (m) => oklabToRgb(m));
                }
                return processedVal;
              }
              return val;
            };
          }
          if (typeof value === 'function') {
            return value.bind(target);
          }
          return value;
        }
      });
    };

    try {
      // 3. Generate Canvas via html2canvas
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.5, // Ultra-high resolution output
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#0f172a',
        logging: true,
      });

      // 4. Convert Canvas to Blob and handle download / sharing
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Canvas to Blob conversion returned null');

      const file = new File([blob], `walkwars-${Date.now()}.png`, { type: 'image/png' });

      // Try native sharing first (for modern mobile browsers over secure ngrok HTTPS)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'WalkWars Conquest',
          text: `Check out my walk! I traveled ${km} km. Join WalkWars!`,
        });
      } else {
        // Fallback: traditional download link utilizing Object URL
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `walkwars-${Date.now()}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Share canceled by user');
        return;
      }
      console.error('Failed to generate image', err);
      alert(`Failed to generate download image:\n${err.name}: ${err.message}\n\nStack: ${err.stack || 'No stack available'}`);
    } finally {
      // 5. Restore original styles & getComputedStyle
      window.getComputedStyle = originalGetComputedStyle;
      originalStyles.forEach(({ el, transform, left, top }) => {
        el.style.transform = transform;
        el.style.left = left;
        el.style.top = top;
      });
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
                preferCanvas={true}
                fadeAnimation={false}
                zoomAnimation={false}
                markerZoomAnimation={false}
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
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/40 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Distance</span>
              <p className="text-2xl font-black text-white mt-1">{km}</p>
              <span className="text-[9px] text-slate-400 mt-0.5 font-medium">km</span>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/40 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Time</span>
              <p className="text-2xl font-black text-white mt-1">{formatTime(durationSeconds)}</p>
              <span className="text-[9px] text-slate-400 mt-0.5 font-medium">duration</span>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/40 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Avg Pace</span>
              <p className="text-2xl font-black text-white mt-1 truncate">{getPace().split(' ')[0]}</p>
              <span className="text-[9px] text-slate-400 mt-0.5 font-medium">/km</span>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/40 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Steps</span>
              <p className="text-2xl font-black text-white mt-1">{steps.toLocaleString()}</p>
              <span className="text-[9px] text-slate-400 mt-0.5 font-medium">steps</span>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/40 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Calories</span>
              <p className="text-2xl font-black text-white mt-1">{summary.caloriesBurnt ?? 0}</p>
              <span className="text-[9px] text-slate-400 mt-0.5 font-medium">kcal</span>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/40 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Streak</span>
              <p className="text-2xl font-black text-white mt-1">{user?.streakCount ?? 0}</p>
              <span className="text-[9px] text-slate-400 mt-0.5 font-medium">days</span>
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

// Helper to convert oklch(...) to rgb(...) or rgba(...) for html2canvas compatibility
function oklchToRgb(oklchStr) {
  const cleanStr = oklchStr.replace(/,/g, ' ');
  const regex = /oklch\(\s*([0-9.%]+)\s+([0-9.%]+)\s+([0-9.deg%]+)(?:\s*\/\s*([0-9.%]+))?\s*\)/i;
  const match = cleanStr.match(regex);
  if (!match) return 'rgb(0, 0, 0)';

  const L = match[1];
  const C = match[2];
  const H = match[3];
  const alphaStr = match[4];

  let lVal = L.endsWith('%') ? parseFloat(L) / 100 : parseFloat(L);
  let cVal = C.endsWith('%') ? parseFloat(C) / 100 : parseFloat(C);
  let hVal = H.endsWith('deg') ? parseFloat(H) : H.endsWith('%') ? (parseFloat(H) / 100) * 360 : parseFloat(H);

  let alpha = 1;
  if (alphaStr) {
    alpha = alphaStr.endsWith('%') ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
  }

  lVal = Math.max(0, Math.min(1, lVal));
  cVal = Math.max(0, cVal);

  const hRad = (hVal * Math.PI) / 180;
  const a = cVal * Math.cos(hRad);
  const b = cVal * Math.sin(hRad);

  const l_ = lVal + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = lVal - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = lVal - 0.0894841775 * a - 1.2914855480 * b;

  const l_lin = l_ * l_ * l_;
  const m_lin = m_ * m_ * m_;
  const s_lin = s_ * s_ * s_;

  let r_lin = +4.0767416621 * l_lin - 3.3077115913 * m_lin + 0.2309699292 * s_lin;
  let g_lin = -1.2684380046 * l_lin + 2.6097574011 * m_lin - 0.3413193965 * s_lin;
  let b_lin = -0.0041960863 * l_lin - 0.7034186147 * m_lin + 1.7076147010 * s_lin;

  r_lin = Math.max(0, Math.min(1, r_lin));
  g_lin = Math.max(0, Math.min(1, g_lin));
  b_lin = Math.max(0, Math.min(1, b_lin));

  const toSRGB = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  const rgbR = Math.round(toSRGB(r_lin) * 255);
  const rgbG = Math.round(toSRGB(g_lin) * 255);
  const rgbB = Math.round(toSRGB(b_lin) * 255);

  if (alphaStr) {
    return `rgba(${rgbR}, ${rgbG}, ${rgbB}, ${alpha})`;
  }
  return `rgb(${rgbR}, ${rgbG}, ${rgbB})`;
}

// Helper to convert oklab(...) to rgb(...) or rgba(...) for html2canvas compatibility
function oklabToRgb(oklabStr) {
  const cleanStr = oklabStr.replace(/,/g, ' ');
  const regex = /oklab\(\s*([0-9.%]+)\s+([-0-9.%]+)\s+([-0-9.%]+)(?:\s*\/\s*([0-9.%]+))?\s*\)/i;
  const match = cleanStr.match(regex);
  if (!match) return 'rgb(0, 0, 0)';

  const L = match[1];
  const aStr = match[2];
  const bStr = match[3];
  const alphaStr = match[4];

  let lVal = L.endsWith('%') ? parseFloat(L) / 100 : parseFloat(L);
  let aVal = aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr);
  let bVal = bStr.endsWith('%') ? parseFloat(bStr) / 100 : parseFloat(bStr);

  let alpha = 1;
  if (alphaStr) {
    alpha = alphaStr.endsWith('%') ? parseFloat(alphaStr) / 100 : parseFloat(alphaStr);
  }

  lVal = Math.max(0, Math.min(1, lVal));

  const l_ = lVal + 0.3963377774 * aVal + 0.2158037573 * bVal;
  const m_ = lVal - 0.1055613458 * aVal - 0.0638541728 * bVal;
  const s_ = lVal - 0.0894841775 * aVal - 1.2914855480 * bVal;

  const l_lin = l_ * l_ * l_;
  const m_lin = m_ * m_ * m_;
  const s_lin = s_ * s_ * s_;

  let r_lin = +4.0767416621 * l_lin - 3.3077115913 * m_lin + 0.2309699292 * s_lin;
  let g_lin = -1.2684380046 * l_lin + 2.6097574011 * m_lin - 0.3413193965 * s_lin;
  let b_lin = -0.0041960863 * l_lin - 0.7034186147 * m_lin + 1.7076147010 * s_lin;

  r_lin = Math.max(0, Math.min(1, r_lin));
  g_lin = Math.max(0, Math.min(1, g_lin));
  b_lin = Math.max(0, Math.min(1, b_lin));

  const toSRGB = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  const rgbR = Math.round(toSRGB(r_lin) * 255);
  const rgbG = Math.round(toSRGB(g_lin) * 255);
  const rgbB = Math.round(toSRGB(b_lin) * 255);

  if (alphaStr) {
    return `rgba(${rgbR}, ${rgbG}, ${rgbB}, ${alpha})`;
  }
  return `rgb(${rgbR}, ${rgbG}, ${rgbB})`;
}
