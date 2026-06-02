import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Circle, CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import {
  Activity,
  BatteryCharging,
  Bell,
  BrainCircuit,
  ClipboardList,
  MapPinned,
  Menu,
  Moon,
  PlaneTakeoff,
  RadioTower,
  Route,
  Settings,
  ShoppingBag,
  Stethoscope,
  Sun,
  Users,
  X,
} from 'lucide-react'
import { assessFlight, getOverview, setAuthToken } from './api'
import { AdvancedViews, type AdvancedView } from './AdvancedViews'
import { AuthView } from './AuthView'
import { LanguageSwitcher, useI18n } from './i18n'
import { ManagementViews, type View } from './ManagementViews'
import { BookingPortal, LandingPage } from './PortalViews'
import type { AuthSession, Drone, Mission } from './types'

type UserRole = AuthSession['user']['role']

const storedSession = (() => {
  try {
    const value = localStorage.getItem('droneops-session')
    return value ? (JSON.parse(value) as AuthSession) : undefined
  } catch {
    return undefined
  }
})()
setAuthToken(storedSession?.accessToken)

type PortalView = 'landing' | 'control' | 'book'
type ControlView = View | AdvancedView

const controlViews = new Set<ControlView>([
  'dashboard',
  'drones',
  'missions',
  'customers',
  'stations',
  'intelligence',
  'tracking',
  'maintenance',
  'audit',
])

function readRoute(): { portalView: PortalView; controlView: ControlView } {
  const [section, detail] = window.location.hash.replace(/^#\/?/, '').split('/')
  if (section === 'book') {
    return { portalView: 'book', controlView: 'dashboard' }
  }
  if (section === 'control') {
    const nextView = controlViews.has(detail as ControlView) ? (detail as ControlView) : 'dashboard'
    return { portalView: 'control', controlView: nextView }
  }
  return { portalView: 'landing', controlView: 'dashboard' }
}

function writeRoute(portalView: PortalView, controlView: ControlView = 'dashboard') {
  const nextHash =
    portalView === 'landing' ? '#/' : portalView === 'book' ? '#/book' : `#/control/${controlView}`
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash
  }
}

function canOpenControlView(view: ControlView, role: UserRole) {
  if (role === 'admin') return true
  if (role === 'dispatcher') {
    return !['customers', 'maintenance', 'audit'].includes(view)
  }
  return ['dashboard', 'intelligence', 'tracking'].includes(view)
}

