import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/** Dehradun city centre, used when there is nothing to fit. */
const DOON = [30.3165, 78.0322];

const TYPES = {
    business: { label: 'Businesses', color: '#233f74' },
    place: { label: 'Places', color: '#0d9488' },
};

/** Popup built with DOM nodes (textContent), never HTML strings: names come from the database. */
function popupContent(marker, onOpen) {
    const root = document.createElement('div');
    root.className = 'doon-map-popup';
    const title = document.createElement('a');
    title.href = marker.path;
    title.textContent = marker.title;
    title.className = 'doon-map-popup-title';
    title.addEventListener('click', (e) => {
        e.preventDefault();
        onOpen(marker.path);
    });
    root.appendChild(title);
    const meta = [marker.category, marker.area].filter(Boolean).join(' · ');
    if (meta) {
        const p = document.createElement('p');
        p.textContent = meta;
        root.appendChild(p);
    }
    const link = document.createElement('a');
    link.href = marker.path;
    link.textContent = marker.type === 'place' ? 'View place →' : 'View business →';
    link.className = 'doon-map-popup-link';
    link.addEventListener('click', (e) => {
        e.preventDefault();
        onOpen(marker.path);
    });
    root.appendChild(link);
    return root;
}

/**
 * Interactive map of listings with confirmed locations (OpenStreetMap tiles).
 * Scroll-zoom turns on only after the map is clicked, so it never traps page scrolling.
 */
export default function DoonMap({ markers }) {
    const element = useRef(null);
    const map = useRef(null);
    const layer = useRef(null);
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const counts = useMemo(() => ({
        all: markers.length,
        business: markers.filter((m) => m.type === 'business').length,
        place: markers.filter((m) => m.type === 'place').length,
    }), [markers]);
    const shown = useMemo(() => (filter === 'all' ? markers : markers.filter((m) => m.type === filter)), [markers, filter]);

    useEffect(() => {
        const instance = L.map(element.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true }).setView(DOON, 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }).addTo(instance);
        instance.on('click', () => instance.scrollWheelZoom.enable());
        instance.on('mouseout', () => instance.scrollWheelZoom.disable());
        layer.current = L.layerGroup().addTo(instance);
        map.current = instance;
        return () => {
            instance.remove();
            map.current = null;
        };
    }, []);

    useEffect(() => {
        const instance = map.current;
        if (!instance) {
            return;
        }
        layer.current.clearLayers();
        const points = shown.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lng));
        points.forEach((m) => {
            L.circleMarker([m.lat, m.lng], {
                radius: 8,
                color: '#ffffff',
                weight: 2,
                fillColor: TYPES[m.type]?.color || TYPES.business.color,
                fillOpacity: 0.95,
            })
                .bindPopup(popupContent(m, navigate), { closeButton: true, minWidth: 180 })
                .bindTooltip(m.title, { direction: 'top', offset: [0, -8] })
                .addTo(layer.current);
        });
        if (points.length > 1) {
            instance.fitBounds(L.latLngBounds(points.map((m) => [m.lat, m.lng])), { padding: [32, 32], maxZoom: 15 });
        } else if (points.length === 1) {
            instance.setView([points[0].lat, points[0].lng], 15);
        }
    }, [shown, navigate]);

    return (
        <div className="isolate overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 p-3">
                {[
                    ['all', 'All'],
                    ['business', TYPES.business.label],
                    ['place', TYPES.place.label],
                ]
                    .filter(([key]) => key === 'all' || counts[key] > 0)
                    .map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            aria-pressed={filter === key}
                            onClick={() => setFilter(key)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${filter === key ? 'bg-navy-700 text-white' : 'border border-stone-300 bg-white text-stone-700 hover:border-navy-500'}`}
                        >
                            {key !== 'all' && <span className="h-2.5 w-2.5 rounded-full border border-white" style={{ background: TYPES[key].color }} aria-hidden="true" />}
                            {label} <span className="opacity-70">{counts[key]}</span>
                        </button>
                    ))}
                <span className="ml-auto hidden text-xs text-stone-500 sm:inline">Click the map to zoom with your scroll wheel</span>
            </div>
            <div ref={element} className="h-[22rem] w-full sm:h-[28rem]" role="region" aria-label="Map of Dehradun listings" />
        </div>
    );
}
