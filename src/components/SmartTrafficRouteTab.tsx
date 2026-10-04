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
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  Gauge,
  Zap,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Radio,
  History,
  Star,
  Trash2,
  Bookmark,
  ArrowRight,
} from 'lucide-react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface RouteHistoryItem {
  id: string;
  origin: string;
  destination: string;
  travelMode: 'DRIVE' | 'TWO_WHEELER' | 'BICYCLE' | 'WALK';
  timestamp: string;
  timeSavedMinutes?: number;
  bestRouteTitle?: string;
  isFavorite?: boolean;
}

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

const INITIAL_ROUTES: TrafficRoute[] = [
  {
    id: 'route-1',
    title: 'Rute Utama: via Jl. Brigjend Katamso & Simpang Pos',
    summary: 'Melalui Jl. Putri Hijau -> Jl. Brigjend Katamso -> Simpang Pos -> Jl. Jamin Ginting',
    distanceKm: 14.5,
    durationMinutes: 48,
    staticDurationMinutes: 28,
    delayMinutes: 20,
    avgSpeedKmh: 18,
    trafficLevel: 'macet_parah',
    stressIndex: 88,
    congestedRoad: 'Jl. Brigjend Katamso & Simpang Pos',
    isToll: false,
  },
  {
    id: 'route-2',
    title: 'Rute Alternatif AI: via Ringroad Ngumban Surbakti (Direkomendasikan)',
    summary: 'Melalui Jl. Guru Patimpus -> Jl. Gatot Subroto -> Ringroad Ngumban Surbakti -> Jl. Pintu Air 4',
    distanceKm: 13.8,
    durationMinutes: 30,
    staticDurationMinutes: 26,
    delayMinutes: 4,
    avgSpeedKmh: 38,
    trafficLevel: 'lancar',
    stressIndex: 22,
    recommendedVia: 'Ringroad Ngumban Surbakti & Jl. Guru Patimpus',
    timeSavedMinutes: 18,
    isToll: false,
  },
  {
    id: 'route-3',
    title: 'Rute Alternatif 2: via Jl. Juanda & Karya Wisata',
    summary: 'Melalui Jl. Pemuda -> Jl. Juanda -> Jl. Karya Wisata Medan Johor -> Pintu Air 4',
    distanceKm: 14.1,
    durationMinutes: 37,
    staticDurationMinutes: 30,
    delayMinutes: 7,
    avgSpeedKmh: 29,
    trafficLevel: 'ramai',
    stressIndex: 42,
    recommendedVia: 'Jl. Juanda & Medan Johor',
    timeSavedMinutes: 11,
    isToll: false,
  },
];

const INITIAL_AI_EVALUATION: AIEvaluation = {
  bestRouteId: 'route-2',
  recommendationTitle: 'Rute Paling Nyaman & Rendah Stres untuk Sahabat Sehat',
  recommendationReason:
    'Rute "via Ringroad Ngumban Surbakti" dipilih karena memiliki kelancaran arus lalu lintas terbaik, memangkas durasi kemacetan hingga 18 menit, dan menjaga ritme jantung tetap tenang.',
  stressAnalysis:
    'Kemacetan di Simpang Pos dan Katamso terdeteksi cukup padat. Memilih rute alternatif ini mencegah kelelahan leher dan efek lonjakan tensi darah.',
  healthTravelTips: [
    'Atur posisi sandaran jok sekitar 100-110 derajat agar postur punggung rileks.',
    'Lakukan napas dalam (tarik 4 detik, hembuskan 8 detik) jika mendapati persimpangan jalan.',
    'Sediakan air minum di dekat kemudi untuk menjaga kadar cairan tubuh saat berkendara.',
  ],
  bestDepartureWindow: 'Berangkat dalam 10 menit ke depan untuk memanfaatkan arus kendaraan yang sedang mengalir lancar.',
  promoCatchphrase:
    'Bebas stres di jalan, jantung sehat & pikiran tenang! Hidup Sehatku Smart Traffic Route siap memandu perjalanan Anda.',
};