function App() {
  const { t } = useI18n()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['operations-overview'],
    queryFn: getOverview,
    refetchInterval: 5000,
  })
  const [selectedMissionId, setSelectedMissionId] = useState<string>()
  const [selectedDroneId, setSelectedDroneId] = useState<string>()
  const [view, setView] = useState<ControlView>(() => readRoute().controlView)
  const [lightMode, setLightMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [portalView, setPortalView] = useState<PortalView>(() => readRoute().portalView)
  const [session, setSession] = useState<AuthSession | undefined>(storedSession)
  const role = session?.user.role
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

  useEffect(() => {
    const syncRoute = () => {
      const nextRoute = readRoute()
      setPortalView(nextRoute.portalView)
      setView(nextRoute.controlView)
      setMobileMenuOpen(false)
    }
    if (!window.location.hash) {
      writeRoute('landing')
    }
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  const navigate = useCallback((nextPortalView: PortalView, nextControlView: ControlView = 'dashboard') => {
    setPortalView(nextPortalView)
    setView(nextControlView)
    setMobileMenuOpen(false)
    writeRoute(nextPortalView, nextControlView)
  }, [])

  useEffect(() => {
    if (portalView === 'control' && role && !canOpenControlView(view, role)) {
      writeRoute('control')
    }
  }, [portalView, role, view])

  if (portalView === 'landing') {
    return <LandingPage onOpenControl={() => navigate('control')} onBook={() => navigate('book')} />
  }
  if (portalView === 'book') {
    return <BookingPortal onBack={() => navigate('landing')} onOpenControl={() => navigate('control')} />
  }
  if (!session) {
    return (
      <AuthView
        onBack={() => navigate('landing')}
        onAuthenticated={(nextSession) => {
          localStorage.setItem('droneops-session', JSON.stringify(nextSession))
          setAuthToken(nextSession.accessToken)
          setSession(nextSession)
        }}
      />
    )
  }
  if (isLoading) return <LoadingPanel />
  if (isError || !data) return <ErrorPanel onRetry={() => refetch()} />

  const runWeatherGate = () => {
    if (selectedDrone && selectedMission) {
      flightGate.mutate({ droneId: selectedDrone.id, missionId: selectedMission.id })
    }
  }

  const changeView = (nextView: View | AdvancedView) => {
    navigate('control', nextView)
  }
  const activeRole = session.user.role
  const activeView = canOpenControlView(view, activeRole) ? view : 'dashboard'

  return (
    <div className={`app-shell ${lightMode ? 'light-mode' : ''}`}>
      {mobileMenuOpen && <button className="menu-backdrop" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)} />}
      <button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)}>
        <Menu size={21} />
      </button>
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <button className="mobile-close" aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)}><X size={20} /></button>
        <div className="logo brand-logo"><span className="logo-mark" /><div><strong>DroneOps</strong><small>NEXUS</small></div></div>
        <div className="ops-pulse">
          <span />
          <div><strong>{t('nav.opsLive')}</strong><small>{t('nav.opsLiveText')}</small></div>
        </div>
        <nav>
          <button className={activeView === 'dashboard' ? 'active' : ''} onClick={() => changeView('dashboard')}><Activity size={19} /> {t('nav.dashboard')}</button>
          <button onClick={() => navigate('book')}><ShoppingBag size={19} /> {t('nav.bookDelivery')}</button>
          {activeRole !== 'customer' && <button className={activeView === 'drones' ? 'active' : ''} onClick={() => changeView('drones')}><MapPinned size={19} /> {t('nav.drones')}</button>}
          {activeRole !== 'customer' && <button className={activeView === 'missions' ? 'active' : ''} onClick={() => changeView('missions')}><Route size={19} /> {t('nav.missions')}</button>}
          {activeRole === 'admin' && <button className={activeView === 'customers' ? 'active' : ''} onClick={() => changeView('customers')}><Users size={19} /> {t('nav.customers')}</button>}
          {activeRole !== 'customer' && <button className={activeView === 'stations' ? 'active' : ''} onClick={() => changeView('stations')}><RadioTower size={19} /> {t('nav.stations')}</button>}
          <button className={activeView === 'intelligence' ? 'active' : ''} onClick={() => changeView('intelligence')}><BrainCircuit size={19} /> {t('nav.intelligence')}</button>
          <button className={activeView === 'tracking' ? 'active' : ''} onClick={() => changeView('tracking')}><MapPinned size={19} /> {t('nav.tracking')}</button>
          {activeRole === 'admin' && <button className={activeView === 'maintenance' ? 'active' : ''} onClick={() => changeView('maintenance')}><Stethoscope size={19} /> {t('nav.maintenance')}</button>}
          {activeRole === 'admin' && <button className={activeView === 'audit' ? 'active' : ''} onClick={() => changeView('audit')}><ClipboardList size={19} /> {t('nav.audit')}</button>}
        </nav>
        <div className="sidebar-footer">
          <LanguageSwitcher />
          <label className="role-switch">{t('nav.role')}
            <select value={activeRole} disabled>
              <option value={activeRole}>{session.user.name} ({activeRole})</option>
            </select>
          </label>
          <button
            onClick={() => {
              localStorage.removeItem('droneops-session')
              setAuthToken(undefined)
              setSession(undefined)
            }}
          >
            <Settings size={18} /> {t('nav.signOut')}
          </button>
          <button onClick={() => setLightMode((enabled) => !enabled)}><Settings size={18} /> {lightMode ? t('nav.darkMode') : t('nav.lightMode')}</button>
          <p>{data.storageMode === 'mongodb-atlas' ? t('nav.mongo') : t('nav.demo')}</p>
        </div>
      </aside>

      <main className="dashboard">
        <div className="command-ribbon">
          <span>{t('header.commandMode')}</span>
          <b>{t('header.confidence')}</b>
          <small>{t('header.humanFriendly')}</small>
        </div>
        <header className="header">
          <div>
            <p className="eyebrow">{t('header.eyebrow')}</p>
            <h1>{activeView === 'dashboard' ? t('header.dashboard') : translatedViewTitle(activeView, t)}</h1>
            <p className="subtitle">{t('header.subtitle')}</p>
          </div>
          <div className="header-actions">
            <button className="icon-button alert-button" onClick={() => changeView('intelligence')}>
              <Bell size={18} /><span>{data.alerts.length}</span>
            </button>
            <button className="icon-button" onClick={() => setLightMode((enabled) => !enabled)}>{lightMode ? <Moon size={18} /> : <Sun size={18} />}</button>
            <button className="primary" onClick={() => refetch()}>{t('header.refresh')}</button>
            <button className="icon-button" aria-label="Return to landing page" onClick={() => navigate('landing')}><PlaneTakeoff size={18} /></button>
          </div>
        </header>

        {activeView === 'dashboard' ? <>
        <section className="metrics">
          <Metric label={t('metrics.totalDrones')} value={data.metrics.totalDrones} hint={t('metrics.registeredFleet')} accent="blue" />
          <Metric label={t('metrics.activeMissions')} value={data.metrics.activeMissions} hint={t('metrics.inProgress')} accent="cyan" />
          <Metric label={t('metrics.charging')} value={data.metrics.charging} hint={t('metrics.atStations')} accent="amber" />
          <Metric label={t('metrics.readyNow')} value={data.metrics.ready} hint={t('metrics.avgBattery', { value: data.metrics.averageBattery })} accent="green" />
        </section>

        <section className="operations-grid">
          <article className="panel map-panel">
            <PanelTitle title={t('dashboard.mapTitle')} text={t('dashboard.mapText')} />
            <MapContainer center={[32.075, 34.79]} zoom={13} scrollWheelZoom={false} className="map">
              <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {data.stations.map((station) => (
                <CircleMarker key={station.id} center={[station.location.latitude, station.location.longitude]} radius={10} pathOptions={{ color: '#38bdf8', fillColor: '#0284c7', fillOpacity: 1 }}>
                  <Popup>{station.name} - {t('dashboard.slotsOpen', { value: station.totalSlots - station.occupiedSlots })}</Popup>
                </CircleMarker>
              ))}
              {data.noFlyZones.map((zone) => (
                <Circle
                  key={zone.id}
                  center={[zone.center.latitude, zone.center.longitude]}
                  radius={zone.radiusKm * 1000}
                  pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1, dashArray: '6 6' }}
                >
                  <Popup>{zone.name} - {zone.reason}</Popup>
                </Circle>
              ))}
              {data.drones.map((drone) => (
                <CircleMarker key={drone.id} center={[drone.location.latitude, drone.location.longitude]} radius={7} pathOptions={{ color: '#0b1221', fillColor: statusColor(drone.status), fillOpacity: 1 }}>
                  <Popup>{drone.id} - {t(`status.${drone.status}`)} - {drone.battery}%</Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </article>

          <article className="panel gate-panel">
            <PanelTitle title={t('dashboard.weatherTitle')} text={t('dashboard.weatherText')} />
            <div className="selection">
              <label>{t('dashboard.pendingMission')}
                <select value={selectedMission?.id ?? ''} onChange={(event) => setSelectedMissionId(event.target.value)}>
                  {pendingMissions.map((mission) => <option key={mission.id} value={mission.id}>{mission.id} - {mission.destination.label}</option>)}
                </select>
              </label>
              <label>{t('dashboard.availableDrone')}
                <select value={selectedDrone?.id ?? ''} onChange={(event) => setSelectedDroneId(event.target.value)}>
                  {availableDrones.map((drone) => <option key={drone.id} value={drone.id}>{drone.id} - {drone.battery}%</option>)}
                </select>
              </label>
            </div>
            <button className="flight-button" disabled={!selectedDrone || !selectedMission || flightGate.isPending} onClick={runWeatherGate}>
              <PlaneTakeoff size={18} />
              {flightGate.isPending ? t('dashboard.checkingWind') : t('dashboard.evaluate')}
            </button>
            {flightGate.data ? <DecisionCard assessment={flightGate.data} /> : (
              <div className="empty-gate">{t('dashboard.emptyGate')}</div>
            )}
            {flightGate.isError && <p className="api-error">{t('dashboard.weatherError')}</p>}
          </article>
        </section>

        <section className="bottom-grid">
          <article className="panel">
            <PanelTitle title={t('dashboard.missionQueue')} text={t('dashboard.missionPipeline')} />
            <div className="mission-list">
              {data.missions.map((mission) => <MissionRow key={mission.id} mission={mission} />)}
            </div>
          </article>
          <article className="panel">
            <PanelTitle title={t('dashboard.batteryReadiness')} text={t('dashboard.currentCharge')} />
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
            <PanelTitle title={t('dashboard.fleetStatus')} text={t('dashboard.operationalAvailability')} />
            {data.drones.map((drone) => <DroneRow key={drone.id} drone={drone} />)}
          </article>
        </section>
        </> : activeView === 'drones' || activeView === 'missions' || activeView === 'customers' || activeView === 'stations'
          ? <ManagementViews view={activeView} overview={data} onRefresh={refetch} />
          : <AdvancedViews view={activeView} overview={data} onRefresh={refetch} role={activeRole} />}
      </main>
    </div>
  )
}

