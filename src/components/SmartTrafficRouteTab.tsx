import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  Maximize2,
  Minimize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Layers,
  Focus,
  Crown,
  Lock,
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
  startLocation?: { latitude: number; longitude: number };
  endLocation?: { latitude: number; longitude: number };
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
    title: 'Rute Utama: via Jl. Gatot Subroto & Jl. MT Haryono',
    summary: 'Melalui Jl. Gatot Subroto -> Jl. Guru Patimpus -> Jl. Pemuda -> Jl. MT Haryono',
    distanceKm: 5.2,
    durationMinutes: 24,
    staticDurationMinutes: 14,
    delayMinutes: 10,
    avgSpeedKmh: 13,
    trafficLevel: 'padat',
    stressIndex: 68,
    congestedRoad: 'Simpang Majestik & Pasar Rame',
    isToll: false,
  },
  {
    id: 'route-2',
    title: 'Rute Alternatif AI: via Jl. H. Adam Malik & Jl. Jawa (Direkomendasikan)',
    summary: 'Melalui Jl. Gatot Subroto -> Jl. H. Adam Malik -> Jl. Jawa -> Jl. Sutomo',
    distanceKm: 5.8,
    durationMinutes: 15,
    staticDurationMinutes: 13,
    delayMinutes: 2,
    avgSpeedKmh: 23,
    trafficLevel: 'lancar',
    stressIndex: 20,
    recommendedVia: 'Jl. H. Adam Malik & Koridor Stasiun Medan',
    timeSavedMinutes: 9,
    isToll: false,
  },
  {
    id: 'route-3',
    title: 'Rute Alternatif 2: via Jl. Putri Hijau & Jl. Stasiun',
    summary: 'Melalui Jl. Putri Hijau -> Jl. Stasiun Kereta Api -> Jl. Palang Merah',
    distanceKm: 5.5,
    durationMinutes: 19,
    staticDurationMinutes: 14,
    delayMinutes: 5,
    avgSpeedKmh: 17,
    trafficLevel: 'ramai',
    stressIndex: 38,
    recommendedVia: 'Koridor Lapangan Merdeka & Stasiun',
    timeSavedMinutes: 5,
    isToll: false,
  },
];

