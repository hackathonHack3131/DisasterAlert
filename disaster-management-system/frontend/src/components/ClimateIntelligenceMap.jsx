import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { climateApi } from '../lib/api'
import {
  CloudRain, Droplets, Flame, MapPin, Satellite, Thermometer, Wind, Radar,
  Navigation, Building2, AlertTriangle, Crosshair, Users, Waves, Ambulance,
  ShieldCheck, Layers3, RadioTower, Route, Cpu, Gauge,
} from 'lucide-react'

const MAP_MODES = [
  { id: 'rainfall', label: 'Rainfall Map', icon: CloudRain, color: '#3b82f6', desc: 'Precipitation intensity (CHIRPS-style)' },
  { id: 'humidity', label: 'Humidity Map', icon: Droplets, color: '#22c55e', desc: 'Moisture zones (ERA5-style)' },
  { id: 'risk', label: 'AI Risk Map', icon: Flame, color: '#ef4444', desc: 'Composite threat heatmap' },
  { id: 'flood', label: 'Flood Map', icon: Droplets, color: '#06b6d4', desc: 'Flood-prone polygons' },
  { id: 'satellite', label: 'Satellite Map', icon: Satellite, color: '#f97316', desc: 'Earth observation imagery' },
  { id: 'operations', label: 'Operations Map', icon: Building2, color: '#a855f7', desc: 'Shelters & disaster markers' },
]

const RISK_STYLES = {
  LOW: { color: '#22c55e', label: 'LOW RISK' },
  WARNING: { color: '#f97316', label: 'WARNING' },
  HIGH: { color: '#ef4444', label: 'HIGH RISK' },
  CRITICAL: { color: '#ff0040', label: 'CRITICAL' },
}

const OVERLAY_CONTROLS = [
  { id: 'shelters', label: 'Shelters', icon: MapPin, color: '#00f0ff' },
  { id: 'disasters', label: 'Disaster markers', icon: AlertTriangle, color: '#ff2d55' },
  { id: 'volunteers', label: 'Volunteer teams', icon: Users, color: '#a855f7' },
  { id: 'rescue', label: 'Rescue operations', icon: Ambulance, color: '#f97316' },
  { id: 'floodZones', label: 'Flood zones', icon: Waves, color: '#06b6d4' },
  { id: 'safeZones', label: 'Safe zones', icon: ShieldCheck, color: '#22c55e' },
  { id: 'weather', label: 'Weather layers', icon: Layers3, color: '#3b82f6' },
]

const RISK_LEGEND = [
  { label: 'Safe', color: '#22c55e' },
  { label: 'Moderate', color: '#facc15' },
  { label: 'Warning', color: '#f97316' },
  { label: 'Danger', color: '#ef4444' },
  { label: 'Critical', color: '#7f1d1d' },
]

const SIMULATED_ALERTS = [
  { id: 'a1', severity: 'CRITICAL', type: 'SOS REQUEST', message: '3 stranded civilians near low-lying sector 7', time: '00:18 ago' },
  { id: 'a2', severity: 'HIGH', type: 'FLOOD EXPANSION', message: 'Waterline rising along eastern drainage corridor', time: '01:42 ago' },
  { id: 'a3', severity: 'WARNING', type: 'SHELTER ACTIVE', message: 'Andheri relief shelter switched to overflow mode', time: '03:06 ago' },
  { id: 'a4', severity: 'INFO', type: 'VOLUNTEER DEPLOYED', message: 'Team V-12 moving toward priority evacuation route', time: '04:21 ago' },
]

const TILES = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  lightLabels: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  water: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
}

const HEAT_GRADIENTS = {
  rainfall: { 0.1: '#0c1929', 0.3: '#1d4ed8', 0.5: '#3b82f6', 0.7: '#60a5fa', 0.9: '#93c5fd', 1: '#dbeafe' },
  humidity: { 0.1: '#052e16', 0.35: '#15803d', 0.55: '#22c55e', 0.75: '#4ade80', 1: '#bbf7d0' },
  risk: { 0.1: '#052e16', 0.26: '#22c55e', 0.42: '#facc15', 0.58: '#f97316', 0.76: '#ef4444', 1: '#7f1d1d' },
}

function generateGrid(lat, lng, seed, spread = 1.2) {
  const points = []
  for (let row = -3; row <= 3; row += 1) {
    for (let col = -4; col <= 4; col += 1) {
      const wave = Math.sin((row * 1.7 + col * 2.3 + seed) * 0.9)
      const core = Math.cos((row - col + seed) * 0.7)
      const distance = Math.sqrt(row * row + col * col) / 5
      const weight = Math.max(0.08, Math.min(1, 0.52 + wave * 0.28 + core * 0.18 - distance * 0.18))
      points.push({
        lat: lat + row * 0.13 * spread + Math.sin(seed + col) * 0.035,
        lng: lng + col * 0.15 * spread + Math.cos(seed + row) * 0.035,
        weight,
      })
    }
  }
  return points
}

function polygonRing(lat, lng, latR, lngR) {
  const ring = []
  for (let a = 0; a <= 360; a += 30) {
    const rad = (a * Math.PI) / 180
    ring.push([lng + lngR * Math.cos(rad), lat + latR * Math.sin(rad)])
  }
  return ring
}