const INITIAL_HISTORY: RouteHistoryItem[] = [
  {
    id: 'hist-1',
    origin: 'Podomoro City Deli Medan (Pudumoro)',
    destination: 'Pintu Air 4 Simalingkar B, Medan',
    travelMode: 'DRIVE',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    timeSavedMinutes: 18,
    bestRouteTitle: 'via Ringroad Ngumban Surbakti',
    isFavorite: true,
  },
  {
    id: 'hist-2',
    origin: 'Monas, Gambir, Jakarta Pusat',
    destination: 'Bandara Internasional Soekarno-Hatta (CGK)',
    travelMode: 'DRIVE',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    timeSavedMinutes: 25,
    bestRouteTitle: 'via Tol Prof. Dr. Sedyatmo',
    isFavorite: false,
  },
  {
    id: 'hist-3',
    origin: 'SCBD, Senayan, Jakarta Selatan',
    destination: 'Grand Indonesia Mall, Jakarta Pusat',
    travelMode: 'TWO_WHEELER',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    timeSavedMinutes: 12,
    bestRouteTitle: 'via Jl. Jend. Sudirman',
    isFavorite: false,
  },
];

let hasConfiguredGoogleMaps = false;
let mapsPromise: Promise<any> | null = null;

function getGoogleMapsLibrary(apiKey: string): Promise<any> {
  if (!mapsPromise) {
    if (!hasConfiguredGoogleMaps) {
      try {
        setOptions({
          key: apiKey || 'AIzaSyAii5jmjWw-WbGATErdNheY-41dCRJmSeY',
          v: 'weekly',
        });
        hasConfiguredGoogleMaps = true;
      } catch (e) {
        // already configured
      }
    }
    mapsPromise = importLibrary('maps').catch((err) => {
      console.warn('Google Maps library load error:', err);
      return null;
    });
  }
  return mapsPromise;
}