function Metric({ label, value, hint, accent }: { label: string; value: number; hint: string; accent: string }) {
  return <article className={`metric ${accent}`}><small>{label}</small><strong>{value}</strong><span>{hint}</span></article>
}

function PanelTitle({ title, text }: { title: string; text: string }) {
  const { t } = useI18n()
  return <div className="panel-title"><div><h2>{title}</h2><p>{text}</p></div><span className="live">{t('common.live')}</span></div>
}

function DecisionCard({ assessment }: { assessment: Awaited<ReturnType<typeof assessFlight>> }) {
  const { t } = useI18n()
  return <div className={`decision ${assessment.decision.toLowerCase()}`}>
    <div><strong>{t(`decision.${assessment.decision}`)}</strong><span>{assessment.wind.speedKmh} {t('dashboard.wind')} - {assessment.wind.gustKmh} {t('dashboard.gust')}</span></div>
    <p>{assessment.reason}</p>
    <div className="energy"><span>{t('dashboard.routeDistance', { value: assessment.routeDistanceKm })}</span><span>{t('dashboard.requiredBattery', { value: assessment.batteryRequired })}</span><span>{t('dashboard.availableBattery', { value: assessment.availableBattery })}</span><span>{t('dashboard.energyMultiplier', { value: assessment.energyMultiplier })}</span></div>
  </div>
}