function generateFallbackFloodZones(lat, lng) {
  return [
    { id: 'f1', risk: 'HIGH', coordinates: polygonRing(lat, lng, 0.4, 0.55) },
    { id: 'f2', risk: 'WARNING', coordinates: polygonRing(lat + 0.35, lng + 0.25, 0.28, 0.38) },
    { id: 'f3', risk: 'CRITICAL', coordinates: polygonRing(lat - 0.2, lng - 0.15, 0.22, 0.32) },
  ]
}

function generateFallbackClimate(lat, lng, hourOffset = 0) {
  const seed = (Date.now() / 120000) + hourOffset
  const rainfallMm = Math.max(18, Math.round(112 + Math.sin(seed * 1.2) * 26 + hourOffset * 1.8))
  const humidityPercent = Math.min(98, Math.round(82 + Math.cos(seed * 0.9) * 7))
  const floodProbability = Math.min(100, Math.round(rainfallMm * 0.62 + humidityPercent * 0.18))
  const sosDensity = Math.min(100, 58 + Math.round(Math.sin(seed * 1.8) * 14))
  const terrainRisk = Math.min(100, 64 + Math.round(Math.cos(seed * 0.7) * 11))
  const populationDensity = Math.min(100, 76 + Math.round(Math.sin(seed * 0.5) * 9))
  const riskScore = Math.round(Math.min(98,
    (Math.min(100, rainfallMm / 1.6) * 0.26)
    + (humidityPercent * 0.18)
    + (floodProbability * 0.24)
    + (sosDensity * 0.12)
    + (terrainRisk * 0.1)
    + (populationDensity * 0.1)
    + hourOffset * 0.35
  ))
  const riskLevel = riskScore > 88 ? 'CRITICAL' : riskScore > 74 ? 'HIGH' : riskScore > 58 ? 'WARNING' : 'LOW'
  return {
    locationName: 'Mumbai Sector',
    currentRiskZone: 'Sector 7',
    rainfallMm,
    humidityPercent,
    temperatureC: Math.round(28 + Math.sin(seed * 0.7) * 3),
    windSpeedMs: Number((9.4 + Math.cos(seed * 1.1) * 2.2).toFixed(1)),
    riskScore,
    riskLevel,
    floodProbability,
    threatInputs: { rainfallMm, humidityPercent, floodProbability, sosDensity, terrainRisk, populationDensity },
    rainfallHeatmap: generateGrid(lat, lng, seed, 1.35),
    humidityHeatmap: generateGrid(lat + 0.15, lng - 0.08, seed + 2, 1.15),
    riskHeatmap: generateGrid(lat - 0.08, lng + 0.12, seed + 4, 1.28),
    floodZones: generateFallbackFloodZones(lat, lng),
  }
}

function generateOperations(lat, lng) {
  const teams = [
    { id: 'v1', name: 'Volunteer Alpha', status: 'Routing', lat: lat + 0.22, lng: lng - 0.3 },
    { id: 'v2', name: 'Medical Bravo', status: 'Arrived', lat: lat - 0.18, lng: lng + 0.24 },
    { id: 'v3', name: 'Relief Charlie', status: 'Standby', lat: lat + 0.38, lng: lng + 0.34 },
  ]
  const routes = [
    [[lat - 0.32, lng - 0.42], [lat - 0.08, lng - 0.18], [lat + 0.18, lng + 0.06], [lat + 0.33, lng + 0.28]],
    [[lat + 0.42, lng - 0.16], [lat + 0.21, lng - 0.02], [lat + 0.03, lng + 0.2], [lat - 0.22, lng + 0.35]],
  ]
  const safeZones = [
    { id: 's1', name: 'High-ground shelter corridor', lat: lat + 0.48, lng: lng - 0.28 },
    { id: 's2', name: 'Evacuation staging zone', lat: lat - 0.42, lng: lng + 0.42 },
  ]
  return { teams, routes, safeZones }
}

function mergeClimateResponse(data, fallback) {
  if (!data || typeof data !== 'object') return fallback
  return {
    ...fallback,
    ...data,
    rainfallHeatmap: data.rainfallHeatmap?.length ? data.rainfallHeatmap : fallback.rainfallHeatmap,
    humidityHeatmap: data.humidityHeatmap?.length ? data.humidityHeatmap : fallback.humidityHeatmap,
    riskHeatmap: data.riskHeatmap?.length ? data.riskHeatmap : fallback.riskHeatmap,
    floodZones: data.floodZones?.length ? data.floodZones : fallback.floodZones,
  }
}