export const SmartTrafficRouteTab: React.FC = () => {
  const { profile } = useHealth();
  const [origin, setOrigin] = useState('Podomoro City Deli Medan (Pudumoro)');
  const [destination, setDestination] = useState('Pintu Air 4 Simalingkar B, Medan');
  const [travelMode, setTravelMode] = useState<'DRIVE' | 'TWO_WHEELER' | 'BICYCLE' | 'WALK'>('DRIVE');
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [routes, setRoutes] = useState<TrafficRoute[]>(INITIAL_ROUTES);
  const [smartAlertText, setSmartAlertText] = useState<string>(
    'Rute utama sedang mengalami kemacetan di Jl. Brigjend Katamso & Simpang Pos. Disarankan melalui Ringroad Ngumban Surbakti & Jl. Guru Patimpus. Perkiraan waktu tempuh 30 menit. Jarak 13.8 km. Estimasi penghematan waktu 18 menit.'
  );
  const [timeSavedMinutes, setTimeSavedMinutes] = useState<number>(18);
  const [aiEvaluation, setAiEvaluation] = useState<AIEvaluation | null>(INITIAL_AI_EVALUATION);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('route-2');
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  );
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [geoLocating, setGeoLocating] = useState(false);
  const [showHistorySection, setShowHistorySection] = useState(true);

  // History State initialized from localStorage
  const [routeHistory, setRouteHistory] = useState<RouteHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('hidupsehatku_smart_route_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_HISTORY;
  });

  // Save history to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('hidupsehatku_smart_route_history', JSON.stringify(routeHistory));
    } catch (e) {}
  }, [routeHistory]);

  const saveToHistory = (origStr: string, destStr: string, mode: any, timeSaved?: number, bestTitle?: string) => {
    if (!origStr.trim() || !destStr.trim()) return;
    setRouteHistory((prev) => {
      const filtered = prev.filter(
        (item) =>
          !(item.origin.toLowerCase() === origStr.toLowerCase() && item.destination.toLowerCase() === destStr.toLowerCase())
      );
      const newItem: RouteHistoryItem = {
        id: `hist-${Date.now()}`,
        origin: origStr,
        destination: destStr,
        travelMode: mode,
        timestamp: new Date().toISOString(),
        timeSavedMinutes: timeSaved,
        bestRouteTitle: bestTitle,
        isFavorite: false,
      };
      return [newItem, ...filtered].slice(0, 10);
    });
  };

  const toggleFavoriteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRouteHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRouteHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAllHistory = () => {
    setRouteHistory([]);
  };

  const handleSelectHistoryItem = (item: RouteHistoryItem) => {
    setOrigin(item.origin);
    setDestination(item.destination);
    setTravelMode(item.travelMode);
    handleAnalyzeRoutes(item.origin, item.destination);
  };

  // Voice Assistant States
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [manualVoiceInput, setManualVoiceInput] = useState('');
  const [voiceStatusText, setVoiceStatusText] = useState('Siap mendengarkan lokasi tujuan Anda...');
  const [isSpeakingResult, setIsSpeakingResult] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceDetectedToast, setVoiceDetectedToast] = useState<{ origin: string; destination: string } | null>({
    origin: 'Podomoro City Deli Medan (Pudumoro)',
    destination: 'Pintu Air 4 Simalingkar B, Medan',
  });
  const recognitionRef = useRef<any>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const trafficLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapsApiKey, setMapsApiKey] = useState('AIzaSyAii5jmjWw-WbGATErdNheY-41dCRJmSeY');

  // Fetch Google Maps API Key
  useEffect(() => {
    let isSubscribed = true;
    fetch('/api/google-maps/key')
      .then((res) => res.json())
      .then((data) => {
        if (isSubscribed && data && data.apiKey) {
          setMapsApiKey(data.apiKey);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch maps key:', err);
      });
    return () => {
      isSubscribed = false;
    };
  }, []);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'id-ID';

        recognition.onstart = () => {
          setIsListening(true);
          setVoiceStatusText('Mendengarkan ucapan lokasi Anda...');
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              setSpeechTranscript(transcript);
              handleProcessVoiceInput(transcript);
            } else {
              interimTranscript += transcript;
              setSpeechTranscript(interimTranscript);
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          setVoiceStatusText('Mikrofon tidak merespons. Silakan ketik perintah suara di bawah.');
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        setSpeechSupported(false);
      }
    } else {
      setSpeechSupported(false);
    }
  }, []);

  // Initialize Map safely
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;
    getGoogleMapsLibrary(mapsApiKey)
      .then((mapsLib: any) => {
        if (!isMounted || !mapContainerRef.current || !mapsLib) return;

        try {
          const isMedan =
            origin.toLowerCase().includes('medan') ||
            origin.toLowerCase().includes('podomoro') ||
            origin.toLowerCase().includes('pudumoro');
          const initialLocation = isMedan
            ? { lat: 3.5908, lng: 98.6743 }
            : { lat: -6.175392, lng: 106.827153 };

          if (!mapInstanceRef.current) {
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
              position: isMedan ? { lat: 3.5975, lng: 98.6772 } : initialLocation,
              map: map,
              title: origin,
              label: { text: 'A', color: 'white', fontWeight: 'bold' },
            });

            const destMarker = new mapsLib.Marker({
              position: isMedan ? { lat: 3.5185, lng: 98.648 } : { lat: -6.1275, lng: 106.6537 },
              map: map,
              title: destination,
              label: { text: 'B', color: 'white', fontWeight: 'bold' },
            });

            markersRef.current = [originMarker, destMarker];
          }
        } catch (mapErr) {
          console.warn('Error setting up Google Map instance:', mapErr);
        }
      })
      .catch((err: any) => {
        console.warn('Google Maps JS load error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [mapsApiKey]);

  // Toggle Traffic Layer safely
  useEffect(() => {
    try {
      if (!trafficLayerRef.current || !mapInstanceRef.current) return;
      if (showTrafficLayer) {
        trafficLayerRef.current.setMap(mapInstanceRef.current);
      } else {
        trafficLayerRef.current.setMap(null);
      }
    } catch (e) {
      // ignore
    }
  }, [showTrafficLayer]);

  // Handle Voice Listening Trigger
  const handleStartListening = () => {
    setIsVoiceModalOpen(true);
    setSpeechTranscript('');
    setVoiceStatusText('Ucapkan lokasi tujuan Anda...');

    if (recognitionRef.current && speechSupported) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Recognition start exception:', e);
      }
    } else {
      setVoiceStatusText('Sistem suara mikrofon tidak tersedia. Silakan ketik lokasi tujuan Anda di bawah.');
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  // Text-to-Speech Output Function
  const speakTextSummary = (textToSpeak: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeakingResult(true);
      utterance.onend = () => setIsSpeakingResult(false);
      utterance.onerror = () => setIsSpeakingResult(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingResult(false);
  };

  // Step-by-Step Voice Pipeline: Voice -> Intent -> Route API -> Map -> Speech Readout
  const handleProcessVoiceInput = async (spokenText: string) => {
    const text = spokenText.trim();
    if (!text) return;

    handleStopListening();
    setVoiceStatusText(`Memahami perintah suara: "${text}"...`);
    setIsLoading(true);

    try {
      // 1. Voice Intent Parsing API
      const parseRes = await fetch('/api/smart-traffic/parse-voice-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speechText: text, currentOrigin: origin }),
      });

      let targetOrigin = origin;
      let targetDestination = destination;
      let targetMode = travelMode;

      if (parseRes.ok) {
        const parseData = await parseRes.json();
        if (parseData.success) {
          if (parseData.origin) targetOrigin = parseData.origin;
          if (parseData.destination) targetDestination = parseData.destination;
          if (parseData.travelMode) targetMode = parseData.travelMode;

          // Directly auto-input into fields
          setOrigin(targetOrigin);
          setDestination(targetDestination);
          setTravelMode(targetMode);
          setVoiceDetectedToast({ origin: targetOrigin, destination: targetDestination });
        }
      }

      setVoiceStatusText(`Mengecek kondisi kemacetan & rute ke "${targetDestination}"...`);

      // 2. Route & Traffic Analysis API
      const analyzeRes = await fetch('/api/smart-traffic/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: targetOrigin,
          destination: targetDestination,
          travelMode: targetMode,
          avoidTolls,
          avoidHighways,
          userName: profile?.name || 'Sahabat Sehat',
        }),
      });

      if (analyzeRes.ok) {
        const data = await analyzeRes.json();
        if (data.success && data.routes && data.routes.length > 0) {
          setRoutes(data.routes);
          const alertMessage = data.smartAlertText || smartAlertText;
          setSmartAlertText(alertMessage);
          if (data.timeSavedMinutes !== undefined) setTimeSavedMinutes(data.timeSavedMinutes);
          if (data.aiEvaluation) setAiEvaluation(data.aiEvaluation);

          setSelectedRouteId(
            data.aiEvaluation?.bestRouteId ||
              data.bestAltRouteId ||
              data.routes[1]?.id ||
              data.routes[0]?.id ||
              'route-2'
          );
          setAnalyzedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));

          // Save to Search History
          saveToHistory(
            targetOrigin,
            targetDestination,
            targetMode,
            data.timeSavedMinutes || 0,
            data.routes[1]?.title || data.routes[0]?.title
          );

          // Update map pins and center
          updateMapMarkers(targetOrigin, targetDestination);

          // Close voice modal
          setIsVoiceModalOpen(false);

          // Smoothly scroll to AI Search Results
          setTimeout(() => {
            if (searchResultsRef.current) {
              searchResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 250);

          // 3. Readout results via Text-To-Speech
          const speechSummary = `Hasil pencarian rute: ${alertMessage}`;
          speakTextSummary(speechSummary);
        }
      }
    } catch (err) {
      console.error('Failed to process voice intent:', err);
      setVoiceStatusText('Terjadi kendala saat menganalisis rute suara. Coba ulangi lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to dynamically update map markers and center
  const updateMapMarkers = (origStr: string, destStr: string) => {
    if (!mapInstanceRef.current || !(window as any).google) return;
    try {
      const isMedanOrig =
        origStr.toLowerCase().includes('medan') ||
        origStr.toLowerCase().includes('podomoro') ||
        origStr.toLowerCase().includes('pudumoro');
      const isJakartaOrig =
        origStr.toLowerCase().includes('jakarta') ||
        origStr.toLowerCase().includes('monas') ||
        origStr.toLowerCase().includes('scbd');

      const origPos = isMedanOrig
        ? { lat: 3.5975, lng: 98.6772 }
        : isJakartaOrig
        ? { lat: -6.175392, lng: 106.827153 }
        : { lat: 3.5908, lng: 98.6743 };

      const isMedanDest =
        destStr.toLowerCase().includes('medan') ||
        destStr.toLowerCase().includes('simalingkar') ||
        destStr.toLowerCase().includes('pintu air');
      const destPos = isMedanDest
        ? { lat: 3.5185, lng: 98.648 }
        : { lat: -6.1275, lng: 106.6537 };

      mapInstanceRef.current.setCenter(origPos);

      // Clear existing markers
      if (markersRef.current && markersRef.current.length) {
        markersRef.current.forEach((m) => {
          if (m && typeof m.setMap === 'function') m.setMap(null);
        });
      }

      const googleMaps = (window as any).google.maps;
      if (googleMaps && googleMaps.Marker) {
        const originMarker = new googleMaps.Marker({
          position: origPos,
          map: mapInstanceRef.current,
          title: origStr,
          label: { text: 'A', color: 'white', fontWeight: 'bold' },
        });

        const destMarker = new googleMaps.Marker({
          position: destPos,
          map: mapInstanceRef.current,
          title: destStr,
          label: { text: 'B', color: 'white', fontWeight: 'bold' },
        });

        markersRef.current = [originMarker, destMarker];
      }
    } catch (e) {
      console.warn('Update map markers error:', e);
    }
  };

  // Perform Manual AI Route Analysis
  const handleAnalyzeRoutes = async (overrideOrigin?: string, overrideDest?: string) => {
    const origToUse = overrideOrigin !== undefined ? overrideOrigin : origin;
    const destToUse = overrideDest !== undefined ? overrideDest : destination;
    if (!origToUse.trim() || !destToUse.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/smart-traffic/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origToUse,
          destination: destToUse,
          travelMode,
          avoidTolls,
          avoidHighways,
          userName: profile?.name || 'Sahabat Sehat',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.routes && data.routes.length > 0) {
          setRoutes(data.routes);
          const summaryMsg = data.smartAlertText || smartAlertText;
          if (data.smartAlertText) setSmartAlertText(data.smartAlertText);
          if (data.timeSavedMinutes !== undefined) setTimeSavedMinutes(data.timeSavedMinutes);
          if (data.aiEvaluation) setAiEvaluation(data.aiEvaluation);
          setSelectedRouteId(
            data.aiEvaluation?.bestRouteId ||
              data.bestAltRouteId ||
              data.routes[1]?.id ||
              data.routes[0]?.id ||
              'route-2'
          );
          setAnalyzedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));

          // Save to Search History
          saveToHistory(
            origToUse,
            destToUse,
            travelMode,
            data.timeSavedMinutes || 0,
            data.routes[1]?.title || data.routes[0]?.title
          );

          // Update map pins and center
          updateMapMarkers(origToUse, destToUse);

          // Voice Readout Option
          speakTextSummary(summaryMsg);
        }
      }
    } catch (err) {
      console.error('Failed to analyze traffic route:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // GPS Auto-detect
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

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0] || INITIAL_ROUTES[1];

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
      const modeParam =
        travelMode === 'TWO_WHEELER'
          ? 'two_wheeler'
          : travelMode === 'BICYCLE'
          ? 'bicycling'
          : travelMode === 'WALK'
          ? 'walking'
          : 'driving';
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&travelmode=${modeParam}`,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (e) {
      console.warn('Navigation popup blocked:', e);
    }
  };

  return (
    <div className="space-y-6 pb-24 w-full">
      {/* 1. HEALTH & ANTI-STRESS PROMO HERO BANNER WITH VOICE ASSISTANT BUTTON */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-slate-900 to-indigo-950 border border-teal-500/30 p-5 sm:p-7 shadow-2xl">
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
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

            {/* PROMINENT "MAU KEMANA?" VOICE ASSISTANT BUTTON */}
            <button
              type="button"
              onClick={handleStartListening}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-teal-400 hover:brightness-110 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-500/30 active:scale-95 transition-all cursor-pointer animate-pulse"
            >
              <Mic className="w-4 h-4 fill-white animate-bounce" />
              <span>🎙️ Mau Kemana? (Bicara)</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Bebas Stres di Jalan,{' '}
              <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
                Jantung Sehat & Pikiran Tenang
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tekan tombol <strong>"Mau Kemana?"</strong> untuk bicara langsung. Asisten suara AI akan memahami lokasi Anda, mengecek kondisi kemacetan di rute utama vs alternatif, memperbarui peta, dan membacakan hasilnya untuk Anda.
            </p>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME TRAFFIC CONGESTION & ALTERNATIVE ALERT BANNER WITH VOICE READOUT */}
      {smartAlertText && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-emerald-500/15 border-2 border-amber-500/40 shadow-xl space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Pemberitahuan Cerdas Kemacetan & Alternatif AI</span>
                </span>
                <div className="flex items-center gap-2">
                  {timeSavedMinutes > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-xs shadow-md flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Hemat {timeSavedMinutes} Menit!</span>
                    </span>
                  )}
                  {isSpeakingResult ? (
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="px-2.5 py-1 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <VolumeX className="w-3 h-3" />
                      <span>Matikan Suara</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => speakTextSummary(`Pemberitahuan rute: ${smartAlertText}`)}
                      className="px-2.5 py-1 rounded-full bg-teal-500/30 border border-teal-500/50 text-teal-300 font-bold text-[10px] flex items-center gap-1 hover:bg-teal-500/40 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3 text-teal-400" />
                      <span>Bacakan Suara</span>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">{smartAlertText}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-amber-500/20">
            <button
              type="button"
              onClick={() => setSelectedRouteId(routes[1]?.id || 'route-2')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Lihat Detail Alternatif</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
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
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-400" />
            <span>Pencarian Rute Cerdas AI</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartListening}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-500/30 transition-colors cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              <span>Bicara</span>
            </button>
            {analyzedAt && (
              <span className="text-[10px] text-slate-400 font-mono hidden sm:flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{analyzedAt} WIB</span>
              </span>
            )}
          </div>
        </div>

        {/* Voice Auto-input Confirmation Banner */}
        {voiceDetectedToast && (
          <div className="p-3 rounded-2xl bg-teal-500/15 border border-teal-500/40 text-teal-300 text-xs font-bold flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
              <span>
                <strong>Terinput Otomatis dari Suara:</strong> Asal &rarr; <span className="text-white font-medium">{voiceDetectedToast.origin}</span> | Tujuan &rarr; <span className="text-white font-medium">{voiceDetectedToast.destination}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceDetectedToast(null)}
              className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

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
                {geoLocating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                <span>GPS Saya</span>
              </button>
            </div>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAnalyzeRoutes();
              }}
              placeholder="Contoh: Podomoro City Deli Medan..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-teal-500 font-medium"
            />
            {/* Quick Origin Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {PRESET_ORIGINS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setOrigin(p);
                    handleAnalyzeRoutes(p, destination);
                  }}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAnalyzeRoutes();
              }}
              placeholder="Contoh: Pintu Air 4 Simalingkar B..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-teal-500 font-medium"
            />
            {/* Quick Destination Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {PRESET_DESTINATIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setDestination(p);
                    handleAnalyzeRoutes(origin, p);
                  }}
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
              onClick={() => handleAnalyzeRoutes()}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-teal-500/25 active:scale-95 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Cari Rute Alternatif</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3.5 RECENT ROUTE SEARCH HISTORY & FAVORITES */}
      {routeHistory.length > 0 && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <span>Riwayat Rute & Destinasi Sering Dikunjungi</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-teal-300 border border-slate-700">
                    {routeHistory.length}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Klik rute untuk akses pencarian ulang secara cepat</p>
              </div>
            </div>

            <button
              type="button"
              onClick={clearAllHistory}
              className="text-[10px] font-bold text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden sm:inline">Hapus Riwayat</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {routeHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectHistoryItem(item)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between space-y-2 ${
                  item.isFavorite
                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/30 shadow-md ring-1 ring-amber-500/20'
                    : 'bg-slate-950/80 border-slate-800/80 hover:border-teal-500/50 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                      <span className="truncate">{item.origin.split('(')[0]}</span>
                    </div>
                    <div className="text-xs font-black text-white flex items-center gap-1 truncate">
                      <ArrowRight className="w-3 h-3 text-teal-400 shrink-0" />
                      <span className="truncate">{item.destination.split('(')[0]}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => toggleFavoriteHistory(item.id, e)}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        item.isFavorite ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-amber-400'
                      }`}
                      title={item.isFavorite ? 'Hapus dari favorit' : 'Tandai favorit'}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => deleteHistoryItem(item.id, e)}
                      className="p-1 rounded-lg text-slate-600 hover:text-rose-400 transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                      title="Hapus riwayat ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-800/60 text-slate-400">
                  <div className="flex items-center gap-1">
                    {item.travelMode === 'TWO_WHEELER' ? (
                      <Bike className="w-3 h-3 text-teal-400" />
                    ) : (
                      <Car className="w-3 h-3 text-teal-400" />
                    )}
                    <span className="font-mono text-[9px]">
                      {new Date(item.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {item.timeSavedMinutes && item.timeSavedMinutes > 0 ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[9px]">
                      ⚡ Hemat {item.timeSavedMinutes}m
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. INTERACTIVE MAP & TRAFFIC MONITOR */}
      <div ref={searchResultsRef} className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl relative scroll-mt-6">
        <div className="p-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Peta Rute Utama & Alternatif</span>
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
              {showTrafficLayer ? '🚦 Macet Aktif' : '🚦 Macet Mati'}
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="w-full h-64 sm:h-80 bg-slate-950 relative">
          <div ref={mapContainerRef} className="w-full h-full" />

          {!mapLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-slate-400 space-y-2 p-4 text-center pointer-events-none z-10">
              <MapPin className="w-8 h-8 text-teal-400 animate-bounce" />
              <span className="text-xs font-medium text-slate-300">
                Peta Pintu Air 4 Simalingkar B & Podomoro Deli Medan
              </span>
            </div>
          )}
        </div>

        {/* Selected Route Summary & Action Bar */}
        {selectedRoute && (
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-400 font-medium">Rute Aktif Terpilih:</div>
              <div className="text-xs font-black text-white flex items-center gap-2">
                <span>{selectedRoute.title}</span>
                {selectedRoute.id === aiEvaluation?.bestRouteId && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                    👑 Rekomendasi AI
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
          <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Gauge className="w-4 h-4 text-teal-400" />
            <span>Pilihan Rute Perjalanan ({routes.length} Alternatif)</span>
          </h3>
          <div className="flex items-center gap-2 text-[9px] sm:text-[10px]">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Hijau: Lancar
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
                  <div className="absolute -top-3 right-3 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-slate-950" />
                    <span>Rekomendasi AI</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-black text-white line-clamp-1">{route.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 shrink-0 ${tColor.badgeBg}`}
                    >
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
                    <span className="text-base font-black text-white">
                      {route.durationMinutes} <span className="text-xs font-medium text-slate-400">mnt</span>
                    </span>
                    {route.delayMinutes >= 8 ? (
                      <span className="text-[10px] text-rose-400 font-bold block">
                        +{route.delayMinutes} mnt macet di jalan
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-bold block">Arus mengalir lancar</span>
                    )}
                  </div>

                  <div className="space-y-0.5 text-right">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Jarak & Kecepatan</span>
                    <span className="text-xs font-bold text-slate-200 block">{route.distanceKm} km</span>
                    <span className="text-[10px] text-slate-400 font-mono">~{route.avgSpeedKmh} km/jam</span>
                  </div>
                </div>

                {/* Savings / Warning Badge */}
                {route.timeSavedMinutes && route.timeSavedMinutes > 0 ? (
                  <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Hemat {route.timeSavedMinutes} Menit!</span>
                  </div>
                ) : isMainRoute && route.delayMinutes >= 10 ? (
                  <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Macet parah di persimpangan</span>
                  </div>
                ) : null}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRouteId(route.id);
                      openGoogleMapsNavigation(route);
                    }}
                    className={`w-full py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
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
        <div className="rounded-3xl bg-slate-900/90 border border-teal-500/30 p-4 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white">{aiEvaluation.recommendationTitle}</h3>
              <p className="text-[10px] text-teal-300">Keputusan cerdas berbasis data kondisi lalu lintas aktual</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Why This Route is Best */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Alasan Rekomendasi AI</span>
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
                {aiEvaluation.recommendationReason}
              </p>

              {aiEvaluation.bestDepartureWindow && (
                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-indigo-300 block">Waktu Berangkat Efektif</span>
                    <span className="text-xs text-indigo-200">{aiEvaluation.bestDepartureWindow}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Medical Anti-Stress Guidance */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Protokol Kesehatan & Relaksasi di Jalan</span>
              </h4>

              <div className="space-y-2">
                {aiEvaluation.healthTravelTips?.map((tip, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2 text-xs text-slate-300 leading-relaxed"
                  >
                    <span className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
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

      {/* 7. VOICE ASSISTANT MODAL (SPEECH TO TEXT + INTENT PARSER + FALLBACK INPUT) */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-teal-500/40 p-6 shadow-2xl space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                  <Mic className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Asisten Suara "Mau Kemana?"</h3>
                  <p className="text-[10px] text-teal-300">Konversi suara-ke-teks & deteksi intent lokasi AI</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleStopListening();
                  setIsVoiceModalOpen(false);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Voice Wave Visualizer */}
            <div className="flex flex-col items-center justify-center py-6 space-y-4 bg-slate-950/80 rounded-2xl border border-slate-800">
              <div className="relative">
                {isListening && (
                  <div className="absolute -inset-4 rounded-full bg-rose-500/20 animate-ping"></div>
                )}
                <button
                  type="button"
                  onClick={isListening ? handleStopListening : handleStartListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer ${
                    isListening
                      ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/40 ring-4 ring-rose-500/30'
                      : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 shadow-teal-500/30'
                  }`}
                >
                  <Mic className={`w-8 h-8 ${isListening ? 'animate-bounce' : ''}`} />
                </button>
              </div>

              <div className="text-center space-y-1 max-w-sm px-4">
                <span className="text-xs font-bold text-white block">{voiceStatusText}</span>
                {speechTranscript ? (
                  <p className="text-xs text-teal-300 bg-teal-950/60 p-2.5 rounded-xl border border-teal-500/30 font-mono">
                    "{speechTranscript}"
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Contoh: <i>"Saya dari Podomoro mau ke Pintu Air 4 Simalingkar naik mobil"</i>
                  </p>
                )}
              </div>
            </div>

            {/* Fallback Text Input (If Mic permission denied / not supported) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300 block">
                Atau Ketik Perintah Suara / Lokasi (Fallback Input):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualVoiceInput}
                  onChange={(e) => setManualVoiceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleProcessVoiceInput(manualVoiceInput);
                  }}
                  placeholder="Contoh: Podomoro Medan ke Pintu Air 4 Simalingkar..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => handleProcessVoiceInput(manualVoiceInput)}
                  disabled={!manualVoiceInput.trim() || isLoading}
                  className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
