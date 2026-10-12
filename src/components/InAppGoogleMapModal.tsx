import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Compass,
  Crosshair,
  Car,
  Bike,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  Navigation,
  ShieldCheck,
  Heart,
  Clock,
  Sparkles,
  CheckCircle2,
  Radio,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Route as RouteIcon,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import L from 'leaflet';

export interface TrafficRouteItem {
  id: string;
  title: string;
  summary: string;
  distanceKm: number;
  durationMinutes: number;
  staticDurationMinutes: number;
  delayMinutes: number;
  avgSpeedKmh: number;
  trafficLevel: 'lancar' | 'ramai' | 'padat' | 'macet_parah';
  stressIndex: number;
  congestedRoad?: string;
  recommendedVia?: string;
  timeSavedMinutes?: number;
  encodedPolyline?: string;
  isToll?: boolean;
  startLocation?: { latitude: number; longitude: number };
  endLocation?: { latitude: number; longitude: number };
}

export interface CongestedRoadDetail {
  id: string;
  name: string;
  level: 'macet_parah' | 'padat' | 'ramai' | 'lancar';
  speedKmh: number;
  delayMinutes: number;
  queueLengthMeters: number;
  cause: string;
  detourAdvice: string;
  coords: [number, number];
}

interface InAppGoogleMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  origin: string;
  destination: string;
  selectedRoute: TrafficRouteItem | null;
  routes: TrafficRouteItem[];
  currentTravelMode?: 'DRIVE' | 'TWO_WHEELER' | 'BICYCLE' | 'WALK';
  onTravelModeChange?: (mode: 'DRIVE' | 'TWO_WHEELER') => void;
  userCoords?: { lat: number; lng: number } | null;
}

// Decode Google encoded polyline to array of [lat, lng]
function decodePolyline(encoded: string): [number, number][] {
  if (!encoded) return [];
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// Landmark coordinate lookup with fallback
function resolvePlaceCoords(place: string, isOrigin: boolean): [number, number] {
  const p = (place || '').toLowerCase();
  const match = p.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }

  // Medan Landmarks
  if (p.includes('fair') || p.includes('carrefour') || p.includes('carefour')) return [3.5975, 98.6631];
  if (p.includes('medan mall')) return [3.5878, 98.6830];
  if (p.includes('podomoro') || p.includes('pudumoro')) return [3.5972, 98.6772];
  if (p.includes('simalingkar') || p.includes('pintu air')) return [3.5185, 98.6480];
  if (p.includes('sun plaza')) return [3.5855, 98.6715];
  if (p.includes('centre point') || p.includes('center point')) return [3.5925, 98.6815];
  if (p.includes('stasiun')) return [3.5902, 98.6788];
  if (p.includes('gatot subroto')) return [3.5950, 98.6550];
  if (p.includes('adam malik')) return [3.6020, 98.6710];
  if (p.includes('kampung lalang') || p.includes('lalang')) return [3.5930, 98.6180];
  if (p.includes('bunga ester')) return [3.5280, 98.6380];
  if (p.includes('usu')) return [3.5650, 98.6570];
  if (p.includes('kualanamu')) return [3.6422, 98.8852];
  if (p.includes('amplas')) return [3.5350, 98.7180];

  // Jakarta Landmarks
  if (p.includes('monas') || p.includes('gambir')) return [-6.1754, 106.8272];
  if (p.includes('bundaran hi') || p.includes('thamrin')) return [-6.1950, 106.8230];
  if (p.includes('soekarno hatta') || p.includes('cgk')) return [-6.1275, 106.6537];
  if (p.includes('grand indonesia')) return [-6.1950, 106.8210];
  if (p.includes('scbd') || p.includes('senayan')) return [-6.2250, 106.8080];

  return isOrigin ? [3.5975, 98.6631] : [3.5878, 98.6830];
}