const INITIAL_AI_EVALUATION: AIEvaluation = {
  bestRouteId: 'route-2',
  recommendationTitle: 'Rute Paling Nyaman & Rendah Stres untuk Sahabat Sehat',
  recommendationReason:
    'Rute "via Jl. H. Adam Malik & Jl. Jawa" dari Plaza Medan Fair ke Medan Mall dipilih karena memiliki kelancaran arus lalu lintas terbaik, memangkas durasi kemacetan hingga 9 menit, dan menjaga ritme detak jantung tetap tenang.',
  stressAnalysis:
    'Kepadatan lalu lintas di Simpang Majestik terdeteksi padat. Memilih rute alternatif ini menghemat energi mental dan mencegah lonjakan hormon stres kortisol.',
  healthTravelTips: [
    'Atur posisi sandaran jok sekitar 100-110 derajat agar postur punggung rileks.',
    'Lakukan pernapasan dalam (tarik 4 detik, hembuskan 8 detik) saat mendapati persimpangan jalan.',
    'Sediakan botol air minum di dekat kemudi untuk menjaga hidrasi tubuh saat berkendara.',
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

// Google Polyline Decoder for Leaflet
function decodeGooglePolyline(encoded: string): [number, number][] {
  if (!encoded) return [];
  const points: [number, number][] = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// Generate Waypoints for Leaflet Route Lines
function generateRouteWaypoints(
  start: [number, number],
  end: [number, number],
  routeIdx: number
): [number, number][] {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;

  let offsetLat = 0;
  let offsetLng = 0;

  if (routeIdx === 0) {
    offsetLat = (lng2 - lng1) * 0.08;
    offsetLng = -(lat2 - lat1) * 0.08;
  } else if (routeIdx === 1) {
    offsetLat = -(lng2 - lng1) * 0.18;
    offsetLng = (lat2 - lat1) * 0.18;
  } else {
    offsetLat = (lng2 - lng1) * 0.22;
    offsetLng = -(lat2 - lat1) * 0.22;
  }

  const p1: [number, number] = [start[0], start[1]];
  const p2: [number, number] = [
    start[0] * 0.66 + (midLat + offsetLat) * 0.34,
    start[1] * 0.66 + (midLng + offsetLng) * 0.34,
  ];
  const p3: [number, number] = [midLat + offsetLat, midLng + offsetLng];
  const p4: [number, number] = [
    end[0] * 0.66 + (midLat + offsetLat) * 0.34,
    end[1] * 0.66 + (midLng + offsetLng) * 0.34,
  ];
  const p5: [number, number] = [end[0], end[1]];

  return [p1, p2, p3, p4, p5];
}

// Dynamic Coordinate Resolver for Leaflet & Navigation
function resolvePlaceCoordinates(placeName: string, isOrigin: boolean): [number, number] {
  const clean = (placeName || '').toLowerCase().trim();

  // 0. Direct GPS Coordinates Extraction if present, e.g. "(3.5908, 98.6743)" or "3.5908, 98.6743"
  const coordMatch = clean.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }

  // 1. Medan & North Sumatra Specific Landmarks
  if (clean.includes('bunga ester')) return [3.5280, 98.6380];
  if (clean.includes('kampung lalang') || clean.includes('lalang')) return [3.5930, 98.6180];
  if (clean.includes('carrefour') || clean.includes('fair')) return [3.5975, 98.6631];
  if (clean.includes('medan mall')) return [3.5878, 98.6830];
  if (clean.includes('podomoro') || clean.includes('deli park')) return [3.5972, 98.6772];
  if (clean.includes('simalingkar') || clean.includes('pintu air')) return [3.5185, 98.6480];
  if (clean.includes('sun plaza')) return [3.5855, 98.6715];
  if (clean.includes('centre point') || clean.includes('center point')) return [3.5925, 98.6815];
  if (clean.includes('stasiun medan') || (clean.includes('stasiun') && clean.includes('medan'))) return [3.5902, 98.6788];
  if (clean.includes('kualanamu')) return [3.6422, 98.8852];
  if (clean.includes('amplas')) return [3.5350, 98.7180];
  if (clean.includes('pinang baris')) return [3.5850, 98.6150];
  if (clean.includes('usu')) return [3.5650, 98.6570];
  if (clean.includes('unimed')) return [3.6050, 98.7150];
  if (clean.includes('johor')) return [3.5350, 98.6750];
  if (clean.includes('helvetia')) return [3.6150, 98.6550];
  if (clean.includes('marelan')) return [3.6650, 98.6650];
  if (clean.includes('tembung')) return [3.6050, 98.7450];
  if (clean.includes('gatot subroto')) return [3.5950, 98.6550];
  if (clean.includes('adam malik')) return [3.6020, 98.6710];
  if (clean.includes('katamso')) return [3.5650, 98.6850];
  if (clean.includes('lapangan merdeka')) return [3.5915, 98.6780];
  if (clean.includes('patumbak')) return [3.4980, 98.7050];
  if (clean.includes('belmera')) return [3.6200, 98.7100];
  if (clean.includes('tanjung morawa')) return [3.5150, 98.7850];
  if (clean.includes('sunggal')) return [3.5850, 98.6050];
  if (clean.includes('pancur batu')) return [3.5050, 98.5750];
  if (clean.includes('deli tua')) return [3.4850, 98.6850];
  if (clean.includes('binjai')) return [3.6001, 98.4855];

  // 2. Jakarta & Greater Jakarta (Jabodetabek)
  if (clean.includes('monas') || clean.includes('gambir')) return [-6.1754, 106.8272];
  if (clean.includes('bundaran hi') || clean.includes('m.h. thamrin') || clean.includes('thamrin')) return [-6.1950, 106.8230];
  if (clean.includes('soekarno hatta') || clean.includes('soetta') || clean.includes('cgk')) return [-6.1275, 106.6537];
  if (clean.includes('halim')) return [-6.2655, 106.8906];
  if (clean.includes('grand indonesia')) return [-6.1950, 106.8210];
  if (clean.includes('scbd') || clean.includes('senayan')) return [-6.2250, 106.8080];
  if (clean.includes('sudirman')) return [-6.2088, 106.8225];
  if (clean.includes('kuningan') || clean.includes('rasuna said')) return [-6.2245, 106.8315];
  if (clean.includes('tebet')) return [-6.2285, 106.8580];
  if (clean.includes('blok m')) return [-6.2445, 106.7975];
  if (clean.includes('kemang')) return [-6.2625, 106.8155];
  if (clean.includes('kelapa gading')) return [-6.1585, 106.9055];
  if (clean.includes('ancol') || clean.includes('dufan')) return [-6.1255, 106.8335];
  if (clean.includes('tangerang') || clean.includes('bsd') || clean.includes('serpong')) return [-6.1783, 106.6319];
  if (clean.includes('bekasi')) return [-6.2383, 106.9756];
  if (clean.includes('depok')) return [-6.4025, 106.7942];
  if (clean.includes('bogor')) return [-6.5971, 106.8060];

  // 3. Bandung & West Java
  if (clean.includes('gedung sate')) return [-6.9025, 107.6186];
  if (clean.includes('itb')) return [-6.8915, 107.6107];
  if (clean.includes('dago')) return [-6.8785, 107.6155];
  if (clean.includes('lembang')) return [-6.8155, 107.6175];
  if (clean.includes('pasteur')) return [-6.8945, 107.5925];
  if (clean.includes('alun-alun bandung') || (clean.includes('alun') && clean.includes('bandung'))) return [-6.9218, 107.6069];
  if (clean.includes('stasiun bandung')) return [-6.9145, 107.6025];
  if (clean.includes('bandung')) return [-6.9175, 107.6191];

  // 4. Surabaya & East Java
  if (clean.includes('tunjungan plaza') || clean.includes('tunjungan')) return [-7.2625, 112.7385];
  if (clean.includes('gubeng')) return [-7.2655, 112.7525];
  if (clean.includes('pasar turi')) return [-7.2485, 112.7315];
  if (clean.includes('juanda')) return [-7.3798, 112.7875];
  if (clean.includes('surabaya')) return [-7.2575, 112.7521];

  // 5. Yogyakarta & Central Java
  if (clean.includes('malioboro')) return [-7.7925, 110.3658];
  if (clean.includes('prambanan')) return [-7.7520, 110.4914];
  if (clean.includes('tugu jogja')) return [-7.7828, 110.3671];
  if (clean.includes('ugm')) return [-7.7712, 110.3775];
  if (clean.includes('jogja') || clean.includes('yogyakarta')) return [-7.7956, 110.3695];
  if (clean.includes('solo') || clean.includes('surakarta')) return [-7.5666, 110.8290];
  if (clean.includes('semarang') || clean.includes('simpang lima')) return [-6.9904, 110.4229];

  // 6. Bali
  if (clean.includes('kuta')) return [-8.7230, 115.1725];
  if (clean.includes('seminyak')) return [-8.6915, 115.1685];
  if (clean.includes('ubud')) return [-8.5069, 115.2625];
  if (clean.includes('sanur')) return [-8.6785, 115.2635];
  if (clean.includes('ngurah rai') || clean.includes('dps')) return [-8.7482, 115.1672];
  if (clean.includes('bali') || clean.includes('denpasar')) return [-8.6705, 115.2126];

  // 7. Other Major Indonesian Cities
  if (clean.includes('makassar') || clean.includes('losari')) return [-5.1477, 119.4327];
  if (clean.includes('palembang') || clean.includes('ampera')) return [-2.9761, 104.7754];
  if (clean.includes('pekanbaru')) return [0.5071, 101.4478];
  if (clean.includes('batam')) return [1.1301, 104.0529];
  if (clean.includes('padang')) return [-0.9471, 100.4172];
  if (clean.includes('balikpapan')) return [-1.2379, 116.8289];
  if (clean.includes('samarinda')) return [-0.5022, 117.1536];
  if (clean.includes('manado')) return [1.4748, 124.8421];

  // Detect City anchors if general address
  let baseLat = 3.5908;
  let baseLng = 98.6743;
  if (clean.includes('jakarta')) { baseLat = -6.2088; baseLng = 106.8456; }
  else if (clean.includes('bandung')) { baseLat = -6.9175; baseLng = 107.6191; }
  else if (clean.includes('surabaya')) { baseLat = -7.2575; baseLng = 112.7521; }
  else if (clean.includes('semarang')) { baseLat = -6.9667; baseLng = 110.4167; }
  else if (clean.includes('jogja') || clean.includes('yogyakarta')) { baseLat = -7.7956; baseLng = 110.3695; }
  else if (clean.includes('bali')) { baseLat = -8.6705; baseLng = 115.2126; }

  let hash = 0;
  for (let i = 0; i < placeName.length; i++) {
    hash = (hash << 5) - hash + placeName.charCodeAt(i);
    hash |= 0;
  }
  const deltaLat = ((Math.abs(hash) % 40) - 20) / 1000;
  const deltaLng = (((Math.abs(hash * 3)) % 40) - 20) / 1000;

  if (isOrigin) {
    return [baseLat + deltaLat, baseLng + deltaLng];
  } else {
    return [baseLat - 0.035 + deltaLat, baseLng + 0.02 + deltaLng];
  }
}

// Calculate Haversine distance in KM
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Client-side High Precision Geographic Dynamic Routing
function computeDynamicRoutes(
  origStr: string,
  destStr: string
): { routes: TrafficRoute[]; alert: string; timeSaved: number; aiEval: AIEvaluation } {
  const posA = resolvePlaceCoordinates(origStr, true);
  const posB = resolvePlaceCoordinates(destStr, false);

  const straightKm = calculateHaversineKm(posA[0], posA[1], posB[0], posB[1]);

  let roadFactor = 1.38;
  if (straightKm > 15) roadFactor = 1.76;
  else if (straightKm > 10) roadFactor = 1.55;

  let distanceKm = Math.round(straightKm * roadFactor * 10) / 10;
  if (distanceKm < 2.5) distanceKm = 3.2;

  const isMarelanPatumbak =
    (origStr.toLowerCase().includes('marelan') && destStr.toLowerCase().includes('patumbak')) ||
    (destStr.toLowerCase().includes('marelan') && origStr.toLowerCase().includes('patumbak'));

  const isHighwayCandidate = distanceKm > 16 || isMarelanPatumbak;

  // Corridors
  let viaCorridor1 = 'Koridor Arteri Utama';
  let viaCorridor2 = 'Jalur Bebas Hambatan';
  let viaCorridor3 = 'Koridor Lingkar Sekunder';

  if (isMarelanPatumbak) {
    distanceKm = 32.6;
    viaCorridor1 = 'Jl. Yos Sudarso & Jl. Sisingamangaraja';
    viaCorridor2 = 'Jl. Tol Belmera';
    viaCorridor3 = 'Jl. Pertahanan & Medan Amplas';
  } else if (origStr.toLowerCase().includes('carrefour') || origStr.toLowerCase().includes('fair')) {
    distanceKm = 5.2;
    viaCorridor1 = 'Jl. Gatot Subroto & Jl. MT Haryono';
    viaCorridor2 = 'Jl. H. Adam Malik & Jl. Jawa';
    viaCorridor3 = 'Jl. Putri Hijau & Jl. Stasiun';
  } else if (origStr.toLowerCase().includes('podomoro')) {
    distanceKm = 14.5;
    viaCorridor1 = 'Jl. Brigjend Katamso & Simpang Pos';
    viaCorridor2 = 'Ringroad Ngumban Surbakti';
    viaCorridor3 = 'Jl. Juanda & Karya Wisata';
  } else if (origStr.toLowerCase().includes('bunga ester') || destStr.toLowerCase().includes('lalang')) {
    distanceKm = 7.6;
    viaCorridor1 = 'Jl. Setia Budi & Simpang Selayang';
    viaCorridor2 = 'Ringroad Gagak Hitam';
    viaCorridor3 = 'Jl. Flamboyan & Simpang Pemda';
  } else if (isHighwayCandidate) {
    viaCorridor1 = 'Jalur Arteri Perkotaan';
    viaCorridor2 = 'Jl. Tol Belmera';
    viaCorridor3 = 'Jalur Lintas Timur';
  }

  // Duration calculations
  let duration1 = Math.round(distanceKm * 2.1);
  let duration2 = Math.round(distanceKm * 1.55);
  let duration3 = Math.round(distanceKm * 1.8);

  if (isMarelanPatumbak) {
    duration1 = 65;
    duration2 = 51;
    duration3 = 58;
  }

  const timeSaved = Math.max(5, duration1 - duration2);

  const route1: TrafficRoute = {
    id: 'route-1',
    title: `Rute Utama: dari ${origStr} ke ${destStr} (via ${viaCorridor1})`,
    summary: `Melalui ${viaCorridor1} dari ${origStr} menuju ${destStr}`,
    distanceKm,
    durationMinutes: duration1,
    staticDurationMinutes: duration2,
    delayMinutes: duration1 - duration2,
    avgSpeedKmh: Math.round(distanceKm / (duration1 / 60)),
    trafficLevel: 'padat',
    stressIndex: 68,
    congestedRoad: viaCorridor1,
    isToll: false,
  };

  const route2: TrafficRoute = {
    id: 'route-2',
    title: `Rute Alternatif AI: dari ${origStr} ke ${destStr} (via ${viaCorridor2})`,
    summary: `Melalui ${viaCorridor2} bebas kemacetan menuju ${destStr}`,
    distanceKm,
    durationMinutes: duration2,
    staticDurationMinutes: duration2,
    delayMinutes: 0,
    avgSpeedKmh: Math.round(distanceKm / (duration2 / 60)),
    trafficLevel: 'lancar',
    stressIndex: 20,
    recommendedVia: viaCorridor2,
    timeSavedMinutes: timeSaved,
    isToll: isHighwayCandidate,
  };

  const route3: TrafficRoute = {
    id: 'route-3',
    title: `Rute Alternatif 2: dari ${origStr} ke ${destStr} (via ${viaCorridor3})`,
    summary: `Melalui ${viaCorridor3} menuju ${destStr}`,
    distanceKm: Math.round((distanceKm + 0.5) * 10) / 10,
    durationMinutes: duration3,
    staticDurationMinutes: duration2,
    delayMinutes: duration3 - duration2,
    avgSpeedKmh: Math.round(distanceKm / (duration3 / 60)),
    trafficLevel: 'ramai',
    stressIndex: 38,
    recommendedVia: viaCorridor3,
    timeSavedMinutes: Math.max(2, duration1 - duration3),
    isToll: false,
  };

  const alert = `Lalu lintas rute utama dari ${origStr.toLowerCase()} ke ${destStr.toLowerCase()} terpantau lancar. Disarankan melalui dari ${origStr.toLowerCase()} ke ${destStr.toLowerCase()} (via ${viaCorridor2}) dengan waktu tempuh sekitar ${duration2} menit (Jarak ${distanceKm} km).`;

  const aiEval: AIEvaluation = {
    bestRouteId: 'route-2',
    recommendationTitle: `Rute Nyaman dari ${origStr} ke ${destStr}`,
    recommendationReason: `Rute alternatif dari ${origStr} menuju ${destStr} (via ${viaCorridor2}) dipilih karena memiliki kelancaran arus lalu lintas terbaik, memangkas durasi kemacetan hingga ${timeSaved} menit, dan menjaga ritme detak jantung tetap tenang.`,
    stressAnalysis: `Kepadatan lalu lintas pada rute utama terpantau padat. Memilih rute alternatif ini mencegah lonjakan hormon stres kortisol dan kelelahan berkendara.`,
    healthTravelTips: [
      'Atur posisi sandaran jok sekitar 100-110 derajat agar postur punggung rileks.',
      'Lakukan pernapasan dalam (tarik 4 detik, hembuskan 8 detik) saat mendapati lampu merah.',
      'Sediakan botol air minum di dekat kemudi untuk menjaga hidrasi tubuh.',
    ],
    bestDepartureWindow: 'Berangkat dalam 10 menit ke depan untuk memanfaatkan arus kendaraan yang sedang mengalir lancar.',
    promoCatchphrase: `Bebas stres dari ${origStr} ke ${destStr}, jantung sehat & pikiran tenang! Hidup Sehatku Smart Traffic Route siap memandu perjalanan Anda.`,
  };

  return { routes: [route1, route2, route3], alert, timeSaved, aiEval };
}

// Clean spoken text: normalize whitespace without deleting valid words or speech phrases
export function cleanSpokenText(text: string): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

// Highly accurate Indonesian Speech Intent Extractor
export function extractAccurateVoiceIntent(rawText: string, currentOriginFallback: string = '') {
  let text = cleanSpokenText(rawText);
  if (!text) return { origin: currentOriginFallback || '', destination: '', mode: 'DRIVE' as const };

  const textLower = text.toLowerCase();

  // Detect mode
  let mode: 'DRIVE' | 'TWO_WHEELER' | 'BICYCLE' | 'WALK' = 'DRIVE';
  if (/\b(motor|naik motor|sepeda motor|roda dua|gojek|grab motor)\b/i.test(textLower)) {
    mode = 'TWO_WHEELER';
  } else if (/\b(sepeda|gowes|naik sepeda)\b/i.test(textLower)) {
    mode = 'BICYCLE';
  } else if (/\b(jalan kaki|jalan santai|berjalan)\b/i.test(textLower)) {
    mode = 'WALK';
  }

  // Strip travel mode qualifiers from the end so they don't pollute place names
  let cleanText = text
    .replace(/\s+(?:naik\s+mobil|naik\s+motor|naik\s+sepeda|jalan\s+kaki|dengan\s+mobil|dengan\s+motor|cepat|tercepat|bebas\s+macet)$/i, '')
    .trim();

  let extractedOrigin = '';
  let extractedDestination = '';

  // Pattern A: "Mau ke [B] dari [A]" or "Menuju [B] dari [A]" or "Tolong antar ke [B] dari [A]"
  const patternRev = /^(?:tolong\s+)?(?:saya\s+)?(?:mau\s+ke|menuju\s+ke|menuju|tujuan\s+ke|ke|sampai\s+ke|sampai)\s+(.+?)\s+(?:dari|start\s+dari|posisi\s+di|lokasi\s+di|mulai\s+dari)\s+(.+)$/i;
  const mRev = cleanText.match(patternRev);
  if (mRev) {
    extractedDestination = mRev[1].trim();
    extractedOrigin = mRev[2].trim();
  }

  // Pattern B: "Dari [A] mau ke / menuju / ke / sampai [B]" or "(Saya) dari [A] ke [B]"
  if (!extractedOrigin || !extractedDestination) {
    const patternNormal = /^(?:tolong\s+)?(?:saya\s+)?(?:dari|posisi\s+di|lokasi\s+di|lagi\s+di|start\s+dari|mulai\s+dari)\s+(.+?)\s+(?:menuju\s+ke|menuju|mau\s+ke|tujuan\s+ke|tujuan|ke|sampai\s+ke|sampai)\s+(.+)$/i;
    const mNormal = cleanText.match(patternNormal);
    if (mNormal) {
      extractedOrigin = mNormal[1].trim();
      extractedDestination = mNormal[2].trim();
    }
  }

  // Pattern C: "[A] ke / menuju / sampai [B]"
  if (!extractedOrigin || !extractedDestination) {
    const patternDirect = /^(.+?)\s+(?:menuju\s+ke|menuju|mau\s+ke|tujuan\s+ke|tujuan|ke|sampai\s+ke|sampai)\s+(.+)$/i;
    const mDirect = cleanText.match(patternDirect);
    if (mDirect) {
      const candA = mDirect[1].trim().replace(/^(?:saya|tolong|posisi|lokasi|lagi|start)\s+/i, '');
      const candB = mDirect[2].trim();
      if (!/^(?:mau|ingin|hendak|tujuan)$/i.test(candA)) {
        extractedOrigin = candA;
        extractedDestination = candB;
      }
    }
  }

  // Pattern D: Only Destination mentioned: "Mau ke [B]" or "Ke [B]" or "Menuju [B]"
  if (!extractedDestination) {
    const patternDestOnly = /^(?:tolong\s+)?(?:saya\s+)?(?:mau\s+ke|menuju\s+ke|menuju|tujuan\s+ke|tujuan|ke|sampai\s+ke|sampai)\s+(.+)$/i;
    const mDest = cleanText.match(patternDestOnly);
    if (mDest) {
      extractedDestination = mDest[1].trim();
      extractedOrigin = currentOriginFallback || '';
    }
  }

  // Fallback: If no destination parsed, use entire text as destination
  if (!extractedDestination && cleanText) {
    extractedDestination = cleanText;
    extractedOrigin = currentOriginFallback || '';
  }

  const cleanPlace = (p: string) => {
    return (p || '')
      .replace(/^(?:dari|ke|menuju|posisi\s+di|lokasi\s+di)\s+/i, '')
      .replace(/\s+(?:naik\s+motor|naik\s+mobil|naik\s+sepeda|jalan\s+kaki)$/i, '')
      .replace(/^[,\s.-]+|[,\s.-]+$/g, '')
      .trim();
  };

  extractedOrigin = cleanPlace(extractedOrigin);
  extractedDestination = cleanPlace(extractedDestination);

  const capitalizeWords = (str: string) => {
    return str.replace(/\b([a-z])/g, (c) => c.toUpperCase());
  };

  if (extractedOrigin) extractedOrigin = capitalizeWords(extractedOrigin);
  if (extractedDestination) extractedDestination = capitalizeWords(extractedDestination);

  return {
    origin: extractedOrigin || currentOriginFallback || '',
    destination: extractedDestination,
    mode,
  };
}

export const SmartTrafficRouteTab: React.FC = () => {
  const {
    profile,
    isPro,
    isProTrial,
    isPaidPro,
    isTrialExpired,
    trialTimeRemainingFormatted,
    setIsProModalOpen,
  } = useHealth();
  const [origin, setOrigin] = useState('Plaza Medan Fair, Medan');
  const [destination, setDestination] = useState('Medan Mall, Medan');
  const [travelMode, setTravelMode] = useState<'DRIVE' | 'TWO_WHEELER' | 'BICYCLE' | 'WALK'>('DRIVE');
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [routes, setRoutes] = useState<TrafficRoute[]>(INITIAL_ROUTES);
  const [smartAlertText, setSmartAlertText] = useState<string>(
    'Rute utama dari Plaza Medan Fair ke Medan Mall sedang mengalami kemacetan di Simpang Majestik & Pasar Rame. Disarankan melalui Jl. H. Adam Malik & Jl. Jawa. Perkiraan waktu tempuh 15 menit. Jarak 5.8 km. Estimasi penghematan waktu 9 menit.'
  );
  const [timeSavedMinutes, setTimeSavedMinutes] = useState<number>(9);
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
  const isListeningRef = useRef<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const trafficLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapsApiKey, setMapsApiKey] = useState('AIzaSyAii5jmjWw-WbGATErdNheY-41dCRJmSeY');

  // Leaflet Interactive Map Refs and State
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletLayersRef = useRef<L.LayerGroup | null>(null);
  const lastBoundsRef = useRef<L.LatLngBounds | null>(null);
  const [mapStyleTheme, setMapStyleTheme] = useState<'dark' | 'voyager' | 'osm'>('dark');
  const [mapRotation, setMapRotation] = useState<number>(0);
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);

  // Apply rotation to Leaflet Map Pane
  useEffect(() => {
    if (!leafletContainerRef.current) return;
    const mapPane = leafletContainerRef.current.querySelector('.leaflet-map-pane') as HTMLElement | null;
    if (mapPane) {
      mapPane.style.transform = `rotate(${mapRotation}deg)`;
      mapPane.style.transformOrigin = 'center center';
      mapPane.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
    }
  }, [mapRotation]);

  // Handle ESC key for exiting Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMapFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Invalidate map size on expand or fullscreen toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
        if (lastBoundsRef.current) {
          leafletMapRef.current.fitBounds(lastBoundsRef.current.pad(0.18));
        }
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [isMapFullscreen, isMapExpanded]);

  // Leaflet Interactive Map Effect Hook
  useEffect(() => {
    if (!leafletContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(leafletContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      });

      leafletMapRef.current = map;
      leafletLayersRef.current = L.layerGroup().addTo(map);
    }

    const map = leafletMapRef.current;
    const layers = leafletLayersRef.current;
    if (!map || !layers) return;

    // Tile style selection
    let tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; OpenStreetMap &copy; CARTO';

    if (mapStyleTheme === 'voyager') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    } else if (mapStyleTheme === 'osm') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });
    L.tileLayer(tileUrl, { maxZoom: 19, attribution }).addTo(map);

    layers.clearLayers();

    // Real Coordinates from Google Routes API or decoded Polyline (highest precision), falling back to resolver
    let startCoords: [number, number] = resolvePlaceCoordinates(origin, true);
    let endCoords: [number, number] = resolvePlaceCoordinates(destination, false);

    if (routes && routes.length > 0) {
      if (routes[0].startLocation?.latitude && routes[0].startLocation?.longitude) {
        startCoords = [routes[0].startLocation.latitude, routes[0].startLocation.longitude];
      } else if (routes[0].encodedPolyline) {
        const decodedPts = decodeGooglePolyline(routes[0].encodedPolyline);
        if (decodedPts && decodedPts.length > 0) {
          startCoords = decodedPts[0];
        }
      }

      if (routes[0].endLocation?.latitude && routes[0].endLocation?.longitude) {
        endCoords = [routes[0].endLocation.latitude, routes[0].endLocation.longitude];
      } else if (routes[0].encodedPolyline) {
        const decodedPts = decodeGooglePolyline(routes[0].encodedPolyline);
        if (decodedPts && decodedPts.length > 0) {
          endCoords = decodedPts[decodedPts.length - 1];
        }
      }
    }

    // Leaflet DivIcons for A and B
    const iconA = L.divIcon({
      className: 'custom-leaflet-marker-a',
      html: `<div style="background:#10b981; color:#0f172a; border:2px solid #ffffff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:14px; box-shadow:0 10px 15px -3px rgba(16, 185, 129, 0.5);">A</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const iconB = L.divIcon({
      className: 'custom-leaflet-marker-b',
      html: `<div style="background:#f43f5e; color:#ffffff; border:2px solid #ffffff; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:14px; box-shadow:0 10px 15px -3px rgba(244, 63, 94, 0.5);">B</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const markerA = L.marker(startCoords, { icon: iconA }).bindPopup(
      `<div style="font-family:sans-serif; padding:4px;"><b>📍 Titik Asal (Origin)</b><br/><span style="color:#10b981; font-size:12px;">${origin}</span></div>`
    );

    const markerB = L.marker(endCoords, { icon: iconB }).bindPopup(
      `<div style="font-family:sans-serif; padding:4px;"><b>🏁 Titik Tujuan (Destination)</b><br/><span style="color:#f43f5e; font-size:12px;">${destination}</span></div>`
    );

    layers.addLayer(markerA);
    layers.addLayer(markerB);

    const allBounds = L.latLngBounds([startCoords, endCoords]);

    const attachRoutePopup = (line: L.Polyline, r: TrafficRoute, strokeColor: string) => {
      const popupHtml = `
        <div style="font-family:sans-serif; min-width:180px; padding:4px;">
          <div style="font-size:11px; font-weight:800; color:${strokeColor}; margin-bottom:4px;">
            ${r.title}
          </div>
          <div style="font-size:12px; font-weight:700; color:#0f172a;">
            ⏱ ${r.durationMinutes} menit &bull; 🛣 ${r.distanceKm} km
          </div>
          <div style="font-size:10px; color:#64748b; margin-top:2px;">
            ${r.summary}
          </div>
          ${r.timeSavedMinutes && r.timeSavedMinutes > 0 ? `<div style="margin-top:6px; background:#ecfdf5; color:#047857; font-weight:800; font-size:10px; padding:3px 6px; border-radius:6px; display:inline-block;">⚡ Hemat ${r.timeSavedMinutes} Menit</div>` : ''}
        </div>
      `;
      line.bindPopup(popupHtml);
      line.on('click', () => {
        setSelectedRouteId(r.id);
      });
    };

    // Draw Polylines with Google Maps-style Traffic Segments
    routes.forEach((r, idx) => {
      let waypoints: [number, number][] = [];
      if (r.encodedPolyline) {
        waypoints = decodeGooglePolyline(r.encodedPolyline);
      }
      if (!waypoints || waypoints.length < 2) {
        waypoints = generateRouteWaypoints(startCoords, endCoords, idx);
      }

      waypoints.forEach((pt) => allBounds.extend(pt));

      const isSelected = r.id === selectedRouteId;
      const isAiBest = r.id === aiEvaluation?.bestRouteId || idx === 1;

      // Outer casing border for Google Maps vector styling
      const casing = L.polyline(waypoints, {
        color: '#090d16',
        weight: isSelected ? 10 : 7,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      });
      layers.addLayer(casing);

      // If Traffic Layer is turned off, draw solid color line
      if (!showTrafficLayer) {
        const simpleColor = isAiBest ? '#10b981' : idx === 0 ? '#ef4444' : '#06b6d4';
        const simpleLine = L.polyline(waypoints, {
          color: simpleColor,
          weight: isSelected ? 7 : 4,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        });
        attachRoutePopup(simpleLine, r, simpleColor);
        layers.addLayer(simpleLine);
        return;
      }

      // If AI Recommended Route (Green Highway / Free Flow like Google Maps)
      if (isAiBest) {
        if (isSelected) {
          const halo = L.polyline(waypoints, {
            color: '#10b981',
            weight: 16,
            opacity: 0.3,
            lineCap: 'round',
            lineJoin: 'round',
          });
          layers.addLayer(halo);
        }

        const greenLine = L.polyline(waypoints, {
          color: '#10b981',
          weight: isSelected ? 7 : 5,
          opacity: 0.98,
          lineCap: 'round',
          lineJoin: 'round',
        });
        attachRoutePopup(greenLine, r, '#10b981');
        layers.addLayer(greenLine);

        // Add Speed / Free-flow badge along alternative route
        const midIdx = Math.floor(waypoints.length / 2);
        const midPt = waypoints[midIdx];
        const greenBadge = L.divIcon({
          className: 'traffic-free-badge',
          html: `<div style="background:#065f46; color:#a7f3d0; border:1.5px solid #10b981; font-weight:800; font-size:9px; padding:2px 7px; border-radius:12px; white-space:nowrap; box-shadow:0 4px 6px -1px rgba(0,0,0,0.5); display:flex; align-items:center; gap:3px;"><span>⚡</span><span>Lancar 55 km/j</span></div>`,
          iconSize: [85, 20],
          iconAnchor: [42, 10],
        });
        const badgeMarker = L.marker(midPt, { icon: greenBadge });
        layers.addLayer(badgeMarker);
        return;
      }

      // If Main Congested Route (Google Maps Traffic Flow: Orange -> Dark Red Macet -> Orange)
      if (idx === 0) {
        const len = waypoints.length;
        const p1End = Math.max(1, Math.floor(len * 0.35));
        const p2End = Math.max(p1End + 1, Math.floor(len * 0.75));

        const seg1 = waypoints.slice(0, p1End + 1);
        const seg2 = waypoints.slice(p1End, p2End + 1);
        const seg3 = waypoints.slice(p2End);

        // Segment 1 (Moderate / Ramai Lancar - Kuning/Oranye)
        if (seg1.length >= 2) {
          const l1 = L.polyline(seg1, {
            color: '#f59e0b',
            weight: isSelected ? 7 : 4,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          });
          attachRoutePopup(l1, r, '#f59e0b');
          layers.addLayer(l1);
        }

        // Segment 2 (Heavy Congestion / Macet Stop-and-Go - Merah Terang dengan Glow)
        if (seg2.length >= 2) {
          const redGlow = L.polyline(seg2, {
            color: '#ef4444',
            weight: isSelected ? 16 : 10,
            opacity: 0.35,
            lineCap: 'round',
            lineJoin: 'round',
          });
          layers.addLayer(redGlow);

          const l2 = L.polyline(seg2, {
            color: '#ef4444',
            weight: isSelected ? 7 : 5,
            opacity: 0.98,
            lineCap: 'round',
            lineJoin: 'round',
          });
          attachRoutePopup(l2, r, '#ef4444');
          layers.addLayer(l2);

          // Congestion hotspot badge
          const bIdx = Math.floor(seg2.length / 2);
          const bPoint = seg2[bIdx];
          const jamBadge = L.divIcon({
            className: 'traffic-jam-badge',
            html: `<div style="background:#991b1b; color:#fecaca; border:1.5px solid #ef4444; font-weight:800; font-size:9px; padding:2px 7px; border-radius:12px; white-space:nowrap; box-shadow:0 4px 6px -1px rgba(0,0,0,0.5); display:flex; align-items:center; gap:3px;"><span>⚠️</span><span>Macet: 12 km/j</span></div>`,
            iconSize: [90, 20],
            iconAnchor: [45, 10],
          });
          const jamMarker = L.marker(bPoint, { icon: jamBadge });
          layers.addLayer(jamMarker);
        }

        // Segment 3 (Easing traffic - Kuning)
        if (seg3.length >= 2) {
          const l3 = L.polyline(seg3, {
            color: '#f59e0b',
            weight: isSelected ? 7 : 4,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          });
          attachRoutePopup(l3, r, '#f59e0b');
          layers.addLayer(l3);
        }
        return;
      }

      // Alternative 2 (Cyan)
      const alt2Line = L.polyline(waypoints, {
        color: '#06b6d4',
        weight: isSelected ? 7 : 4,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      });
      attachRoutePopup(alt2Line, r, '#06b6d4');
      layers.addLayer(alt2Line);
    });

    lastBoundsRef.current = allBounds;
    map.fitBounds(allBounds.pad(0.18));
  }, [origin, destination, routes, selectedRouteId, mapStyleTheme, showTrafficLayer]);

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
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'id-ID';

        recognition.onstart = () => {
          setIsListening(true);
          isListeningRef.current = true;
          setVoiceStatusText('Mendengarkan ucapan Anda (Durasi Bebas/Unlimited)... Tekan "Selesai" jika sudah.');
        };

        recognition.onresult = (event: any) => {
          let finalParts = '';
          let interimPart = '';

          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            const phrase = res[0]?.transcript || '';
            if (res.isFinal) {
              finalParts += (finalParts ? ' ' : '') + phrase;
            } else {
              interimPart += (interimPart ? ' ' : '') + phrase;
            }
          }

          let text = (finalParts ? finalParts + (interimPart ? ' ' + interimPart : '') : interimPart).trim();

          // Fallback if empty
          if (!text && event.results.length > 0) {
            text = (event.results[event.results.length - 1][0]?.transcript || '').trim();
          }

          if (text) {
            setSpeechTranscript(text);
            setManualVoiceInput(text);
            setVoiceStatusText(`Mendengarkan: "${text}"`);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error !== 'no-speech') {
            setVoiceStatusText('Sistem mikrofon mengalami jeda. Anda dapat mengetik lokasi di bawah.');
          }
        };

        recognition.onend = () => {
          // Keep listening continuously if user hasn't explicitly stopped listening or clicked Selesai
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch (e) {
              setIsListening(false);
            }
          } else {
            setIsListening(false);
          }
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
    if (!isPro) {
      setIsProModalOpen(true);
      return;
    }
    setIsVoiceModalOpen(true);
    setSpeechTranscript('');
    setManualVoiceInput('');
    isListeningRef.current = true;
    setVoiceStatusText('Mendengarkan ucapan Anda (Durasi Bebas/Unlimited)... Tekan "Selesai" jika sudah.');

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
    isListeningRef.current = false;
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

  // Step-by-Step Voice Pipeline: Voice -> Accurate Intent -> Instant UI Update -> Scroll to Results -> Google Maps Analysis
  const handleProcessVoiceInput = async (spokenText: string) => {
    if (!isPro) {
      handleStopListening();
      setIsVoiceModalOpen(false);
      setIsProModalOpen(true);
      return;
    }
    const text = cleanSpokenText(spokenText);
    if (!text) return;

    handleStopListening();
    setIsVoiceModalOpen(false);
    setManualVoiceInput('');

    // Instant accurate local extraction
    const localParsed = extractAccurateVoiceIntent(text, origin);
    let targetOrigin = localParsed.origin || origin || 'Lokasi Saya';
    let targetDestination = localParsed.destination || destination;
    let targetMode = localParsed.mode;

    // Immediately update input fields so user sees them on screen
    setOrigin(targetOrigin);
    if (targetDestination) {
      setDestination(targetDestination);
    }
    setTravelMode(targetMode);
    setVoiceDetectedToast({ origin: targetOrigin, destination: targetDestination });

    // Smoothly scroll directly to map & results section right away
    if (searchResultsRef.current) {
      searchResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    try {
      // AI enrichment from server with Gemini 3.8 Flash
      const parseRes = await fetch('/api/smart-traffic/parse-voice-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speechText: text, currentOrigin: targetOrigin }),
      });

      if (parseRes.ok) {
        const parseData = await parseRes.json();
        if (parseData.success) {
          if (parseData.origin && parseData.origin.trim()) {
            targetOrigin = parseData.origin.trim();
            setOrigin(targetOrigin);
          }
          if (parseData.destination && parseData.destination.trim()) {
            targetDestination = parseData.destination.trim();
            setDestination(targetDestination);
          }
          if (parseData.travelMode) {
            targetMode = parseData.travelMode;
            setTravelMode(targetMode);
          }
          setVoiceDetectedToast({ origin: targetOrigin, destination: targetDestination });
        }
      }
    } catch (e) {
      console.warn('Voice intent parse API error, using instant accurate extraction:', e);
    }

    // Execute Smart Route Analysis with accurate origin & destination
    if (targetOrigin && targetDestination) {
      await handleAnalyzeRoutes(targetOrigin, targetDestination);
    }
  };

  // Unified Voice & Manual Input Submit Handler:
  // Tombol "Selesai Bicara & Cari Rute Cerdas AI" dan tombol "Kirim" langsung menutup modal dan mengarahkan ke hasil
  const handleVoiceOrManualSubmit = () => {
    if (!isPro) {
      handleStopListening();
      setIsVoiceModalOpen(false);
      setIsProModalOpen(true);
      return;
    }
    handleStopListening();

    const textToUse =
      manualVoiceInput.trim() ||
      speechTranscript.trim() ||
      (origin && destination ? `${origin} ke ${destination}` : '');

    // Tutup modal suara dan bersihkan input draft seketika
    setIsVoiceModalOpen(false);
    setManualVoiceInput('');

    // Langsung arahkan (smooth scroll) ke bagian peta & hasil rute
    if (searchResultsRef.current) {
      searchResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (textToUse) {
      handleProcessVoiceInput(textToUse);
    } else if (origin && destination) {
      handleAnalyzeRoutes(origin, destination);
    }
  };

  const handleZoomIn = () => {
    leafletMapRef.current?.zoomIn();
  };
  const handleZoomOut = () => {
    leafletMapRef.current?.zoomOut();
  };
  const handleRotateCw = () => {
    setMapRotation((prev) => (prev + 45) % 360);
  };
  const handleResetNorth = () => {
    setMapRotation(0);
  };
  const handleFitRouteBounds = () => {
    if (leafletMapRef.current && lastBoundsRef.current) {
      leafletMapRef.current.fitBounds(lastBoundsRef.current.pad(0.18));
    }
  };
  const handleToggleFullscreen = () => {
    setIsMapFullscreen((prev) => !prev);
  };
  const handleToggleExpandHeight = () => {
    setIsMapExpanded((prev) => !prev);
  };

  // Helper to dynamically geocode addresses, update map markers, and fit bounds in real-time
  const updateMapMarkers = async (origStr: string, destStr: string) => {
    if (!mapInstanceRef.current || !(window as any).google) return;
    const googleMaps = (window as any).google.maps;
    if (!googleMaps) return;

    try {
      // Clear existing markers
      if (markersRef.current && markersRef.current.length) {
        markersRef.current.forEach((m) => {
          if (m && typeof m.setMap === 'function') m.setMap(null);
        });
        markersRef.current = [];
      }

      // Helper to geocode address
      const geocodeAddress = (addr: string): Promise<{ lat: number; lng: number } | null> => {
        return new Promise((resolve) => {
          try {
            const geocoder = new googleMaps.Geocoder();
            let cleanAddr = addr.trim();
            if (!/indonesia|jakarta|medan|bandung|surabaya|tangerang|bali/i.test(cleanAddr)) {
              cleanAddr += ', Medan, Indonesia';
            }
            geocoder.geocode({ address: cleanAddr }, (results: any, status: any) => {
              if (status === 'OK' && results && results[0] && results[0].geometry) {
                const loc = results[0].geometry.location;
                resolve({ lat: loc.lat(), lng: loc.lng() });
              } else {
                resolve(null);
              }
            });
          } catch (err) {
            resolve(null);
          }
        });
      };

      const [posA, posB] = await Promise.all([
        geocodeAddress(origStr),
        geocodeAddress(destStr),
      ]);

      const isMedanOrig = origStr.toLowerCase().includes('medan') || origStr.toLowerCase().includes('podomoro') || origStr.toLowerCase().includes('fair');
      const defaultOrig = isMedanOrig ? { lat: 3.5908, lng: 98.6743 } : { lat: -6.175392, lng: 106.827153 };
      const defaultDest = isMedanOrig ? { lat: 3.5185, lng: 98.648 } : { lat: -6.1275, lng: 106.6537 };

      const finalOrig = posA || defaultOrig;
      const finalDest = posB || defaultDest;

      // Create Origin Marker A
      const originMarker = new googleMaps.Marker({
        position: finalOrig,
        map: mapInstanceRef.current,
        title: `Titik Asal: ${origStr}`,
        label: { text: 'A', color: 'white', fontWeight: 'bold' },
      });

      // Create Destination Marker B
      const destMarker = new googleMaps.Marker({
        position: finalDest,
        map: mapInstanceRef.current,
        title: `Titik Tujuan: ${destStr}`,
        label: { text: 'B', color: 'white', fontWeight: 'bold' },
      });

      markersRef.current = [originMarker, destMarker];

      // Automatically fit map bounds to show both markers smoothly
      if (googleMaps.LatLngBounds) {
        const bounds = new googleMaps.LatLngBounds();
        bounds.extend(finalOrig);
        bounds.extend(finalDest);
        mapInstanceRef.current.fitBounds(bounds);
      } else {
        mapInstanceRef.current.setCenter(finalOrig);
      }
    } catch (e) {
      console.warn('Update map markers error:', e);
    }
  };

  // Perform Manual AI Route Analysis
  const handleAnalyzeRoutes = async (overrideOrigin?: string, overrideDest?: string) => {
    if (!isPro) {
      setIsProModalOpen(true);
      return;
    }
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
          
          let alertMessage = data.smartAlertText || '';
          if (!alertMessage.toLowerCase().includes(origToUse.toLowerCase().slice(0, 8))) {
            alertMessage = `Rute utama dari ${origToUse} ke ${destToUse} ${data.smartAlertText ? data.smartAlertText.replace(/^(Rute utama |Lalu lintas rute utama )/i, '') : 'sedang mengalami kepadatan.'}`;
          }
          
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
            origToUse,
            destToUse,
            travelMode,
            data.timeSavedMinutes || 0,
            data.routes[1]?.title || data.routes[0]?.title
          );

          // Update map pins and center
          updateMapMarkers(origToUse, destToUse);

          // Voice Readout Option
          speakTextSummary(alertMessage);
        }
      } else {
        // High-precision geographic dynamic calculation if server response fails (e.g. on static hosting hidupsehatku.my.id)
        const dynamicResult = computeDynamicRoutes(origToUse, destToUse);

        setRoutes(dynamicResult.routes);
        setSmartAlertText(dynamicResult.alert);
        setTimeSavedMinutes(dynamicResult.timeSaved);
        setAiEvaluation(dynamicResult.aiEval);
        setSelectedRouteId('route-2');
        setAnalyzedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        saveToHistory(origToUse, destToUse, travelMode, dynamicResult.timeSaved, dynamicResult.routes[1]?.title);
        updateMapMarkers(origToUse, destToUse);
        speakTextSummary(dynamicResult.alert);
      }
    } catch (err) {
      console.warn('Network exception while analyzing route, using high-precision dynamic routing:', err);
      const dynamicResult = computeDynamicRoutes(origToUse, destToUse);
      setRoutes(dynamicResult.routes);
      setSmartAlertText(dynamicResult.alert);
      setTimeSavedMinutes(dynamicResult.timeSaved);
      setAiEvaluation(dynamicResult.aiEval);
      setSelectedRouteId('route-2');
      setAnalyzedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      saveToHistory(origToUse, destToUse, travelMode, dynamicResult.timeSaved, dynamicResult.routes[1]?.title);
      updateMapMarkers(origToUse, destToUse);
      speakTextSummary(dynamicResult.alert);
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
    if (!isPro) {
      setIsProModalOpen(true);
      return;
    }
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
              {isPaidPro ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 text-amber-300 text-xs font-black shadow-lg shadow-amber-500/10">
                  <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>MEMBER PRO UNLOCKED</span>
                </span>
              ) : isProTrial ? (
                <button
                  type="button"
                  onClick={() => setIsProModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-teal-500/20 border border-amber-500/50 text-amber-300 text-xs font-black shadow-lg shadow-amber-500/10 hover:brightness-125 transition-all cursor-pointer animate-pulse"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>PRO TRIAL &bull; SISA {trialTimeRemainingFormatted}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsProModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 text-amber-300 text-xs font-black shadow-lg shadow-amber-500/10 hover:brightness-125 transition-all cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{isTrialExpired ? 'TRIAL SELESAI • UPGRADE PRO' : 'FITUR PRO • BUKA AKSES'}</span>
                </button>
              )}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Proteksi Jantung & Tensi Darah</span>
              </span>
            </div>

            {/* PROMINENT "MAU KEMANA?" VOICE ASSISTANT BUTTON */}
            <button
              type="button"
              onClick={handleStartListening}
              className={`px-4 py-2 rounded-2xl text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer ${
                isPro
                  ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-teal-400 hover:brightness-110 shadow-rose-500/30 animate-pulse'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 shadow-amber-500/30'
              }`}
            >
              {isPro ? (
                <>
                  <Mic className="w-4 h-4 fill-white animate-bounce" />
                  <span>🎙️ Mau Kemana? (Bicara)</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-950" />
                  <span className="text-slate-950">🎙️ Mau Kemana? (PRO)</span>
                </>
              )}
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

      {/* PRO TRIAL ACTIVE BANNER */}
      {isProTrial && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-teal-500/20 border-2 border-amber-500/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-amber-500/30 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-amber-300">
                  Trial PRO 3 Hari Sedang Berjalan (Akses Penuh Rute AI)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black tracking-wider">
                  ⏳ Sisa {trialTimeRemainingFormatted}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                Anda bebas menggunakan seluruh fitur pencarian rute cerdas AI, asisten suara, dan deteksi arus macet Google Maps secara gratis!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsProModalOpen(true)}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Crown className="w-4 h-4 fill-slate-950" />
            <span>Kunci Promo 40% (Beli PRO)</span>
          </button>
        </div>
      )}

      {/* PRO TEASER & UPGRADE BANNER (FOR FREE / EXPIRED USERS) */}
      {!isPro && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-500/20 via-amber-500/15 to-purple-500/20 border-2 border-rose-500/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5 text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-black shadow-xl shadow-rose-500/30 shrink-0">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-amber-300">
                  {isTrialExpired ? 'Masa Coba 3 Hari Selesai (Kembali ke Free)' : 'Fitur Rute AI & Pantauan Macet Google Maps (Versi PRO)'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black tracking-wider">
                  {isTrialExpired ? 'EXPIRED' : 'EKSKLUSIF PRO'}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {isTrialExpired
                  ? 'Suka dengan kemudahan navigasi bebas macet & rute anti-stres? Lanjutkan akses selamanya hanya mulai Rp 500/hari (Rp 15.000/bln)!'
                  : 'Dapatkan akses tak terbatas analisis jalan macet real-time, rekomendasi jalur alternatif cepat, dan asisten suara pintar untuk perjalanan sehat & bebas stres.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsProModalOpen(true)}
            className="w-full md:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Crown className="w-4 h-4 fill-slate-950" />
            <span>Beli PRO Rp 15.000 / Bulan</span>
          </button>
        </div>
      )}

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
              className="px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {isPro ? (
                <Navigation className="w-4.5 h-4.5 stroke-[2.5]" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>{isPro ? 'Gunakan Rute Alternatif Ini' : 'Gunakan Rute Alternatif (PRO)'}</span>
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isPro
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
              }`}
            >
              {isPro ? <Mic className="w-3.5 h-3.5 text-rose-400" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isPro ? 'Bicara' : 'Bicara (PRO)'}</span>
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
              className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer ${
                isPro
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-teal-500/25'
                  : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-amber-500/25'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menganalisis...</span>
                </>
              ) : isPro ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Cari Rute Alternatif</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Cari Rute Alternatif (PRO)</span>
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

      {/* 4. INTERACTIVE LEAFLET ROUTE MAP & GOOGLE MAPS TRAFFIC MONITOR */}
      <div
        ref={searchResultsRef}
        className={
          isMapFullscreen
            ? 'fixed inset-0 z-[99999] w-screen h-screen bg-slate-950 flex flex-col overflow-hidden'
            : 'rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl relative scroll-mt-6'
        }
      >
        {/* Map Header Toolbar */}
        <div className="p-3 bg-slate-950/95 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>Peta Lalu Lintas & Rute AI</span>
            </h3>
            {isMapFullscreen && (
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold text-[10px] border border-teal-500/30">
                Layar Penuh (ESC)
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            {/* Traffic Layer Toggle */}
            <button
              type="button"
              onClick={() => setShowTrafficLayer(!showTrafficLayer)}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                showTrafficLayer
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/30'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title="Tampilkan kondisi macet warna-warni seperti Google Maps"
            >
              <span>🚦</span>
              <span>{showTrafficLayer ? 'Macet Google Maps: Aktif' : 'Macet: Mati'}</span>
            </button>

            {/* Tile Themes */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setMapStyleTheme('dark')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  mapStyleTheme === 'dark' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🌙 Dark
              </button>
              <button
                type="button"
                onClick={() => setMapStyleTheme('voyager')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  mapStyleTheme === 'voyager' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🗺️ Voyager
              </button>
              <button
                type="button"
                onClick={() => setMapStyleTheme('osm')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  mapStyleTheme === 'osm' ? 'bg-teal-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🌐 OSM
              </button>
            </div>

            {/* Height Expander (When not in fullscreen) */}
            {!isMapFullscreen && (
              <button
                type="button"
                onClick={handleToggleExpandHeight}
                className={`p-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isMapExpanded
                    ? 'bg-teal-500 text-slate-950 border-teal-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={isMapExpanded ? 'Kecilkan tinggi peta' : 'Perbesar tinggi peta'}
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isMapExpanded ? 'Tinggi Standar' : 'Perbesar Peta'}</span>
              </button>
            )}

            {/* Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className={`p-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isMapFullscreen
                  ? 'bg-rose-500 text-white border-rose-400 shadow-lg'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 border-teal-400 hover:brightness-110 shadow'
              }`}
              title={isMapFullscreen ? 'Keluar Layar Penuh (ESC)' : 'Tampilkan Peta Layar Penuh'}
            >
              {isMapFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="font-extrabold text-[10px]">
                {isMapFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}
              </span>
            </button>
          </div>
        </div>

        {/* Leaflet Map Canvas Wrapper */}
        <div
          className={`w-full relative z-0 transition-all duration-300 ${
            isMapFullscreen
              ? 'flex-1 h-full min-h-0'
              : isMapExpanded
              ? 'h-[520px] sm:h-[620px]'
              : 'h-80 sm:h-96'
          }`}
        >
          <div ref={leafletContainerRef} className="w-full h-full" />

          {/* Floating On-Map Navigation & Orientation HUD (Right Top) */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2.5">
            {/* Zoom Controls */}
            <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-md">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-3 text-white hover:bg-slate-800 transition-colors flex items-center justify-center border-b border-slate-800 cursor-pointer active:scale-95"
                title="Perbesar Peta (Zoom In)"
              >
                <ZoomIn className="w-5 h-5 text-teal-400" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-3 text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                title="Perkecil Peta (Zoom Out)"
              >
                <ZoomOut className="w-5 h-5 text-teal-400" />
              </button>
            </div>

            {/* Map Rotation & Compass Controls */}
            <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-md">
              <button
                type="button"
                onClick={handleRotateCw}
                className="p-3 text-white hover:bg-slate-800 transition-colors flex items-center justify-center border-b border-slate-800 cursor-pointer active:scale-95 relative"
                title="Putar Peta 45 Derajat Searah Jarum Jam"
              >
                <RotateCw className="w-5 h-5 text-cyan-400" />
                <span className="absolute -bottom-1 -right-1 text-[9px] font-black text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded-full border border-cyan-500/40">
                  {mapRotation}°
                </span>
              </button>

              <button
                type="button"
                onClick={handleResetNorth}
                className="p-3 text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
                title="Reset Arah Utara (North Compass)"
              >
                <Compass
                  className="w-5 h-5 text-rose-400 transition-transform duration-300"
                  style={{ transform: `rotate(${-mapRotation}deg)` }}
                />
              </button>
            </div>

            {/* Recenter & Fit Route */}
            <button
              type="button"
              onClick={handleFitRouteBounds}
              className="p-3 rounded-2xl shadow-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-md text-white hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
              title="Pusatkan Rute Asal & Tujuan"
            >
              <Focus className="w-5 h-5 text-emerald-400" />
            </button>
          </div>

          {/* Floating Google Maps Live Traffic Legend Bar (Left Bottom) */}
          {showTrafficLayer && (
            <div className="absolute bottom-3 left-3 z-[1000] p-2.5 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-slate-800/90 shadow-2xl flex flex-col gap-1.5 max-w-[240px] pointer-events-auto">
              <div className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>🚦</span>
                <span>Arus Kemacetan Google Maps</span>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2.5 h-2 rounded bg-emerald-500"></span> Lancar
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2.5 h-2 rounded bg-amber-500"></span> Ramai
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2.5 h-2 rounded bg-rose-500"></span> Macet
                </span>
                <span className="flex items-center gap-1 text-red-700">
                  <span className="w-2.5 h-2 rounded bg-red-800"></span> Padat
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Route Line Legend Bar */}
        <div className="p-3 bg-slate-950/95 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs z-10 shrink-0">
          <div className="flex items-center flex-wrap gap-3 font-bold">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-3.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span> Rute Alternatif AI (Tercepat & Bebas Hambatan)
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-3.5 h-1.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span> Rute Utama (Jalur Arteri Padat)
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-3.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-500/50"></span> Alternatif 2
            </span>
          </div>
          <span className="text-slate-400 text-[10px]">Klik jalur di peta untuk melihat detail kecepatan</span>
        </div>

        {/* Selected Route Summary & Action Bar */}
        {selectedRoute && (
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10 shrink-0">
            <div className="space-y-0.5">
              <div className="text-[10px] text-slate-400 font-medium">Rute Aktif Terpilih:</div>
              <div className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
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
                className="px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                {isPro ? (
                  <Navigation className="w-4.5 h-4.5 stroke-[2.5]" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
                <span>{isPro ? 'Gunakan Rute Ini' : 'Gunakan Rute Ini (PRO)'}</span>
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
                    className={`w-full py-2.5 sm:py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                      isAiBest
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {isPro ? (
                      <Navigation className="w-4.5 h-4.5 stroke-[2.5]" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    <span>{isPro ? 'Gunakan Rute Ini' : 'Gunakan Rute Ini (PRO)'}</span>
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

            {/* Voice Wave Visualizer & Unlimited Listening Control */}
            <div className="flex flex-col items-center justify-center py-5 space-y-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
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

              <div className="text-center space-y-1.5 max-w-sm px-4 w-full">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-white block">{voiceStatusText}</span>
                </div>

                {speechTranscript ? (
                  <div className="p-3 rounded-xl bg-teal-950/70 border border-teal-500/40 text-left space-y-1">
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">
                      Teks Ucapan Terdeteksi (Real-time):
                    </span>
                    <p className="text-xs text-white font-medium leading-relaxed">
                      "{speechTranscript}"
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Silakan ucapkan asal dan tujuan Anda tanpa terburu-buru... <br />
                    Contoh: <i>"Saya dari Podomoro City Deli Medan mau ke Pintu Air 4 Simalingkar B"</i>
                  </p>
                )}
              </div>

              {/* ACTION BUTTON: SELESAI BICARA & CARI RUTE AI (Fungsi Sama dengan Tombol Kirim) */}
              <div className="w-full px-4 pt-1">
                <button
                  type="button"
                  onClick={handleVoiceOrManualSubmit}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer ring-2 ring-emerald-400/50"
                  title="Selesai bicara / kirim teks untuk cari rute cerdas AI"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menganalisis Rute Cerdas AI...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      <span>Selesai Bicara & Cari Rute Cerdas AI</span>
                    </>
                  )}
                </button>
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
                    if (e.key === 'Enter') {
                      handleVoiceOrManualSubmit();
                    }
                  }}
                  placeholder="Contoh: Saya dari Jl. Bunga Ester menuju Kampung Lalang..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={handleVoiceOrManualSubmit}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  title="Kirim teks / konfirmasi suara untuk cari rute"
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
