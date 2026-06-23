import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { eventsApi, rescueApi, shelterApi } from '../lib/api'
import { createStompClient, subscribeAlerts, subscribeRescue } from '../lib/websocket'
import UnifiedDisasterMap from '../components/map/UnifiedDisasterMap'

export default function OrgDashboard() {
  const navigate = useNavigate()
  const [rescues, setRescues] = useState([])
  const [shelters, setShelters] = useState([])
  const [events, setEvents] = useState([])

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/org/login')
      return
    }
    rescueApi.pending().then((r) => setRescues(r.data)).catch(() => {})
    shelterApi.list().then((r) => setShelters(r.data)).catch(() => {})
    eventsApi.active().then((r) => setEvents(r.data)).catch(() => {})

    const client = createStompClient((c) => {
      subscribeAlerts(c, () => eventsApi.active().then((r) => setEvents(r.data)))
      subscribeRescue(c, (req) => {
        setRescues((prev) => {
          const idx = prev.findIndex((x) => x.id === req.id)
          if (idx >= 0) {
            const copy = [...prev]
            copy[idx] = req
            return copy
          }
          return [req, ...prev]
        })
      })
    })
    return () => client.deactivate()
  }, [navigate])

  const acceptRescue = async (id) => {
    await rescueApi.updateStatus(id, 'IN_PROGRESS')
    setRescues((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'IN_PROGRESS' } : r)))
  }

  const registerShelter = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    await shelterApi.create({
      name: fd.get('name'),
      capacity: Number(fd.get('capacity')),
      availableBeds: Number(fd.get('availableBeds')),
      foodAvailable: true,
      medicalAvailable: fd.get('medical') === 'on',
      latitude: Number(fd.get('latitude')),
      longitude: Number(fd.get('longitude')),
      contactDetails: fd.get('contact'),
      status: 'INACTIVE',
    })
    alert('Shelter registered')
    shelterApi.list().then((r) => setShelters(r.data))
  }

  return (
    <div className="min-h-screen bg-cinematic-black">
      <header className="glass border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <span className="font-semibold text-accent-orange">Organisation Command Center</span>
        <Link to="/" className="text-body text-sm hover:text-white">Home</Link>
      </header>

      <div className="p-4 max-w-[1600px] mx-auto space-y-4">
        <div className="h-[600px] rounded-2xl overflow-hidden relative border border-white/10">
          <UnifiedDisasterMap events={events} shelters={shelters} alerts={[]} center={{ lat: 19.076, lng: 72.8777 }} onSimulate={() => {}} />
        </div>
        <div className="grid lg:grid-cols-2 gap-4">

        <div className="space-y-4">
          <div className="glow-card p-4">
            <h3 className="font-semibold mb-3">Rescue Requests</h3>
            {rescues.length === 0 ? (
              <p className="text-body text-sm">No pending requests</p>
            ) : (
              rescues.map((r) => (
                <div key={r.id} className="p-3 mb-2 rounded-lg bg-white/5">
                  <p className="text-sm text-headline">{r.description}</p>
                  <p className="text-body text-xs">Priority: {r.priority}</p>
                  {r.status === 'PENDING' && (
                    <button
                      onClick={() => acceptRescue(r.id)}
                      className="mt-2 px-3 py-1 text-xs rounded bg-accent-orange"
                    >
                      Accept Mission
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={registerShelter} className="glow-card p-4 space-y-3">
            <h3 className="font-semibold">Register Shelter</h3>
            <input name="name" placeholder="Shelter Name" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" required />
            <input name="capacity" type="number" placeholder="Capacity" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" required />
            <input name="availableBeds" type="number" placeholder="Available Beds" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" required />
            <input name="latitude" type="number" step="any" placeholder="Latitude" defaultValue="19.076" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
            <input name="longitude" type="number" step="any" placeholder="Longitude" defaultValue="72.8777" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
            <input name="contact" placeholder="Contact" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
            <label className="text-body text-sm flex items-center gap-2">
              <input name="medical" type="checkbox" /> Medical available
            </label>
            <button type="submit" className="w-full py-2 rounded-lg bg-accent-orange font-medium">Register</button>
          </form>
        </div>
        </div>
      </div>
    </div>
  )
}
