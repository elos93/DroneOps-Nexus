import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import {
  Activity,
  BatteryCharging,
  Bell,
  CloudSun,
  MapPinned,
  PlaneTakeoff,
  RadioTower,
  Route,
  Settings,
} from 'lucide-react'
import { assessFlight, getOverview } from './api'
import type { Drone, Mission } from './types'

function App() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['operations-overview'],
    queryFn: getOverview,
    refetchInterval: 15000,
  })
  const [selectedMissionId, setSelectedMissionId] = useState<string>()
  const [selectedDroneId, setSelectedDroneId] = useState<string>()
  const flightGate = useMutation({
    mutationFn: ({ droneId, missionId }: { droneId: string; missionId: string }) =>
      assessFlight(droneId, missionId),
  })

  const pendingMissions = data?.missions.filter((mission) => mission.status === 'pending') ?? []
  const availableDrones = data?.drones.filter((drone) => drone.status === 'available') ?? []
  const selectedMission =
    pendingMissions.find((mission) => mission.id === selectedMissionId) ?? pendingMissions[0]
  const selectedDrone =
    availableDrones.find((drone) => drone.id === selectedDroneId) ?? availableDrones[0]

  const batteryChart = useMemo(
    () => data?.drones.map((drone) => ({ name: drone.id, battery: drone.battery })) ?? [],
    [data],
  )

  if (isLoading) return <LoadingPanel />
  if (isError || !data) return <ErrorPanel onRetry={() => refetch()} />

  const runWeatherGate = () => {
    if (selectedDrone && selectedMission) {
      flightGate.mutate({ droneId: selectedDrone.id, missionId: selectedMission.id })
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo"><span className="logo-mark" /><div><strong>DroneOps</strong><small>NEXUS</small></div></div>
        <nav>
          <a className="active"><Activity size={19} /> Dashboard</a>
          <a><MapPinned size={19} /> Live Fleet</a>
          <a><Route size={19} /> Missions</a>
          <a><CloudSun size={19} /> Weather Gate</a>
          <a><RadioTower size={19} /> Stations</a>
        </nav>
        <div className="sidebar-footer">
          <a><Settings size={18} /> Settings</a>
          <p>{data.storageMode === 'mongodb-atlas' ? 'MongoDB Atlas connected' : 'Demo mode - add Atlas URI'}</p>
        </div>
      </aside>

      <main className="dashboard">
        <header className="header">
          <div>
            <p className="eyebrow">Fleet Operations Platform</p>
            <h1>Command Dashboard</h1>
            <p className="subtitle">Live missions, weather-aware dispatch and fleet readiness</p>
          </div>
          <div className="header-actions">
            <button className="icon-button"><Bell size={18} /></button>
            <button className="primary" onClick={() => refetch()}>Refresh Live Data</button>
          </div>
        </header>

        <section className="metrics">
          <Metric label="Total Drones" value={data.metrics.totalDrones} hint="Registered fleet" accent="blue" />
          <Metric label="Active Missions" value={data.metrics.activeMissions} hint="In progress" accent="cyan" />
          <Metric label="Charging" value={data.metrics.charging} hint="At stations" accent="amber" />
          <Metric label="Ready Now" value={data.metrics.ready} hint={`${data.metrics.averageBattery}% avg battery`} accent="green" />
        </section>

        <section className="operations-grid">
          <article className="panel map-panel">
            <PanelTitle title="Live Fleet Map" text="Drone and station positions" />
            <MapContainer center={[32.075, 34.79]} zoom={13} scrollWheelZoom={false} className="map">
              <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {data.stations.map((station) => (
                <CircleMarker key={station.id} center={[station.location.latitude, station.location.longitude]} radius={10} pathOptions={{ color: '#38bdf8', fillColor: '#0284c7', fillOpacity: 1 }}>
                  <Popup>{station.name} - {station.totalSlots - station.occupiedSlots} slots open</Popup>
                </CircleMarker>
              ))}
              {data.drones.map((drone) => (
                <CircleMarker key={drone.id} center={[drone.location.latitude, drone.location.longitude]} radius={7} pathOptions={{ color: '#0b1221', fillColor: statusColor(drone.status), fillOpacity: 1 }}>
                  <Popup>{drone.id} - {drone.status} - {drone.battery}%</Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </article>

          <article className="panel gate-panel">
            <PanelTitle title="Weather Flight Gate" text="Open-Meteo live safety check" />
            <div className="selection">
              <label>Pending mission
                <select value={selectedMission?.id ?? ''} onChange={(event) => setSelectedMissionId(event.target.value)}>
                  {pendingMissions.map((mission) => <option key={mission.id} value={mission.id}>{mission.id} - {mission.destination.label}</option>)}
                </select>
              </label>
              <label>Available drone
                <select value={selectedDrone?.id ?? ''} onChange={(event) => setSelectedDroneId(event.target.value)}>
                  {availableDrones.map((drone) => <option key={drone.id} value={drone.id}>{drone.id} - {drone.battery}%</option>)}
                </select>
              </label>
            </div>
            <button className="flight-button" disabled={!selectedDrone || !selectedMission || flightGate.isPending} onClick={runWeatherGate}>
              <PlaneTakeoff size={18} />
              {flightGate.isPending ? 'Checking live wind...' : 'Evaluate Takeoff'}
            </button>
            {flightGate.data ? <DecisionCard assessment={flightGate.data} /> : (
              <div className="empty-gate">Select a mission and run live wind verification before dispatch.</div>
            )}
            {flightGate.isError && <p className="api-error">Weather service unavailable. Try again shortly.</p>}
          </article>
        </section>

        <section className="bottom-grid">
          <article className="panel">
            <PanelTitle title="Mission Queue" text="Priority delivery pipeline" />
            <div className="mission-list">
              {data.missions.map((mission) => <MissionRow key={mission.id} mission={mission} />)}
            </div>
          </article>
          <article className="panel">
            <PanelTitle title="Battery Readiness" text="Current fleet charge level" />
            <div className="chart">
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={batteryChart}>
                  <defs><linearGradient id="battery" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} /><stop offset="100%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient></defs>
                  <XAxis dataKey="name" stroke="#62748b" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#101c30', border: '1px solid #20324b', borderRadius: 12 }} />
                  <Area dataKey="battery" type="monotone" stroke="#22d3ee" fill="url(#battery)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>
          <article className="panel fleet-panel">
            <PanelTitle title="Fleet Status" text="Operational availability" />
            {data.drones.map((drone) => <DroneRow key={drone.id} drone={drone} />)}
          </article>
        </section>
      </main>
    </div>
  )
}

function Metric({ label, value, hint, accent }: { label: string; value: number; hint: string; accent: string }) {
  return <article className={`metric ${accent}`}><small>{label}</small><strong>{value}</strong><span>{hint}</span></article>
}

function PanelTitle({ title, text }: { title: string; text: string }) {
  return <div className="panel-title"><div><h2>{title}</h2><p>{text}</p></div><span className="live">LIVE</span></div>
}

function DecisionCard({ assessment }: { assessment: Awaited<ReturnType<typeof assessFlight>> }) {
  return <div className={`decision ${assessment.decision.toLowerCase()}`}>
    <div><strong>{assessment.decision}</strong><span>{assessment.wind.speedKmh} km/h wind - {assessment.wind.gustKmh} km/h gust</span></div>
    <p>{assessment.reason}</p>
    <div className="energy"><span>Route {assessment.routeDistanceKm} km</span><span>Required {assessment.batteryRequired}%</span><span>Available {assessment.availableBattery}%</span><span>x{assessment.energyMultiplier} energy</span></div>
  </div>
}

function MissionRow({ mission }: { mission: Mission }) {
  return <div className="mission-row"><div><strong>{mission.id}</strong><small>{mission.customer}</small></div><p>{mission.origin.label} <span>to</span> {mission.destination.label}</p><b className={mission.priority}>{mission.priority}</b><em className={mission.status}>{mission.status}</em></div>
}

function DroneRow({ drone }: { drone: Drone }) {
  return <div className="drone-row"><span className={`dot ${drone.status}`} /><strong>{drone.id}</strong><small>{drone.model}</small><div className="battery"><BatteryCharging size={14} /> {drone.battery}%</div></div>
}

function statusColor(status: Drone['status']) {
  return status === 'available' ? '#22c55e' : status === 'mission' ? '#22d3ee' : '#f59e0b'
}

function LoadingPanel() {
  return <div className="state"><div className="spinner" /><h1>Launching DroneOps Nexus</h1><p>Connecting to operations API...</p></div>
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return <div className="state"><h1>API is offline</h1><p>Start the NestJS backend to load operations data.</p><button className="primary" onClick={onRetry}>Retry Connection</button></div>
}

export default App