function MissionRow({ mission }: { mission: Mission }) {
  const { t } = useI18n()
  return <div className="mission-row"><div><strong>{mission.id}</strong><small>{mission.customer}</small></div><p>{mission.origin.label} <span>{t('common.to')}</span> {mission.destination.label}</p><b className={mission.priority}>{t(`status.${mission.priority}`)}</b><em className={mission.status}>{t(`status.${mission.status}`)}</em></div>
}

function DroneRow({ drone }: { drone: Drone }) {
  return <div className="drone-row"><span className={`dot ${drone.status}`} /><strong>{drone.id}</strong><small>{drone.model}</small><div className="battery"><BatteryCharging size={14} /> {drone.battery}%</div></div>
}

function statusColor(status: Drone['status']) {
  return status === 'available' ? '#22c55e' : status === 'mission' ? '#22d3ee' : '#f59e0b'
}

function LoadingPanel() {
  const { t } = useI18n()
  return <div className="state branded-loading"><div className="loading-orbit"><span /><PlaneTakeoff /></div><h1>{t('common.loading')}</h1><p>{t('common.connecting')}</p></div>
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n()
  return <div className="state"><h1>{t('common.apiOffline')}</h1><p>{t('common.startBackend')}</p><button className="primary" onClick={onRetry}>{t('common.retry')}</button></div>
}

function translatedViewTitle(view: View | AdvancedView, t: (key: string) => string) {
  const keys: Record<View | AdvancedView, string> = {
    dashboard: 'nav.dashboard',
    drones: 'nav.drones',
    missions: 'nav.missions',
    customers: 'nav.customers',
    stations: 'nav.stations',
    intelligence: 'nav.intelligence',
    tracking: 'nav.tracking',
    maintenance: 'nav.maintenance',
    audit: 'nav.audit',
  }
  return t(keys[view])
}

export default App