function createUserIcon() {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div class="user-pin-wrap">
        <div class="user-pin-pulse"></div>
        <div class="user-pin-pulse user-pin-pulse-2"></div>
        <div class="user-pin-radar"></div>
        <div class="user-pin-core">
          <span>YOU</span>
        </div>
        <div class="user-pin-label">YOU ARE HERE</div>
      </div>
    `,
    iconSize: [120, 70],
    iconAnchor: [60, 35],
  })
}

function MetricCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="metric-card p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-lg" style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {sub && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto" style={{ color, background: `${color}25` }}>
            {sub}
          </span>
        )}
      </div>
      <p className="text-[10px] uppercase tracking-widest text-body">{label}</p>
      <p className="text-xl font-bold text-headline mt-0.5">{value}</p>
    </motion.div>
  )
}

export default function ClimateIntelligenceMap({
  events = [],
  shelters = [],
  center = { lat: 19.076, lng: 72.8777 },
  onUserLocationChange,
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const baseTileRef = useRef(null)
  const labelTileRef = useRef(null)
  const dataLayersRef = useRef([])
  const userMarkerRef = useRef(null)
  const userAccuracyRef = useRef(null)
  const hasCenteredOnUserRef = useRef(false)
  const lastReverseGeocodeRef = useRef('')

  const [climate, setClimate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeIndex, setTimeIndex] = useState(0)
  const [mapMode, setMapMode] = useState('rainfall')
  const [overlayStates, setOverlayStates] = useState({
    shelters: true,
    disasters: true,
    volunteers: true,
    rescue: true,
    floodZones: true,
    safeZones: true,
    weather: true,
  })
  const [userLocation, setUserLocation] = useState(null)
  const [locationMeta, setLocationMeta] = useState(null)
  const [trackingMode, setTrackingMode] = useState(true)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState(null)
  const [realtimeTick, setRealtimeTick] = useState(0)

  const activeMode = MAP_MODES.find((m) => m.id === mapMode) || MAP_MODES[0]
  const activeOrigin = userLocation || center
  const operations = useMemo(() => generateOperations(activeOrigin.lat, activeOrigin.lng), [activeOrigin.lat, activeOrigin.lng])

  const fetchClimate = useCallback(async (hourOffset = 0) => {
    const lat = userLocation?.lat ?? center.lat
    const lng = userLocation?.lng ?? center.lng
    const fallback = {
      ...generateFallbackClimate(lat, lng, hourOffset),
      locationName: locationMeta?.city || locationMeta?.region || 'Live GPS Sector',
      currentRiskZone: locationMeta?.state || locationMeta?.region || 'Local Zone',
    }
    setLoading(true)
    try {
      const res = await climateApi.intelligence(lat, lng, hourOffset)
      setClimate(mergeClimateResponse(res.data, fallback))
    } catch {
      setClimate(fallback)
    } finally {
      setLoading(false)
    }
  }, [center.lat, center.lng, locationMeta, userLocation])

  useEffect(() => {
    fetchClimate(timeIndex)
  }, [fetchClimate, timeIndex])

  useEffect(() => {
    const timer = setInterval(() => setRealtimeTick((tick) => tick + 1), 3000)
    return () => clearInterval(timer)
  }, [])

  const displayClimate = useMemo(() => {
    if (!climate) return null
    const drift = Math.sin(realtimeTick * 0.8)
    return {
      ...climate,
      rainfallMm: Math.max(0, Math.round(Number(climate.rainfallMm || 0) + drift * 2)),
      humidityPercent: Math.min(100, Math.max(0, Math.round(Number(climate.humidityPercent || 0) + drift))),
      temperatureC: Math.round(Number(climate.temperatureC || 0) + Math.cos(realtimeTick * 0.5)),
      windSpeedMs: Number((Number(climate.windSpeedMs || 0) + Math.sin(realtimeTick * 0.6) * 0.3).toFixed(1)),
      riskScore: Math.min(100, Math.max(0, Math.round(Number(climate.riskScore || 0) + drift * 1.5))),
    }
  }, [climate, realtimeTick])

  const realtimeAlerts = useMemo(() => {
    const eventAlerts = events.slice(0, 2).map((event, index) => ({
      id: `event-${event.id || index}`,
      severity: event.severity >= 8 ? 'CRITICAL' : 'HIGH',
      type: event.disasterType || 'DISASTER',
      message: event.message || event.location || 'New disaster event detected by AI risk model',
      time: 'LIVE',
    }))
    return [...eventAlerts, ...SIMULATED_ALERTS].slice(0, 4)
  }, [events])

  const activeSosRequests = useMemo(
    () => events.filter((event) => `${event.disasterType || event.type || ''}`.toUpperCase().includes('SOS')).length,
    [events]
  )

  const reverseGeocode = useCallback(async (lat, lng) => {
    const roundedKey = `${lat.toFixed(2)},${lng.toFixed(2)}`
    if (lastReverseGeocodeRef.current === roundedKey) return
    lastReverseGeocodeRef.current = roundedKey

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
      )
      if (!response.ok) throw new Error('Reverse geocode failed')
      const data = await response.json()
      const address = data.address || {}
      const city = address.city || address.town || address.village || address.county
      const state = address.state || address.region
      const region = address.state_district || address.county || address.suburb
      setLocationMeta({
        city,
        state,
        region,
        label: [city, state].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 2).join(', ') || 'Live GPS sector',
      })
    } catch {
      setLocationMeta({
        city: 'Live GPS',
        state: 'Local Region',
        region: 'Tracked Sector',
        label: 'Live GPS sector',
      })
    }
  }, [])

  useEffect(() => {
    if (!userLocation) return
    onUserLocationChange?.({
      ...userLocation,
      ...(locationMeta || {}),
      label: locationMeta?.label || 'Live GPS sector',
    })
  }, [locationMeta, onUserLocationChange, userLocation])

  // Geolocation — user location
  useEffect(() => {
    if (!navigator.geolocation) {
      const fallback = { lat: center.lat, lng: center.lng, accuracy: null, fallback: true, timestamp: Date.now() }
      setUserLocation(fallback)
      setLocError('Browser geolocation is unavailable')
      onUserLocationChange?.({ ...fallback, label: 'Default command sector' })
      return
    }

    setLocating(true)
    const handlePosition = (pos) => {
      const nextLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
        heading: pos.coords.heading,
        fallback: false,
        timestamp: pos.timestamp || Date.now(),
      }
      setUserLocation(nextLocation)
      reverseGeocode(nextLocation.lat, nextLocation.lng)
      setLocError(null)
      setLocating(false)
    }

    const handleLocationError = () => {
      const fallback = { lat: center.lat, lng: center.lng, accuracy: null, fallback: true, timestamp: Date.now() }
      setUserLocation(fallback)
      setLocationMeta({
        city: 'Mumbai',
        state: 'Maharashtra',
        region: 'Default Command Sector',
        label: 'Mumbai, Maharashtra',
      })
      setLocError('Using default zone until GPS permission is enabled')
      setLocating(false)
    }

    navigator.geolocation.getCurrentPosition(
      handlePosition,
      handleLocationError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    )

    const watchId = navigator.geolocation.watchPosition(
      handlePosition,
      handleLocationError,
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [center.lat, center.lng, onUserLocationChange, reverseGeocode])

  const clearDataLayers = (map) => {
    dataLayersRef.current.forEach((l) => {
      try {
        map.removeLayer(l)
      } catch (_) {}
    })
    dataLayersRef.current = []
  }

  const addHeatmap = (map, points, gradient, intensity = 1) => {
    if (!points?.length) return
    const heat = L.heatLayer(
      points.map((p) => [p.lat, p.lng, Math.min(1, p.weight * intensity)]),
      { radius: 55, blur: 35, max: 1.0, minOpacity: 0.35, gradient }
    )
    heat.addTo(map)
    dataLayersRef.current.push(heat)

    // Visible circles on each grid point
    points.forEach((p) => {
      if (p.weight < 0.15) return
      const circle = L.circle([p.lat, p.lng], {
        radius: 12000 + p.weight * 25000,
        fillColor: gradient[0.7] || '#3b82f6',
        fillOpacity: 0.12 + p.weight * 0.2,
        color: gradient[0.9] || '#60a5fa',
        weight: 1,
        opacity: 0.5,
      })
      circle.addTo(map)
      dataLayersRef.current.push(circle)
    })
  }

  const applyMapMode = useCallback(
    (map, mode, data) => {
      clearDataLayers(map)

      if (baseTileRef.current) map.removeLayer(baseTileRef.current)
      if (labelTileRef.current) map.removeLayer(labelTileRef.current)

      const baseUrl = mode === 'satellite' ? TILES.satellite : TILES.dark
      baseTileRef.current = L.tileLayer(baseUrl, {
        attribution: mode === 'satellite' ? 'Esri' : 'CARTO/OSM',
        maxZoom: 19,
      }).addTo(map)
      baseTileRef.current.bringToBack()

      if (mode !== 'satellite') {
        labelTileRef.current = L.tileLayer(TILES.lightLabels, { maxZoom: 19, pane: 'overlayPane' }).addTo(map)
      }

      switch (mode) {
        case 'rainfall':
          addHeatmap(map, data?.rainfallHeatmap, HEAT_GRADIENTS.rainfall, 1.8)
          break
        case 'humidity':
          addHeatmap(map, data?.humidityHeatmap, HEAT_GRADIENTS.humidity, 1.6)
          break
        case 'risk':
          addHeatmap(map, data?.riskHeatmap, HEAT_GRADIENTS.risk, 1.9)
          break
        case 'flood': {
          if (overlayStates.floodZones) {
            const zones = data?.floodZones?.length
              ? data.floodZones
              : generateFallbackFloodZones(center.lat, center.lng)
            zones.forEach((zone, i) => {
              const color = zone.risk === 'CRITICAL' ? '#ff0040' : zone.risk === 'HIGH' ? '#ef4444' : '#06b6d4'
              const poly = L.polygon(
                zone.coordinates.map(([lng, lat]) => [lat, lng]),
                { color, weight: 3, fillColor: color, fillOpacity: 0.45, dashArray: i % 2 ? '10 6' : '' }
              )
              poly.bindPopup(`<div style="font-family:sans-serif"><b style="color:${color}">FLOOD ZONE</b><br/>Risk: ${zone.risk}<br/>Evacuation advisory</div>`)
              poly.addTo(map)
              dataLayersRef.current.push(poly)
            })
          }
          addHeatmap(map, data?.rainfallHeatmap, HEAT_GRADIENTS.rainfall, 0.6)
          break
        }
        case 'satellite':
          break
        case 'operations':
          break
        default:
          break
      }

      if (overlayStates.weather && mode !== 'humidity') {
        addHeatmap(map, data?.humidityHeatmap, HEAT_GRADIENTS.humidity, mode === 'risk' ? 0.28 : 0.4)
      }

      if (overlayStates.floodZones && mode !== 'flood') {
        const zones = data?.floodZones?.length
          ? data.floodZones
          : generateFallbackFloodZones(center.lat, center.lng)
        zones.forEach((zone, i) => {
          const color = zone.risk === 'CRITICAL' ? '#ff0040' : zone.risk === 'HIGH' ? '#ef4444' : '#06b6d4'
          const poly = L.polygon(
            zone.coordinates.map(([lng, lat]) => [lat, lng]),
            {
              color,
              weight: 1.8,
              fillColor: color,
              fillOpacity: mode === 'risk' ? 0.18 : 0.12,
              dashArray: i % 2 ? '12 8' : '4 8',
            }
          )
          poly.bindPopup(`<div style="font-family:sans-serif"><b style="color:${color}">PREDICTIVE FLOOD ZONE</b><br/>Risk: ${zone.risk}<br/>AI expansion model</div>`)
          poly.addTo(map)
          dataLayersRef.current.push(poly)
        })
      }

      if (overlayStates.safeZones) {
        operations.safeZones.forEach((zone) => {
          const safe = L.circle([zone.lat, zone.lng], {
            radius: 18000,
            color: '#22c55e',
            weight: 2,
            fillColor: '#22c55e',
            fillOpacity: 0.14,
            dashArray: '8 8',
          })
          safe.bindPopup(`<b>${zone.name}</b><br/>Safe staging area`)
          safe.addTo(map)
          dataLayersRef.current.push(safe)
        })
      }

      if (overlayStates.rescue) {
        operations.routes.forEach((route, i) => {
          const line = L.polyline(route, {
            color: i % 2 ? '#f97316' : '#00f0ff',
            weight: 3,
            opacity: 0.86,
            dashArray: '12 10',
          })
          line.bindPopup(`<b>Rescue Route ${i + 1}</b><br/>AI-optimized evacuation corridor`)
          line.addTo(map)
          dataLayersRef.current.push(line)
        })
      }

      if (overlayStates.volunteers) {
        operations.teams.forEach((team) => {
          const marker = L.circleMarker([team.lat, team.lng], {
            radius: 10,
            fillColor: '#a855f7',
            color: '#ffffff',
            weight: 2,
            fillOpacity: 0.95,
          })
          marker.bindPopup(`<b>${team.name}</b><br/>${team.status}`)
          marker.addTo(map)
          dataLayersRef.current.push(marker)
        })
      }

      if (overlayStates.shelters && (mode === 'operations' || mode === 'flood' || mode === 'risk' || mode === 'rainfall')) {
        shelters.forEach((s) => {
          if (!s.latitude) return
          const c = L.circleMarker([s.latitude, s.longitude], {
            radius: 11,
            fillColor: s.status === 'ACTIVE' ? '#22c55e' : '#0050FF',
            color: '#fff',
            weight: 3,
            fillOpacity: 1,
          })
          c.bindPopup(`<b>${s.name}</b><br/>${s.status} · ${s.availableBeds} beds`)
          c.addTo(map)
          dataLayersRef.current.push(c)
        })
      }

      if (overlayStates.disasters && (mode === 'operations' || mode === 'risk' || mode === 'flood')) {
        events.forEach((e) => {
          if (!e.latitude) return
          const c = L.circleMarker([e.latitude, e.longitude], {
            radius: 12,
            fillColor: '#ff2d55',
            color: '#fff',
            weight: 3,
            fillOpacity: 1,
          })
          c.bindPopup(`<b>${e.disasterType}</b><br/>${e.message || ''}`)
          c.addTo(map)
          dataLayersRef.current.push(c)
        })
      }
    },
    [center, overlayStates, operations, shelters, events]
  )

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    const map = L.map(mapRef.current, { center: [center.lat, center.lng], zoom: 6, zoomControl: false })
    L.control.zoom({ position: 'topright' }).addTo(map)
    mapInstanceRef.current = map
    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Apply mode when climate/mode/toggles change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !climate) return
    applyMapMode(map, mapMode, climate)
  }, [climate, mapMode, overlayStates, applyMapMode])

  // User location marker
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !userLocation) return

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current)
    }
    if (userAccuracyRef.current) {
      map.removeLayer(userAccuracyRef.current)
    }

    const accuracy = userLocation.accuracy ? Math.min(Math.max(userLocation.accuracy, 80), 1500) : 650
    const accuracyCircle = L.circle([userLocation.lat, userLocation.lng], {
      radius: accuracy,
      color: '#00f0ff',
      weight: 1.5,
      fillColor: '#00f0ff',
      fillOpacity: 0.08,
      opacity: 0.65,
      dashArray: '8 8',
    })
    accuracyCircle.addTo(map)
    userAccuracyRef.current = accuracyCircle

    const marker = L.marker([userLocation.lat, userLocation.lng], {
      icon: createUserIcon(),
      zIndexOffset: 1000,
    })
    marker.bindPopup(
      `<div style="font-family:sans-serif;text-align:center">
        <b style="color:#00f0ff">YOUR LIVE LOCATION</b><br/>
        ${locationMeta?.label || 'Live GPS sector'}<br/>
        ${userLocation.lat.toFixed(4)}°, ${userLocation.lng.toFixed(4)}°
        ${userLocation.accuracy ? `<br/><small>Accuracy: ±${Math.round(userLocation.accuracy)}m</small>` : ''}
        ${userLocation.fallback ? '<br/><small>Approximate zone</small>' : '<br/><small>GPS active</small>'}
      </div>`
    )
    marker.addTo(map)
    userMarkerRef.current = marker

    if (!hasCenteredOnUserRef.current) {
      map.setView([userLocation.lat, userLocation.lng], userLocation.fallback ? 8 : 12, { animate: true })
      hasCenteredOnUserRef.current = true
    } else if (trackingMode) {
      map.panTo([userLocation.lat, userLocation.lng], { animate: true })
    }
  }, [locationMeta, trackingMode, userLocation])

  const centerOnUser = () => {
    const map = mapInstanceRef.current
    if (map && userLocation) {
      setTrackingMode(true)
      map.setView([userLocation.lat, userLocation.lng], userLocation.fallback ? 9 : 13, { animate: true })
      userMarkerRef.current?.openPopup()
    }
  }

  const riskStyle = displayClimate ? RISK_STYLES[displayClimate.riskLevel] || RISK_STYLES.LOW : RISK_STYLES.LOW
  const threatConfidence = Math.min(99, Math.max(72, Math.round((displayClimate?.riskScore || 70) + 11)))
  const floodProbability = Math.min(96, Math.max(38, Math.round(displayClimate?.floodProbability || ((displayClimate?.rainfallMm || 80) * 0.62))))
  const visibleSosRequests = Math.max(activeSosRequests, realtimeAlerts.filter((alert) => alert.type.includes('SOS')).length)
  const affectedPopulation = Math.round(((displayClimate?.riskScore || 68) * 420) + floodProbability * 115)
  const expansionPredictionKm = Math.max(3, Math.round(((displayClimate?.riskScore || 68) / 10) + timeIndex * 0.4))
  const evacuationRecommendation = (displayClimate?.riskScore || 0) > 78
    ? 'Evacuate low-lying grid sectors'
    : 'Stage teams near safe corridors'

  return (
    <div className="space-y-4">
      <style>{`
        .user-pin-wrap { position: relative; width: 120px; height: 70px; }
        .user-pin-core {
          position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #00f0ff, #0050ff);
          border: 3px solid #fff; box-shadow: 0 0 20px #00f0ff, 0 0 40px rgba(0,240,255,0.5);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 800; color: #fff; z-index: 3;
        }
        .user-pin-pulse {
          position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
          width: 48px; height: 48px; border-radius: 50%;
          border: 2px solid #00f0ff; animation: userPulse 2s ease-out infinite; z-index: 1;
        }
        .user-pin-pulse-2 { animation-delay: 1s; }
        .user-pin-radar {
          position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%);
          width: 64px; height: 64px; border-radius: 50%;
          background: conic-gradient(from 0deg, rgba(0,240,255,0.48), transparent 28%, transparent);
          opacity: 0.75; animation: userRadar 3s linear infinite; z-index: 0;
        }
        .user-pin-label {
          position: absolute; left: 50%; bottom: -2px; transform: translateX(-50%);
          white-space: nowrap; padding: 3px 7px; border-radius: 999px;
          color: #00f0ff; font-size: 9px; font-weight: 900; letter-spacing: 0.12em;
          background: rgba(0, 10, 22, 0.86); border: 1px solid rgba(0,240,255,0.55);
          box-shadow: 0 0 18px rgba(0,240,255,0.35); z-index: 4;
        }
        @keyframes userPulse {
          0% { transform: translate(-50%,-50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(1.8); opacity: 0; }
        }
        @keyframes userRadar {
          to { transform: translate(-50%,-50%) rotate(360deg); }
        }
      `}</style>

      {displayClimate && (
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
          <MetricCard icon={CloudRain} label="Rainfall" value={`${displayClimate.rainfallMm} mm`} color="#3b82f6" delay={0} />
          <MetricCard icon={Droplets} label="Humidity" value={`${displayClimate.humidityPercent}%`} color="#22c55e" delay={0.04} />
          <MetricCard icon={Thermometer} label="Temperature" value={`${displayClimate.temperatureC} C`} color="#f97316" delay={0.08} />
          <MetricCard icon={Wind} label="Wind Speed" value={`${displayClimate.windSpeedMs} m/s`} color="#06b6d4" delay={0.12} />
          <MetricCard icon={Flame} label="AI Risk Score" value={`${displayClimate.riskScore}/100`} sub={displayClimate.riskLevel} color={riskStyle.color} delay={0.16} />
          <MetricCard icon={Radar} label="Current Zone" value={displayClimate.currentRiskZone || 'Sector 7'} color="#a855f7" delay={0.2} />
          <MetricCard icon={Waves} label="Flood Probability" value={`${floodProbability}%`} color="#00f0ff" delay={0.24} />
          <MetricCard icon={RadioTower} label="Active SOS" value={visibleSosRequests} color="#ff2d55" delay={0.28} />
        </div>
      )}

      {/* Map mode tabs — each tab = different map */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl glass-strong border border-white/5">
        {MAP_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setMapMode(mode.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
              mapMode === mode.id
                ? 'text-white shadow-lg scale-[1.02]'
                : 'text-body hover:text-white hover:bg-white/5'
            }`}
            style={
              mapMode === mode.id
                ? {
                    background: `linear-gradient(135deg, ${mode.color}44, ${mode.color}18)`,
                    border: `1px solid ${mode.color}88`,
                    boxShadow: `0 0 24px -6px ${mode.color}`,
                  }
                : { border: '1px solid transparent' }
            }
          >
            <mode.icon className="w-4 h-4" style={{ color: mode.color }} />
            {mode.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Side panel */}
        <div className="lg:w-64 shrink-0 space-y-3">
          <div className="glass-strong rounded-2xl p-4 border border-white/5">
            <p className="text-xs font-bold text-headline mb-1">{activeMode.label}</p>
            <p className="text-[10px] text-body leading-relaxed">{activeMode.desc}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['CHIRPS', 'ERA5', 'Sentinel-1', 'OpenWeather'].map((feed) => (
                <span key={feed} className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-[0.14em] text-accent-blue bg-accent-blue/10 border border-accent-blue/20">
                  {feed}
                </span>
              ))}
            </div>
            <div
              className="mt-3 h-1 rounded-full"
              style={{ background: `linear-gradient(90deg, transparent, ${activeMode.color}, transparent)` }}
            />
          </div>

          <div className="glass-strong rounded-2xl p-3 border border-white/5 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-body px-1 mb-2">Overlay Controls</p>
            {OVERLAY_CONTROLS.map(({ id, label, icon: Icon, color }) => (
              <button
                key={id}
                type="button"
                onClick={() => setOverlayStates((prev) => ({ ...prev, [id]: !prev[id] }))}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-all"
              >
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                <span className="text-xs text-body text-left flex-1 truncate">{label}</span>
                <span
                  className={`relative w-8 h-4 rounded-full border transition-all ${
                    overlayStates[id] ? 'bg-white/15 border-white/30' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <span
                    className="absolute top-1/2 w-3 h-3 rounded-full transition-all"
                    style={{
                      left: overlayStates[id] ? '17px' : '2px',
                      transform: 'translateY(-50%)',
                      background: overlayStates[id] ? color : 'rgba(255,255,255,0.25)',
                      boxShadow: overlayStates[id] ? `0 0 12px ${color}` : 'none',
                    }}
                  />
                </span>
              </button>
            ))}
          </div>

          <div className="glass-strong rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-body mb-3">AI Layer Settings</p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] text-body mb-1">
                  <span>Threat confidence</span>
                  <span className="text-neon-red font-mono">{threatConfidence}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent-orange to-neon-red" style={{ width: `${threatConfidence}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-body mb-1">
                  <span>Flood probability</span>
                  <span className="text-accent-blue font-mono">{floodProbability}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-accent-blue to-neon-cyan" style={{ width: `${floodProbability}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-3 border border-cyan-400/10">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-[10px] uppercase tracking-widest text-body">Live GPS</p>
              <button
                type="button"
                onClick={() => setTrackingMode((enabled) => !enabled)}
                className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.18em] border transition-all ${
                  trackingMode ? 'text-neon-green border-neon-green/30 bg-neon-green/10' : 'text-body border-white/10 bg-white/5'
                }`}
              >
                {trackingMode ? 'Tracking' : 'Paused'}
              </button>
            </div>
            <p className="text-sm font-semibold text-headline truncate">{locationMeta?.label || 'Resolving live location'}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2">
                <span className="block text-body">Region</span>
                <strong className="text-headline font-mono">{locationMeta?.region || 'Scanning'}</strong>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2">
                <span className="block text-body">Accuracy</span>
                <strong className="text-headline font-mono">
                  {userLocation?.accuracy ? `${Math.round(userLocation.accuracy)}m` : userLocation?.fallback ? 'Approx' : 'GPS'}
                </strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={centerOnUser}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #00f0ff33, #0050ff55)',
              border: '1px solid #00f0ff66',
              boxShadow: '0 0 20px -5px rgba(0,240,255,0.6)',
            }}
          >
            <Navigation className="w-4 h-4" />
            {locating ? 'Locating…' : 'Center on YOU'}
          </button>
          {userLocation && (
            <p className="text-[10px] text-center text-body font-mono">
              {userLocation.lat.toFixed(3)}°, {userLocation.lng.toFixed(3)}°
            </p>
          )}
          {locError && <p className="text-[10px] text-center text-accent-orange">{locError}</p>}

          <div className="glass-strong rounded-2xl p-3">
            <div className="flex justify-between text-[10px] text-body mb-1">
              <span>Timeline</span>
              <span className="text-accent-blue font-mono">T+{timeIndex}h</span>
            </div>
            <input type="range" min={0} max={24} value={timeIndex} onChange={(e) => setTimeIndex(Number(e.target.value))} className="timeline-slider w-full accent-accent-blue" />
          </div>
        </div>

        {/* Map */}
        <motion.div
          key={mapMode}
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="flex-1 relative rounded-2xl overflow-hidden min-h-[560px] xl:min-h-[640px]"
          style={{
            border: `2px solid ${activeMode.color}55`,
            boxShadow: `0 0 80px -20px ${activeMode.color}, inset 0 0 60px -40px ${activeMode.color}22`,
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 z-[1000] px-4 py-2 flex items-center justify-between pointer-events-none"
            style={{ background: `linear-gradient(180deg, ${activeMode.color}22, transparent)` }}
          >
            <span className="text-sm font-bold text-headline flex items-center gap-2 pointer-events-auto">
              <activeMode.icon className="w-4 h-4" style={{ color: activeMode.color }} />
              {activeMode.label}
            </span>
            {userLocation && (
              <span className="text-[10px] px-2 py-1 rounded-full pointer-events-auto flex items-center gap-1" style={{ background: '#00f0ff22', color: '#00f0ff', border: '1px solid #00f0ff44' }}>
                <Crosshair className="w-3 h-3" /> YOU are here
              </span>
            )}
          </div>

          {loading && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md">
              <Radar className="w-10 h-10 text-accent-blue animate-spin" />
            </div>
          )}

          <div ref={mapRef} className="w-full h-[560px] xl:h-[640px]" />

          <div className="pointer-events-none absolute inset-0 z-[650] map-cinematic-overlay">
            <div className="absolute inset-0 map-intel-grid" />
            <div className="absolute inset-0 map-scanline" />
            <div className="satellite-sweep" />
            <div className="radar-sweep" />
            <div className="threat-blob threat-blob-critical" />
            <div className="threat-blob threat-blob-warning" />
            <div className="threat-ring threat-ring-a" />
            <div className="threat-ring threat-ring-b" />
          </div>

          {displayClimate && (
            <div className="absolute top-14 right-4 z-[1000] hidden xl:block glass-strong rounded-xl p-3 w-[260px] border border-neon-red/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-neon-red/15">
                  <Cpu className="w-4 h-4 text-neon-red" />
                </div>
                <div>
                  <p className="text-xs font-bold text-headline">AI Threat Analysis</p>
                  <p className="text-[10px] text-body">Predictive disaster expansion</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="ai-signal-tile">
                  <Gauge className="w-3.5 h-3.5 text-neon-red" />
                  <span>Confidence</span>
                  <strong>{threatConfidence}%</strong>
                </div>
                <div className="ai-signal-tile">
                  <Waves className="w-3.5 h-3.5 text-accent-blue" />
                  <span>Flood prob.</span>
                  <strong>{floodProbability}%</strong>
                </div>
                <div className="ai-signal-tile">
                  <Users className="w-3.5 h-3.5 text-accent-orange" />
                  <span>Population</span>
                  <strong>{affectedPopulation.toLocaleString()}</strong>
                </div>
                <div className="ai-signal-tile">
                  <Route className="w-3.5 h-3.5 text-neon-green" />
                  <span>Expansion</span>
                  <strong>{expansionPredictionKm} km</strong>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                <p className="text-[10px] uppercase tracking-widest text-body mb-1">Evacuation Recommendation</p>
                <p className="text-xs text-headline leading-snug">{evacuationRecommendation}</p>
              </div>
            </div>
          )}

          <div className="absolute right-4 top-[250px] z-[1000] hidden lg:block w-[280px]">
            <div className="glass-strong rounded-xl p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-headline flex items-center gap-2">
                  <RadioTower className="w-4 h-4 text-accent-blue" />
                  Realtime Alerts
                </p>
                <span className="text-[9px] text-neon-green font-mono">LIVE</span>
              </div>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {realtimeAlerts.map((alert, index) => {
                    const color = alert.severity === 'CRITICAL'
                      ? '#ff0040'
                      : alert.severity === 'HIGH'
                        ? '#ef4444'
                        : alert.severity === 'WARNING'
                          ? '#f97316'
                          : '#00f0ff'
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ delay: index * 0.04 }}
                        className="alert-feed-card"
                        style={{ borderColor: `${color}66`, boxShadow: `0 0 18px -12px ${color}` }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color }}>{alert.type}</span>
                          <span className="text-[9px] text-body font-mono">{alert.time}</span>
                        </div>
                        <p className="text-[11px] text-headline mt-1 leading-snug">{alert.message}</p>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {displayClimate && (
            <div className="absolute bottom-4 left-4 z-[1000] glass-strong rounded-xl p-3 text-[10px] max-w-[230px] border border-white/10">
              <p className="font-bold text-xs text-headline mb-2" style={{ color: activeMode.color }}>
                AI Risk Legend
              </p>
              <div className="space-y-1.5">
                {RISK_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="w-8 h-2 rounded-full" style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
                    <span className="text-body">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2 text-body">
                <Route className="w-3 h-3 text-accent-blue" />
                Heat intensity and disaster severity
              </div>
            </div>
          )}

          <div className="absolute bottom-4 right-4 z-[1000] glass-strong rounded-xl px-3 py-2 text-right">
            <p className="text-[10px] text-body">Threat</p>
            <p className="text-sm font-bold" style={{ color: riskStyle.color }}>{riskStyle.label}</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