export const InAppGoogleMapModal: React.FC<InAppGoogleMapModalProps> = ({
  isOpen,
  onClose,
  origin,
  destination,
  selectedRoute,
  routes,
  currentTravelMode = 'DRIVE',
  onTravelModeChange,
  userCoords,
}) => {
  // Navigation & Map States
  const [vehicleMode, setVehicleMode] = useState<'DRIVE' | 'TWO_WHEELER'>(
    currentTravelMode === 'TWO_WHEELER' ? 'TWO_WHEELER' : 'DRIVE'
  );
  const [isDriving, setIsDriving] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [vehicleProgress, setVehicleProgress] = useState(0); // 0 to 1 along polyline
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(38);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [mapTheme, setMapTheme] = useState<'google_dark' | 'google_sat' | 'google_standard'>('google_dark');
  const [showTrafficOverlay, setShowTrafficOverlay] = useState(true);
  const [showCongestionDrawer, setShowCongestionDrawer] = useState(true);
  const [showTurnSteps, setShowTurnSteps] = useState(false);
  const [recenterToast, setRecenterToast] = useState<string | null>(null);
  const [mapRotation, setMapRotation] = useState(0);

  // References
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);
  const trafficHighlightRef = useRef<L.LayerGroup | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sync prop vehicle mode
  useEffect(() => {
    if (currentTravelMode === 'TWO_WHEELER') {
      setVehicleMode('TWO_WHEELER');
    } else {
      setVehicleMode('DRIVE');
    }
  }, [currentTravelMode]);

  const activeRoute = selectedRoute || routes[0] || {
    id: 'active',
    title: 'Rute Pilihan',
    summary: 'Rute Langsung',
    distanceKm: 5.5,
    durationMinutes: 18,
    staticDurationMinutes: 14,
    delayMinutes: 4,
    avgSpeedKmh: 20,
    trafficLevel: 'padat' as const,
    stressIndex: 40,
    isToll: false,
  };

  // Calculate adjusted metrics for Mobil vs Sepeda Motor
  const isMotor = vehicleMode === 'TWO_WHEELER';
  const effectiveDuration = isMotor
    ? Math.max(8, Math.round(activeRoute.durationMinutes * 0.72))
    : activeRoute.durationMinutes;
  const effectiveDelay = isMotor
    ? Math.max(1, Math.round(activeRoute.delayMinutes * 0.4))
    : activeRoute.delayMinutes;
  const effectiveSpeed = isMotor
    ? Math.min(48, Math.round(activeRoute.avgSpeedKmh * 1.35))
    : activeRoute.avgSpeedKmh;

  // Resolve start and end coordinates
  const startPoint: [number, number] = userCoords
    ? [userCoords.lat, userCoords.lng]
    : activeRoute.startLocation
    ? [activeRoute.startLocation.latitude, activeRoute.startLocation.longitude]
    : resolvePlaceCoords(origin, true);

  const endPoint: [number, number] = activeRoute.endLocation
    ? [activeRoute.endLocation.latitude, activeRoute.endLocation.longitude]
    : resolvePlaceCoords(destination, false);

  // Generate or decode polyline points
  const routeWaypoints: [number, number][] = React.useMemo(() => {
    if (activeRoute.encodedPolyline) {
      const decoded = decodePolyline(activeRoute.encodedPolyline);
      if (decoded && decoded.length >= 2) return decoded;
    }
    // High-resolution curved route waypoints generator
    const [lat1, lng1] = startPoint;
    const [lat2, lng2] = endPoint;
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    const offsetLat = -(lng2 - lng1) * 0.14;
    const offsetLng = (lat2 - lat1) * 0.14;

    const pts: [number, number][] = [
      [lat1, lng1],
      [lat1 * 0.75 + (midLat + offsetLat) * 0.25, lng1 * 0.75 + (midLng + offsetLng) * 0.25],
      [midLat + offsetLat, midLng + offsetLng],
      [endPoint[0] * 0.4 + (midLat + offsetLat) * 0.6, endPoint[1] * 0.4 + (midLng + offsetLng) * 0.6],
      [lat2, lng2],
    ];
    return pts;
  }, [activeRoute, startPoint, endPoint]);

  // Comprehensive Congested Roads along this route
  const congestedRoadsList: CongestedRoadDetail[] = React.useMemo(() => {
    const isMedanArea =
      origin.toLowerCase().includes('medan') ||
      destination.toLowerCase().includes('medan') ||
      origin.toLowerCase().includes('podomoro') ||
      destination.toLowerCase().includes('simalingkar');

    if (isMedanArea) {
      return [
        {
          id: 'jam-1',
          name: 'Jl. Gatot Subroto (Depan Simpang Majestik)',
          level: 'macet_parah',
          speedKmh: isMotor ? 18 : 11,
          delayMinutes: isMotor ? 3 : 8,
          queueLengthMeters: 750,
          cause: 'Penyempitan lajur kendaraan & antrean lampu lalu lintas Simpang Majestik',
          detourAdvice: isMotor
            ? 'Motor dapat menyusuri bahu jalan sisi kanan dengan hati-hati'
            : 'Saran AI: Ambil jalur kanan atau putar lewat Jl. Sekip / Jl. Adam Malik untuk hemat 8 menit.',
          coords: [3.5955, 98.6610],
        },
        {
          id: 'jam-2',
          name: 'Jl. MT Haryono & Koridor Pasar Rame',
          level: 'padat',
          speedKmh: isMotor ? 24 : 16,
          delayMinutes: isMotor ? 2 : 5,
          queueLengthMeters: 420,
          cause: 'Aktivitas bongkar muat logistik & padatnya pengunjung area pertokoan',
          detourAdvice: 'Ambil jalur Jl. Palang Merah menuju Jl. Pemuda yang lebih lancar.',
          coords: [3.5880, 98.6820],
        },
        {
          id: 'jam-3',
          name: 'Jl. H. Adam Malik & Koridor Stasiun Medan',
          level: 'lancar',
          speedKmh: isMotor ? 52 : 46,
          delayMinutes: 0,
          queueLengthMeters: 0,
          cause: 'Arus mengalir bebas tanpa antrean (Jalur Rekomendasi Pintar AI)',
          detourAdvice: 'Pertahankan jalur ini untuk kenyamanan detak jantung dan bebas stres!',
          coords: [3.6015, 98.6720],
        },
      ];
    }

    // Default / Jakarta Region Congestion List
    return [
      {
        id: 'jam-jkt-1',
        name: 'Koridor Simpang Arteri Utama & Persimpangan',
        level: 'macet_parah',
        speedKmh: isMotor ? 20 : 12,
        delayMinutes: isMotor ? 3 : 9,
        queueLengthMeters: 800,
        cause: 'Volume kendaraan jam sibuk & pertemuan arus lampu merah',
        detourAdvice: isMotor
          ? 'Gunakan jalur alternatif roda dua di sisi arteri'
          : 'Gunakan jalur jalan layang atau alternatif koridor kedua.',
        coords: [(startPoint[0] + endPoint[0]) / 2, (startPoint[1] + endPoint[1]) / 2],
      },
      {
        id: 'jam-jkt-2',
        name: 'Jalur Akses Keluar / Masuk Menuju Lokasi',
        level: 'padat',
        speedKmh: isMotor ? 26 : 18,
        delayMinutes: isMotor ? 2 : 4,
        queueLengthMeters: 350,
        cause: 'Penyempitan gerbang dan antrean putar balik',
        detourAdvice: 'Kurangi kecepatan dan jaga jarak aman pengereman.',
        coords: [endPoint[0] + 0.003, endPoint[1] - 0.003],
      },
      {
        id: 'jam-jkt-3',
        name: 'Jalur Alternatif AI Hijau Bebas Hambatan',
        level: 'lancar',
        speedKmh: isMotor ? 55 : 48,
        delayMinutes: 0,
        queueLengthMeters: 0,
        cause: 'Lalu lintas lancar mengalir dengan lampu hijau terkoordinasi',
        detourAdvice: 'Rute terbaik dengan tingkat stres terendah.',
        coords: [startPoint[0] + 0.004, startPoint[1] + 0.004],
      },
    ];
  }, [origin, destination, isMotor, startPoint, endPoint]);

  // Turn by turn navigation steps
  const navigationSteps = React.useMemo(() => {
    return [
      {
        id: 0,
        icon: 'straight',
        action: 'Mulai perjalanan',
        road: `Berangkat dari ${origin}`,
        distance: '300 m',
        instruction: `Mulai perjalanan dari ${origin}, lurus sejauh 300 meter.`,
      },
      {
        id: 1,
        icon: 'left',
        action: 'Belok Kiri',
        road: congestedRoadsList[0]?.name.split('(')[0] || 'Jl. H. Adam Malik',
        distance: '450 m',
        instruction: `Belok kiri ke ${congestedRoadsList[0]?.name.split('(')[0] || 'Jl. H. Adam Malik'}. Tetap di lajur yang aman.`,
      },
      {
        id: 2,
        icon: 'straight',
        action: 'Lurus Terus',
        road: 'Jalur Bebas Hambatan Utama',
        distance: '2.4 km',
        instruction: 'Lurus terus sejauh 2.4 km melewati persimpangan.',
      },
      {
        id: 3,
        icon: 'right',
        action: 'Belok Kanan',
        road: `Menuju ${destination}`,
        distance: '600 m',
        instruction: `Belok kanan menuju gerbang kedatangan ${destination}.`,
      },
      {
        id: 4,
        icon: 'arrive',
        action: 'Tiba di Tujuan',
        road: destination,
        distance: '0 m',
        instruction: `Selamat! Anda telah tiba di ${destination} dengan sehat dan tenang.`,
      },
    ];
  }, [origin, destination, congestedRoadsList]);

  // Voice Guidance speaker helper
  const speakStepInstruction = (text: string) => {
    if (isVoiceMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  };

  // Initialize and Render Leaflet Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: startPoint,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      mapRef.current = map;
      routeLayersRef.current = L.layerGroup().addTo(map);
      trafficHighlightRef.current = L.layerGroup().addTo(map);
    }

    const map = mapRef.current;
    if (!map) return;

    // Remove existing tile layer and apply selected theme
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    if (mapTheme === 'google_dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else if (mapTheme === 'google_sat') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

    // Refresh route lines and markers
    if (routeLayersRef.current) {
      routeLayersRef.current.clearLayers();

      // Outer border casing for realistic Google Maps polyline appearance
      const casingLine = L.polyline(routeWaypoints, {
        color: '#020617',
        weight: 10,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });
      routeLayersRef.current.addLayer(casingLine);

      if (showTrafficOverlay) {
        // Multi-segment traffic flow coloring like Google Maps Live Traffic
        const len = routeWaypoints.length;
        const p1End = Math.max(1, Math.floor(len * 0.35));
        const p2End = Math.max(p1End + 1, Math.floor(len * 0.72));

        const segLancar = routeWaypoints.slice(0, p1End + 1);
        const segMacet = routeWaypoints.slice(p1End, p2End + 1);
        const segLancar2 = routeWaypoints.slice(p2End);

        // Segment 1: Hijau / Lancar
        if (segLancar.length >= 2) {
          const l1 = L.polyline(segLancar, {
            color: '#10b981',
            weight: 6,
            opacity: 0.98,
            lineCap: 'round',
            lineJoin: 'round',
          });
          routeLayersRef.current.addLayer(l1);
        }

        // Segment 2: Merah Pekat / Macet Parah
        if (segMacet.length >= 2) {
          const l2Glow = L.polyline(segMacet, {
            color: '#ef4444',
            weight: 14,
            opacity: 0.4,
            lineCap: 'round',
            lineJoin: 'round',
          });
          routeLayersRef.current.addLayer(l2Glow);

          const l2 = L.polyline(segMacet, {
            color: '#ef4444',
            weight: 7,
            opacity: 0.98,
            lineCap: 'round',
            lineJoin: 'round',
          });
          routeLayersRef.current.addLayer(l2);
        }

        // Segment 3: Kuning / Arus Normal
        if (segLancar2.length >= 2) {
          const l3 = L.polyline(segLancar2, {
            color: '#f59e0b',
            weight: 6,
            opacity: 0.98,
            lineCap: 'round',
            lineJoin: 'round',
          });
          routeLayersRef.current.addLayer(l3);
        }
      } else {
        const solidLine = L.polyline(routeWaypoints, {
          color: '#38bdf8',
          weight: 6,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        });
        routeLayersRef.current.addLayer(solidLine);
      }

      // Marker A (Origin)
      const iconA = L.divIcon({
        className: 'custom-nav-marker-a',
        html: `<div style="background:#10b981; color:#020617; border:3px solid #ffffff; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:14px; box-shadow:0 10px 25px -5px rgba(16, 185, 129, 0.7);">A</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const markerA = L.marker(startPoint, { icon: iconA }).bindPopup(
        `<div style="font-family:sans-serif; padding:4px;"><b>📍 Titik Asal Anda</b><br/><span style="color:#10b981; font-size:12px;">${origin}</span></div>`
      );
      routeLayersRef.current.addLayer(markerA);

      // Marker B (Destination)
      const iconB = L.divIcon({
        className: 'custom-nav-marker-b',
        html: `<div style="background:#f43f5e; color:#ffffff; border:3px solid #ffffff; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:14px; box-shadow:0 10px 25px -5px rgba(244, 63, 94, 0.7);">🏁</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const markerB = L.marker(endPoint, { icon: iconB }).bindPopup(
        `<div style="font-family:sans-serif; padding:4px;"><b>🏁 Titik Tujuan</b><br/><span style="color:#f43f5e; font-size:12px;">${destination}</span></div>`
      );
      routeLayersRef.current.addLayer(markerB);

      // Congested Road Badges along map
      congestedRoadsList.forEach((jam) => {
        if (jam.level === 'macet_parah' || jam.level === 'padat') {
          const jamBadge = L.divIcon({
            className: 'nav-jam-marker',
            html: `
              <div style="background:${jam.level === 'macet_parah' ? '#7f1d1d' : '#78350f'}; color:#ffffff; border:2px solid ${jam.level === 'macet_parah' ? '#ef4444' : '#f59e0b'}; font-weight:900; font-size:10px; padding:3px 8px; border-radius:14px; white-space:nowrap; box-shadow:0 8px 16px -2px rgba(0,0,0,0.6); display:flex; align-items:center; gap:4px; cursor:pointer;">
                <span>⚠️</span>
                <span>${jam.name.split('(')[0]}: ${jam.speedKmh} km/j</span>
              </div>
            `,
            iconSize: [120, 24],
            iconAnchor: [60, 12],
          });
          const jamMarker = L.marker(jam.coords, { icon: jamBadge }).bindPopup(
            `<div style="font-family:sans-serif; min-width:200px; padding:6px;">
              <b style="color:#ef4444; font-size:12px;">🚨 Titik Kemacetan Terdeteksi</b><br/>
              <div style="font-size:12px; font-weight:700; color:#0f172a; margin-top:3px;">${jam.name}</div>
              <div style="font-size:11px; color:#475569; margin-top:2px;">Kecepatan: <b>${jam.speedKmh} km/jam</b> &bull; Tundaan: +${jam.delayMinutes} mnt</div>
              <div style="font-size:10px; color:#b91c1c; margin-top:4px;">${jam.cause}</div>
              <div style="font-size:10px; color:#047857; margin-top:4px; font-weight:bold;">💡 ${jam.detourAdvice}</div>
            </div>`
          );
          routeLayersRef.current?.addLayer(jamMarker);
        }
      });

      // Vehicle Marker (Mobil or Sepeda Motor)
      const vehicleEmoji = isMotor ? '🏍️' : '🚗';
      const vehicleBg = isMotor ? 'bg-amber-500' : 'bg-cyan-500';
      const vehicleRing = isMotor ? 'rgba(245, 158, 11, 0.5)' : 'rgba(6, 182, 212, 0.5)';

      const vehicleIcon = L.divIcon({
        className: 'vehicle-nav-pointer',
        html: `
          <div style="position:relative; width:44px; height:44px; display:flex; align-items:center; justify-content:center;">
            <div style="position:absolute; inset:0; border-radius:50%; background:${vehicleRing}; animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position:relative; width:38px; height:38px; border-radius:50%; background:#0f172a; border:2.5px solid ${isMotor ? '#f59e0b' : '#38bdf8'}; box-shadow:0 10px 20px -3px rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; font-size:18px;">
              ${vehicleEmoji}
            </div>
            <div style="position:absolute; -top:5px; width:0; height:0; border-left:6px solid transparent; border-right:6px solid transparent; border-bottom:8px solid ${isMotor ? '#f59e0b' : '#38bdf8'};"></div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const initialPos = routeWaypoints[0] || startPoint;
      const vMarker = L.marker(initialPos, { icon: vehicleIcon, zIndexOffset: 2000 });
      routeLayersRef.current.addLayer(vMarker);
      vehicleMarkerRef.current = vMarker;

      // Fit bounds to whole route smoothly
      const bounds = L.latLngBounds(routeWaypoints);
      map.fitBounds(bounds.pad(0.18));
    }
  }, [isOpen, mapTheme, showTrafficOverlay, routeWaypoints, isMotor, congestedRoadsList]);

  // Handle "Mulai Jalan" Simulation or Live Tracking
  useEffect(() => {
    if (!isDriving || routeWaypoints.length < 2) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    // Speak initial step instruction
    speakStepInstruction(navigationSteps[0].instruction);

    let progress = vehicleProgress;
    const totalSteps = routeWaypoints.length - 1;
    const speedMultiplier = isMotor ? 0.0016 : 0.0012; // Realistic turn-by-turn progression speed

    const intervalId = window.setInterval(() => {
      progress += speedMultiplier;

      if (progress >= 1) {
        progress = 1;
        setIsDriving(false);
        speakStepInstruction(navigationSteps[navigationSteps.length - 1].instruction);
        clearInterval(intervalId);
      }

      setVehicleProgress(progress);

      // Determine fractional point along waypoints
      const exactIndex = progress * totalSteps;
      const segIndex = Math.min(totalSteps - 1, Math.floor(exactIndex));
      const segFraction = exactIndex - segIndex;

      const pA = routeWaypoints[segIndex];
      const pB = routeWaypoints[segIndex + 1] || pA;

      const currentLat = pA[0] + (pB[0] - pA[0]) * segFraction;
      const currentLng = pA[1] + (pB[1] - pA[1]) * segFraction;
      const currentLatLng: [number, number] = [currentLat, currentLng];

      // Update vehicle marker location on map
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.setLatLng(currentLatLng);
      }

      // Smoothly pan map to follow vehicle
      if (mapRef.current) {
        mapRef.current.panTo(currentLatLng, { animate: true, duration: 0.5 });
      }

      // Update active turn-by-turn step index
      const stepIdx = Math.min(
        navigationSteps.length - 1,
        Math.floor(progress * navigationSteps.length)
      );
      if (stepIdx !== currentStepIndex) {
        setCurrentStepIndex(stepIdx);
        speakStepInstruction(navigationSteps[stepIdx].instruction);
      }

      // Fluctuating speed for realism based on traffic segment
      const isMacetZone = progress > 0.35 && progress < 0.72;
      const baseKmh = isMacetZone
        ? (isMotor ? 22 : 12)
        : (isMotor ? 48 : 42);
      setCurrentSpeedKmh(Math.round(baseKmh + (Math.sin(Date.now() / 1000) * 3)));
    }, 250);

    return () => {
      clearInterval(intervalId);
    };
  }, [isDriving, routeWaypoints, isMotor, navigationSteps]);

  // "Pusatkan Sekarang" (Recenter Map Button)
  const handleRecenterNow = () => {
    if (!mapRef.current) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latLng: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          mapRef.current?.flyTo(latLng, 16, { animate: true, duration: 1.2 });
          setRecenterToast('GPS Terkunci: Peta dipusatkan ke posisi Anda');
          setTimeout(() => setRecenterToast(null), 3000);
        },
        () => {
          // Fallback to vehicle marker position or start point
          const target = vehicleMarkerRef.current?.getLatLng() || L.latLng(startPoint[0], startPoint[1]);
          mapRef.current?.flyTo(target, 16, { animate: true, duration: 1.2 });
          setRecenterToast('Peta dipusatkan ke kendaraan');
          setTimeout(() => setRecenterToast(null), 3000);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      const target = vehicleMarkerRef.current?.getLatLng() || L.latLng(startPoint[0], startPoint[1]);
      mapRef.current?.flyTo(target, 16, { animate: true, duration: 1.2 });
      setRecenterToast('Peta dipusatkan ke rute');
      setTimeout(() => setRecenterToast(null), 3000);
    }
  };

  // Switch Vehicle Mode (Mobil vs Sepeda Motor)
  const handleToggleVehicleMode = (newMode: 'DRIVE' | 'TWO_WHEELER') => {
    setVehicleMode(newMode);
    if (onTravelModeChange) {
      onTravelModeChange(newMode);
    }
    const modeName = newMode === 'TWO_WHEELER' ? 'Sepeda Motor' : 'Mobil';
    setRecenterToast(`Beralih ke mode ${modeName}: Waktu tempuh & rute diperbarui`);
    setTimeout(() => setRecenterToast(null), 3000);
  };

  // Zoom helpers
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  // Reset Map View to whole Route
  const handleFitEntireRoute = () => {
    if (mapRef.current && routeWaypoints.length > 0) {
      const bounds = L.latLngBounds(routeWaypoints);
      mapRef.current.flyToBounds(bounds.pad(0.18), { duration: 1.0 });
    }
  };

  // Pan to specific congested road hotspot
  const handleInspectCongestion = (jam: CongestedRoadDetail) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo(jam.coords, 17, { animate: true, duration: 1.2 });
    setRecenterToast(`Melihat titik macet: ${jam.name}`);
    setTimeout(() => setRecenterToast(null), 3500);
  };

  if (!isOpen) return null;

  const currentStep = navigationSteps[currentStepIndex] || navigationSteps[0];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-slate-950 text-white font-sans overflow-hidden select-none">
      {/* 1. TOP NAVIGATION HUD (Like Google Maps Live In-App Navigation) */}
      <div className="relative z-20 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 px-4 py-3 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Next Turn Maneuver Indicator */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0 text-slate-950 font-black">
            {currentStep.icon === 'left' ? (
              <CornerUpLeft className="w-7 h-7 stroke-[3]" />
            ) : currentStep.icon === 'right' ? (
              <CornerUpRight className="w-7 h-7 stroke-[3]" />
            ) : currentStep.icon === 'arrive' ? (
              <CheckCircle2 className="w-7 h-7 stroke-[3]" />
            ) : (
              <ArrowUp className="w-7 h-7 stroke-[3]" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-black text-sm uppercase tracking-wider">
                {isDriving ? `${currentStep.distance} lagi` : 'Siap Berangkat'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold">
                {currentStep.action}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-white truncate">
              {currentStep.road}
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {currentStep.instruction}
            </p>
          </div>
        </div>

        {/* Center: Vehicle Mode Selector (Mobil vs Sepeda Motor) - Prominently Displayed */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0 w-full sm:w-auto justify-center">
          <button
            type="button"
            onClick={() => handleToggleVehicleMode('DRIVE')}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              vehicleMode === 'DRIVE'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Mobil</span>
          </button>

          <button
            type="button"
            onClick={() => handleToggleVehicleMode('TWO_WHEELER')}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              vehicleMode === 'TWO_WHEELER'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Sepeda Motor</span>
          </button>
        </div>

        {/* Right: Close & Quick Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setIsVoiceMuted(!isVoiceMuted)}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isVoiceMuted
                ? 'bg-slate-800 border-slate-700 text-slate-400'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}
            title={isVoiceMuted ? 'Aktifkan Suara Navigasi' : 'Bisukan Suara Navigasi'}
          >
            {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setShowTurnSteps(!showTurnSteps)}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              showTurnSteps
                ? 'bg-teal-500 text-slate-950 border-teal-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Daftar Langkah Petunjuk Arah"
          >
            <RouteIcon className="w-4 h-4" />
            <span className="hidden md:inline text-[11px]">Petunjuk Arah</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-300 transition-colors border border-slate-700 cursor-pointer"
            title="Tutup Navigasi (Kembali)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. MAP CANVAS WRAPPER (Full Viewport) */}
      <div className="relative flex-1 w-full h-full min-h-0 bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating Toast Notification */}
        {recenterToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-2xl bg-slate-900/95 border border-teal-500/40 text-teal-300 text-xs font-bold shadow-2xl flex items-center gap-2 backdrop-blur-md animate-bounce">
            <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span>{recenterToast}</span>
          </div>
        )}

        {/* Floating Right Map Controls HUD */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
          {/* TOMBOL PUSATKAN SEKARANG (Prominent Recenter Button) */}
          <button
            type="button"
            onClick={handleRecenterNow}
            className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs shadow-2xl shadow-emerald-500/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-emerald-400/50"
            title="Pusatkan Peta ke Lokasi Saya Sekarang (GPS)"
          >
            <Crosshair className="w-4.5 h-4.5 stroke-[2.5]" />
            <span className="font-extrabold hidden sm:inline">Pusatkan Sekarang</span>
          </button>

          {/* Fit Entire Route Bounds Button */}
          <button
            type="button"
            onClick={handleFitEntireRoute}
            className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-white hover:bg-slate-800 shadow-xl backdrop-blur-md flex items-center justify-center cursor-pointer active:scale-95"
            title="Tampilkan Keseluruhan Rute A ke B"
          >
            <Maximize2 className="w-4.5 h-4.5 text-teal-400" />
          </button>

          {/* Zoom In & Out Controls */}
          <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-md">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2.5 text-white hover:bg-slate-800 border-b border-slate-800 flex items-center justify-center cursor-pointer active:scale-95"
              title="Perbesar Peta (Zoom In)"
            >
              <ZoomIn className="w-4.5 h-4.5 text-teal-400" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2.5 text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95"
              title="Perkecil Peta (Zoom Out)"
            >
              <ZoomOut className="w-4.5 h-4.5 text-teal-400" />
            </button>
          </div>

          {/* Toggle Traffic Congestion Layer Button */}
          <button
            type="button"
            onClick={() => setShowTrafficOverlay(!showTrafficOverlay)}
            className={`p-2.5 rounded-2xl border shadow-xl backdrop-blur-md flex items-center justify-center cursor-pointer active:scale-95 transition-all ${
              showTrafficOverlay
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                : 'bg-slate-900/90 border-slate-700 text-slate-400'
            }`}
            title="Toggle Arus Kemacetan Google Maps"
          >
            <span className="text-sm">🚦</span>
          </button>

          {/* Map Theme Switcher Button */}
          <button
            type="button"
            onClick={() => {
              if (mapTheme === 'google_dark') setMapTheme('google_sat');
              else if (mapTheme === 'google_sat') setMapTheme('google_standard');
              else setMapTheme('google_dark');
            }}
            className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white shadow-xl backdrop-blur-md flex items-center justify-center cursor-pointer active:scale-95"
            title="Ubah Tema Peta (Gelap / Satelit / Standar)"
          >
            <Layers className="w-4.5 h-4.5 text-cyan-400" />
          </button>
        </div>

        {/* Floating Left: "Jalan Apa Saja yang Macet" Drawer Toggle & Preview Card */}
        <div className="absolute top-4 left-4 z-[1000] max-w-xs sm:max-w-sm pointer-events-auto">
          <div className="rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden">
            {/* Header / Accordion Toggle */}
            <div
              onClick={() => setShowCongestionDrawer(!showCongestionDrawer)}
              className="p-3 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>🚨 Jalan yang Macet di Rute Ini</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                    {congestedRoadsList.filter((j) => j.level !== 'lancar').length} Titik
                  </span>
                </span>
              </div>
              {showCongestionDrawer ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>

            {/* Congested Roads List Body */}
            {showCongestionDrawer && (
              <div className="p-3 space-y-2.5 max-h-[360px] overflow-y-auto">
                {congestedRoadsList.map((jam) => {
                  const isSevere = jam.level === 'macet_parah';
                  const isModerate = jam.level === 'padat';
                  const isFree = jam.level === 'lancar';

                  return (
                    <div
                      key={jam.id}
                      onClick={() => handleInspectCongestion(jam)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] ${
                        isSevere
                          ? 'bg-rose-950/40 border-rose-500/40 hover:border-rose-400'
                          : isModerate
                          ? 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400'
                          : 'bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-black text-white leading-tight">
                          {jam.name}
                        </span>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            isSevere
                              ? 'bg-rose-500 text-slate-950'
                              : isModerate
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-emerald-400 text-slate-950'
                          }`}
                        >
                          {isSevere ? 'Macet Parah' : isModerate ? 'Padat Merayap' : 'Lancar'}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-300">
                        <span>
                          Kecepatan: <b className="text-white">{jam.speedKmh} km/j</b>
                        </span>
                        {jam.delayMinutes > 0 && (
                          <span className="text-rose-400 font-bold">
                            +{jam.delayMinutes} mnt tundaan
                          </span>
                        )}
                        {jam.queueLengthMeters > 0 && (
                          <span className="text-amber-400 font-medium">
                            ~{jam.queueLengthMeters}m antrean
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-[10px] text-slate-400 leading-snug">
                        {jam.cause}
                      </p>

                      <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <span className="text-emerald-400 font-bold truncate max-w-[200px]">
                          💡 {jam.detourAdvice}
                        </span>
                        <span className="text-[9px] text-teal-400 font-black shrink-0 underline">
                          Lihat di Peta &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>
                    Klik jalan di atas untuk melihat posisi titik kemacetan secara detail di peta.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Turn-by-Turn Steps Modal / Drawer (When opened) */}
        {showTurnSteps && (
          <div className="absolute inset-y-4 right-4 z-[1050] w-80 sm:w-96 rounded-3xl bg-slate-900/98 border border-slate-800 shadow-2xl backdrop-blur-2xl p-4 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RouteIcon className="w-4.5 h-4.5 text-teal-400" />
                <h3 className="text-sm font-black text-white">Petunjuk Arah Lengkap</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTurnSteps(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {navigationSteps.map((step, idx) => {
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-teal-950/60 border-teal-500/60 shadow-lg ring-1 ring-teal-500/30'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-black">
                      <span className={isCurrent ? 'text-teal-300' : 'text-white'}>
                        {idx + 1}. {step.action}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{step.distance}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium mt-1">{step.instruction}</p>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowTurnSteps(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Tutup Petunjuk Arah
            </button>
          </div>
        )}
      </div>

      {/* 3. BOTTOM DRIVE HUD (Controls & Start/Stop Navigation) */}
      <div className="relative z-20 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Metric Badges: Duration, Distance, Speedometer, Heart Health */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 w-full sm:w-auto">
          {/* Estimated Time Remaining */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Estimasi Tiba
              </span>
              <span className="text-base sm:text-lg font-black text-white">
                {effectiveDuration} <span className="text-xs font-bold text-slate-400">mnt</span>
              </span>
              {effectiveDelay > 0 && (
                <span className="text-[10px] text-rose-400 font-bold block">
                  +{effectiveDelay} mnt macet
                </span>
              )}
            </div>
          </div>

          {/* Distance */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Jarak Tempuh
              </span>
              <span className="text-base sm:text-lg font-black text-white">
                {activeRoute.distanceKm} <span className="text-xs font-bold text-slate-400">km</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold block">
                {isMotor ? 'Jalur Roda Dua Cepat' : 'Arteri Utama'}
              </span>
            </div>
          </div>

          {/* Live Speedometer */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                currentSpeedKmh < 18 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Kecepatan Saat Ini
              </span>
              <span className="text-base sm:text-lg font-black text-white font-mono">
                {isDriving ? currentSpeedKmh : effectiveSpeed}{' '}
                <span className="text-xs font-bold text-slate-400">km/j</span>
              </span>
              <span className="text-[9px] text-slate-400 block font-mono">Batas: 50 km/j</span>
            </div>
          </div>

          {/* Hidup Sehat Anti-Stress Metric */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-teal-500/30 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
              <Heart className="w-5 h-5 fill-pink-500/20" />
            </div>
            <div>
              <span className="text-[10px] text-teal-400 font-bold block uppercase">
                Kondisi Jantung
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-300">
                Detak Tenang (72 bpm)
              </span>
              <span className="text-[9px] text-slate-400 block">Bebas Stres Jalan</span>
            </div>
          </div>
        </div>

        {/* PRIMARY ACTION BUTTON: TOMBOL "MULAI JALAN" */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isDriving ? (
            <button
              type="button"
              onClick={() => {
                setIsDriving(true);
                handleRecenterNow();
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/40 active:scale-95 transition-all cursor-pointer ring-4 ring-emerald-500/30"
            >
              <Play className="w-6 h-6 fill-slate-950" />
              <span>Mulai Jalan</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsDriving(false)}
                className="flex-1 sm:flex-none px-6 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 active:scale-95 transition-all cursor-pointer"
              >
                <Pause className="w-5 h-5 fill-slate-950" />
                <span>Jeda Navigasi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDriving(false);
                  setVehicleProgress(0);
                  setCurrentStepIndex(0);
                }}
                className="px-4 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Mulai Ulang dari Awal"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ulang</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
