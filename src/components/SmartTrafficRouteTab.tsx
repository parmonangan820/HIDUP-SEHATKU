import React, { useState, useEffect, useRef } from 'react';
import { useHealth } from '../context/HealthContext';
import {
  Navigation,
  Sparkles,
  MapPin,
  Car,
  Bike,
  Compass,
  Heart,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingDown,
  Wind,
  Droplets,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  RefreshCw,
  Gauge,
  Flame,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface TrafficRoute {
  id: string;
  title: string;
  summary: string;
  distanceKm: number;
  durationMinutes: number;
  staticDurationMinutes: number;
  delayMinutes: number;
  avgSpeedKmh: number;
  trafficLevel: 'lancar' | 'ramai' | 'padat' | 'macet_parah';
  stressIndex: number; // 0 - 100
  congestedRoad?: string;
  recommendedVia?: string;
  timeSavedMinutes?: number;
  encodedPolyline?: string;
  isToll: boolean;
}

interface AIEvaluation {
  bestRouteId: string;
  recommendationTitle: string;
  recommendationReason: string;
  stressAnalysis: string;
  healthTravelTips: string[];
  bestDepartureWindow: string;
  promoCatchphrase: string;
}

const PRESET_ORIGINS = [
  'Podomoro City Deli Medan (Pudumoro)',
  'Monas, Gambir, Jakarta Pusat',
  'SCBD, Senayan, Jakarta Selatan',
  'Kelapa Gading, Jakarta Utara',
  'BSD City, Tangerang Selatan',
];

const PRESET_DESTINATIONS = [
  'Pintu Air 4 Simalingkar B, Medan',
  'Bandara Internasional Soekarno-Hatta (CGK)',
  'RS Jantung Harapan Kita, Slipi, Jakarta Barat',
  'Grand Indonesia Mall, Jakarta Pusat',
  'Stasiun Gambir, Gambir, Jakarta Pusat',
];

export const SmartTrafficRouteTab: React.FC = () => {
  const { profile } = useHealth();
  const [origin, setOrigin] = useState('Podomoro City Deli Medan (Pudumoro)');
  const [destination, setDestination] = useState('Pintu Air 4 Simalingkar B, Medan');
  const [travelMode, setTravelMode] = useState<'DRIVE' | 'TWO_WHEELER' | 'BICYCLE' | 'WALK'>('DRIVE');
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [routes, setRoutes] = useState<TrafficRoute[]>([]);
  const [smartAlertText, setSmartAlertText] = useState<string>('');
  const [timeSavedMinutes, setTimeSavedMinutes] = useState<number>(0);
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluation | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-2');
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [geoLocating, setGeoLocating] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const trafficLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylinesRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapsApiKey, setMapsApiKey] = useState('AIzaSyAii5jmjWw-WbGATErdNheY-41dCRJmSeY');

  // Fetch Google Maps API Key
  useEffect(() => {
    fetch('/api/google-maps/key')
      .then((res) => res.json())
      .then((data) => {
        if (data.apiKey) setMapsApiKey(data.apiKey);
      })
      .catch(() => {});
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;
    try {
      setOptions({
        key: mapsApiKey,
        v: 'weekly',
      });

      importLibrary('maps')
        .then((mapsLib: any) => {
          if (!isMounted || !mapContainerRef.current) return;

          // Default center: Medan or Jakarta
          const isMedan = origin.toLowerCase().includes('medan') || origin.toLowerCase().includes('podomoro') || origin.toLowerCase().includes('pudumoro');
          const initialLocation = isMedan
            ? { lat: 3.5908, lng: 98.6743 } // Medan City Center
            : { lat: -6.175392, lng: 106.827153 }; // Jakarta Center

          const map = new mapsLib.Map(mapContainerRef.current, {
            center: initialLocation,
            zoom: isMedan ? 13 : 12,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
              { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
              { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#475569' }] },
              { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
            ],
          });

          const trafficLayer = new mapsLib.TrafficLayer();
          trafficLayer.setMap(map);

          mapInstanceRef.current = map;
          trafficLayerRef.current = trafficLayer;
          setMapLoaded(true);

          // Add visual pins for Origin & Destination
          const originMarker = new mapsLib.Marker({
            position: isMedan ? { lat: 3.5975, lng: 98.6772 } : initialLocation, // Podomoro Medan
            map: map,
            title: origin,
            label: { text: 'A', color: 'white', fontWeight: 'bold' },
          });

          const destMarker = new mapsLib.Marker({
            position: isMedan ? { lat: 3.5185, lng: 98.6480 } : { lat: -6.1275, lng: 106.6537 }, // Pintu Air 4 Simalingkar B
            map: map,
            title: destination,
            label: { text: 'B', color: 'white', fontWeight: 'bold' },
          });

          markersRef.current = [originMarker, destMarker];
        })
        .catch((err: any) => {
          console.warn('Google Maps JS load warning:', err);
        });
    } catch (err: any) {
      console.warn('Google Maps initialization error:', err);
    }

    return () => {
      isMounted = false;
    };
  }, [mapsApiKey, origin, destination]);

  // Toggle Traffic Layer
  useEffect(() => {
    if (!trafficLayerRef.current || !mapInstanceRef.current) return;
    if (showTrafficLayer) {
      trafficLayerRef.current.setMap(mapInstanceRef.current);
    } else {
      trafficLayerRef.current.setMap(null);
    }
  }, [showTrafficLayer]);

  // Handle GPS Auto-detect
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setOrigin('Podomoro City Deli Medan (Pudumoro)');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        setOrigin(`Lokasi Saya (${coords})`);
        setGeoLocating(false);

        if (mapInstanceRef.current && (window as any).google) {
          try {
            const latLng = new (window as any).google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            mapInstanceRef.current.setCenter(latLng);
            mapInstanceRef.current.setZoom(14);
          } catch (e) {}
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGeoLocating(false);
        setOrigin('Podomoro City Deli Medan (Pudumoro)');
      },
      { timeout: 8000 }
    );
  };

  // Perform AI Route Analysis
  const handleAnalyzeRoutes = async () => {
    if (!origin.trim() || !destination.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/smart-traffic/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          travelMode,
          avoidTolls,
          avoidHighways,
          userName: profile?.name || 'Sahabat Sehat',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.routes) {
          setRoutes(data.routes);
          setSmartAlertText(data.smartAlertText || '');
          setTimeSavedMinutes(data.timeSavedMinutes || 0);
          setAiEvaluation(data.aiEvaluation);
          setSelectedRouteId(data.aiEvaluation?.bestRouteId || data.bestAltRouteId || data.routes[1]?.id || data.routes[0]?.id || 'route-2');
          setAnalyzedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch (err) {
      console.error('Failed to analyze traffic route:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-analyze initial route once
  useEffect(() => {
    handleAnalyzeRoutes();
  }, []);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  const getTrafficColor = (level: string) => {
    switch (level) {
      case 'lancar':
        return {
          dotBg: 'bg-emerald-400',
          badgeBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
          cardBorder: 'border-emerald-500/40',
          label: 'Lancar (Hijau)',
          barColor: 'bg-emerald-500',
        };
      case 'ramai':
      case 'padat':
        return {
          dotBg: 'bg-amber-400',
          badgeBg: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
          cardBorder: 'border-amber-500/40',
          label: 'Padat (Kuning)',
          barColor: 'bg-amber-500',
        };
      case 'macet_parah':
        return {
          dotBg: 'bg-rose-500',
          badgeBg: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
          cardBorder: 'border-rose-500/40',
          label: 'Macet Parah (Merah)',
          barColor: 'bg-rose-500',
        };
      default:
        return {
          dotBg: 'bg-teal-400',
          badgeBg: 'bg-teal-500/20 border-teal-500/40 text-teal-400',
          cardBorder: 'border-teal-500/40',
          label: 'Normal',
          barColor: 'bg-teal-500',
        };
    }
  };

  const openGoogleMapsNavigation = (routeToUse?: TrafficRoute) => {
    try {
      const originParam = encodeURIComponent(origin);
      const destParam = encodeURIComponent(destination);
      const modeParam = travelMode === 'TWO_WHEELER' ? 'two_wheeler' : travelMode === 'BICYCLE' ? 'bicycling' : travelMode === 'WALK' ? 'walking' : 'driving';
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=${modeParam}`, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.warn('Navigation popup blocked:', e);
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* 1. HEALTH & ANTI-STRESS PROMO HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-slate-900 to-indigo-950 border border-teal-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>AI Smart Traffic & Anti-Stress Travel</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Proteksi Jantung & Tensi Darah</span>
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Bebas Stres di Jalan, <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">Jantung Sehat & Pikiran Tenang</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Kemacetan parah memicu lonjakan hormon stres kortisol dan menaikkan tensi darah hingga 20%. <strong>AI Smart Traffic Route</strong> otomatis mendeteksi kemacetan di rute utama dan merekomendasikan jalur alternatif terbaik agar Anda menghemat waktu dan tiba dengan bugar.
            </p>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME TRAFFIC CONGESTION & ALTERNATIVE ALERT BANNER */}
      {smartAlertText && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-emerald-500/15 border-2 border-amber-500/40 shadow-xl space-y-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Pemberitahuan Cerdas Kemacetan & Alternatif AI</span>
                </span>
                {timeSavedMinutes > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs shadow-md flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Hemat {timeSavedMinutes} Menit!</span>
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                {smartAlertText}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-amber-500/20">
            <button
              onClick={() => setSelectedRouteId(routes[1]?.id || 'route-2')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Lihat Detail Alternatif</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => openGoogleMapsNavigation(routes[1] || selectedRoute)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Gunakan Rute Alternatif Ini</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. ROUTE SEARCH & INPUT CONTROLS */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl space-y-5 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-400" />
            <span>Pencarian Rute Cerdas AI</span>
          </h2>
          {analyzedAt && (
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Update: {analyzedAt} WIB</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Origin Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Titik Asal (Origin)</span>
              </label>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geoLocating}
                className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {geoLocating ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Navigation className="w-3 h-3" />
                )}
                <span>Gunakan GPS Saya</span>
              </button>
            </div>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Contoh: Podomoro City Deli Medan..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-teal-500 font-medium"
            />
            {/* Quick Origin Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {PRESET_ORIGINS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setOrigin(p)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    origin === p
                      ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {p.split('(')[0].split(',')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Destination Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>Titik Tujuan (Destination)</span>
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Contoh: Pintu Air 4 Simalingkar B..."
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-teal-500 font-medium"
            />
            {/* Quick Destination Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {PRESET_DESTINATIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDestination(p)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    destination === p
                      ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {p.split('(')[0].split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Travel Mode & Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">Moda:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTravelMode('DRIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  travelMode === 'DRIVE' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Mobil</span>
              </button>
              <button
                type="button"
                onClick={() => setTravelMode('TWO_WHEELER')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  travelMode === 'TWO_WHEELER' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Motor</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAnalyzeRoutes}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-teal-500/25 active:scale-95 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menganalisis Kemacetan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Cari Rute Alternatif AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. INTERACTIVE MAP & TRAFFIC MONITOR */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl relative">
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Peta Rute Utama & Alternatif</span>
              <span className="text-[10px] text-slate-400 normal-case font-normal">(Titik A: Asal &bull; Titik B: Tujuan)</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTrafficLayer(!showTrafficLayer)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                showTrafficLayer
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {showTrafficLayer ? '🚦 Lapisan Macet Aktif' : '🚦 Lapisan Macet Mati'}
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div ref={mapContainerRef} className="w-full h-72 sm:h-96 bg-slate-950 relative">
          {!mapLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
              <span className="text-xs font-medium">Memuat Google Maps Platform...</span>
            </div>
          )}
        </div>

        {/* Selected Route Summary & Action Bar */}
        {selectedRoute && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs text-slate-400 font-medium">Rute Aktif Terpilih:</div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>{selectedRoute.title}</span>
                {selectedRoute.id === aiEvaluation?.bestRouteId && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                    👑 Rekomendasi Terbaik AI
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openGoogleMapsNavigation(selectedRoute)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Gunakan Rute Ini</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. MULTI-ROUTE ALTERNATIVES COMPARISON CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Gauge className="w-4 h-4 text-teal-400" />
            <span>Pilihan Rute Perjalanan ({routes.length} Alternatif)</span>
          </h3>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Hijau: Lancar
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Kuning: Padat
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Merah: Macet
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {routes.map((route, idx) => {
            const isSelected = route.id === selectedRouteId;
            const isAiBest = route.id === aiEvaluation?.bestRouteId;
            const isMainRoute = idx === 0;
            const tColor = getTrafficColor(route.trafficLevel);

            return (
              <div
                key={route.id}
                onClick={() => setSelectedRouteId(route.id)}
                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-3.5 ${
                  isSelected
                    ? `bg-slate-800/95 ${tColor.cardBorder} shadow-2xl ring-2 ring-teal-500/40`
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                {isAiBest && (
                  <div className="absolute -top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-slate-950" />
                    <span>Rekomendasi AI</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-black text-white line-clamp-1">{route.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 ${tColor.badgeBg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tColor.dotBg}`}></span>
                      <span>{tColor.label.split('(')[0]}</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{route.summary}</p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Waktu Tempuh</span>
                    <span className="text-lg font-black text-white">
                      {route.durationMinutes} <span className="text-xs font-medium text-slate-400">mnt</span>
                    </span>
                    {route.delayMinutes >= 8 ? (
                      <span className="text-[10px] text-rose-400 font-bold block">
                        +{route.delayMinutes} mnt macet di jalan
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-bold block">
                        Arus mengalir lancar
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Jarak & Kecepatan</span>
                    <span className="text-sm font-bold text-slate-200 block">
                      {route.distanceKm} km
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ~{route.avgSpeedKmh} km/jam
                    </span>
                  </div>
                </div>

                {/* Savings / Warning Badge */}
                {route.timeSavedMinutes && route.timeSavedMinutes > 0 ? (
                  <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Hemat {route.timeSavedMinutes} Menit dibanding Rute Utama!</span>
                  </div>
                ) : isMainRoute && route.delayMinutes >= 10 ? (
                  <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Macet parah di beberapa titik</span>
                  </div>
                ) : null}

                {/* Action Buttons for each card */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRouteId(route.id);
                      openGoogleMapsNavigation(route);
                    }}
                    className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                      isAiBest
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Gunakan Rute Ini</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. AI SMART RECOMMENDATION & ANTI-STRESS HEALTH ADVICE */}
      {aiEvaluation && (
        <div className="rounded-3xl bg-slate-900/90 border border-teal-500/30 p-5 sm:p-7 shadow-xl space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{aiEvaluation.recommendationTitle}</h3>
              <p className="text-[11px] text-teal-300">Keputusan cerdas berbasis data kondisi lalu lintas aktual</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Why This Route is Best */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Alasan Rekomendasi AI</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                {aiEvaluation.recommendationReason}
              </p>

              {aiEvaluation.bestDepartureWindow && (
                <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-indigo-300 block">Waktu Berangkat Paling Efektif</span>
                    <span className="text-xs text-indigo-200">{aiEvaluation.bestDepartureWindow}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Medical Anti-Stress Guidance */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Protokol Kesehatan & Relaksasi di Jalan</span>
              </h4>

              <div className="space-y-2">
                {aiEvaluation.healthTravelTips?.map((tip, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
