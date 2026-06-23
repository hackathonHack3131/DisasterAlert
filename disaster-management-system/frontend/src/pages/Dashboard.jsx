import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventsApi, shelterApi, simulateApi } from '../lib/api'
import { createStompClient, subscribeAlerts, subscribeShelters } from '../lib/websocket'
import UnifiedDisasterMap from '../components/map/UnifiedDisasterMap'

const DEFAULT_CENTER = { lat: 19.076, lng: 72.8777 }

export default function Dashboard() {
  const navigate = useNavigate()
  const demoMode = new URLSearchParams(window.location.search).get('demo') === 'true'
  
  const [alerts, setAlerts] = useState([])
  const [shelters, setShelters] = useState([])
  const [events, setEvents] = useState([])
  const [localEvents, setLocalEvents] = useState([])
  const [localAlerts, setLocalAlerts] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  
  const activeLocation = userLocation || DEFAULT_CENTER
  
  const visibleShelters = useMemo(() => shelters, [shelters])
  const visibleEvents = useMemo(() => [...localEvents, ...events], [events, localEvents])
  const visibleAlerts = useMemo(() => [...localAlerts, ...alerts], [alerts, localAlerts])

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      if (demoMode) {
        localStorage.setItem('token', 'demo-token')
        localStorage.setItem('role', 'ADMIN')
        localStorage.setItem('username', 'Mission Lead')
      } else {
        navigate('/login')
        return
      }
    }
    
    // Get user GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation(DEFAULT_CENTER)
      )
    }

    loadData()
    const client = createStompClient((c) => {
      subscribeAlerts(c, (a) => {
        setAlerts((prev) => [a, ...prev].slice(0, 20))
        loadData()
      })
      subscribeShelters(c, (s) => {
        setShelters((prev) => {
          const idx = prev.findIndex((x) => x.id === s.id)
          if (idx >= 0) {
            const copy = [...prev]
            copy[idx] = s
            return copy
          }
          return [...prev, s]
        })
      })
    })
    return () => client.deactivate()
  }, [demoMode, navigate])

  const loadData = () => {
    eventsApi.active().then((r) => setEvents(r.data)).catch(() => {})
    shelterApi.list().then((r) => setShelters(r.data)).catch(() => {})
  }

  const simulate = async (type) => {
    try {
      const fn = simulateApi[type.toLowerCase()] || simulateApi.disaster
      await fn({
        type,
        severity: 9,
        location: `Simulated ${type} — ${userLocation?.city || 'Live Region'}`,
        latitude: activeLocation.lat + (Math.random() * 0.05 - 0.025),
        longitude: activeLocation.lng + (Math.random() * 0.05 - 0.025),
        affectedRadius: 15,
      })
      loadData()
    } catch (err) {
      const drillEvent = {
        id: `local-${Date.now()}`,
        disasterType: type,
        message: `${type} drill activated near live user location`,
        location: 'Live GPS sector',
        latitude: activeLocation.lat,
        longitude: activeLocation.lng,
        severity: 9,
        affectedRadius: 15
      }
      setLocalEvents((prev) => [drillEvent, ...prev].slice(0, 8))
      setLocalAlerts((prev) => [
        {
          id: `local-alert-${Date.now()}`,
          disasterType: type,
          message: 'Local simulation overlay activated',
          location: drillEvent.location,
        },
        ...prev,
      ].slice(0, 8))
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <UnifiedDisasterMap 
        center={activeLocation} 
        events={visibleEvents} 
        shelters={visibleShelters} 
        alerts={visibleAlerts}
        onSimulate={simulate}
      />
    </div>
  )
}
