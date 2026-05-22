import { useEffect, useMemo, useRef } from 'react'

const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

export default function DisasterMap({ events = [], shelters = [] }) {
  const mapRef = useRef(null)
  const googleMapRef = useRef(null)
  const markersRef = useRef([])

  const markers = useMemo(() => {
    const list = []
    events.forEach((e) => {
      if (e.latitude && e.longitude) {
        list.push({
          lat: e.latitude,
          lng: e.longitude,
          label: e.disasterType || 'Alert',
          color: '#FF2D55',
        })
      }
    })
    shelters.forEach((s) => {
      if (s.latitude && s.longitude) {
        list.push({
          lat: s.latitude,
          lng: s.longitude,
          label: s.name || 'Shelter',
          color: '#0050FF',
        })
      }
    })
    return list
  }, [events, shelters])

  useEffect(() => {
    if (!GOOGLE_KEY || !mapRef.current) return

    const initMap = () => {
      if (!window.google?.maps) return
      const center = { lat: 20.5937, lng: 78.9629 }
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 5,
        center,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3ff' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#001133' }] },
        ],
        disableDefaultUI: false,
      })
      updateMarkers()
    }

    const updateMarkers = () => {
      if (!googleMapRef.current) return
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = markers.map((m) => {
        return new window.google.maps.Marker({
          position: { lat: m.lat, lng: m.lng },
          map: googleMapRef.current,
          title: m.label,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: m.color,
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#fff',
          },
        })
      })
    }

    if (window.google?.maps) {
      initMap()
    } else {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places`
      script.async = true
      script.onload = initMap
      document.head.appendChild(script)
    }

    return () => {
      markersRef.current.forEach((m) => m.setMap(null))
    }
  }, [markers])

  if (GOOGLE_KEY) {
    return (
      <div className="glow-card overflow-hidden rounded-2xl h-[400px]">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    )
  }

  if (MAPBOX_TOKEN) {
    return (
      <div className="glow-card h-[400px] flex items-center justify-center text-body text-sm">
        Mapbox token set — reload with Google key preferred, or use Mapbox component.
        <br />
        {markers.length} markers
      </div>
    )
  }

  return (
    <div className="glow-card h-[400px] flex flex-col items-center justify-center text-body text-sm p-6 text-center gap-2">
      <p>{markers.length} disaster/shelter markers loaded</p>
      <p className="text-xs">Add VITE_GOOGLE_MAPS_API_KEY in frontend/.env</p>
    </div>
  )
}
