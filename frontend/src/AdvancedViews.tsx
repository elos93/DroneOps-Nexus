import { type ReactNode, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  MapPinned,
  Printer,
  ShieldAlert,
  Stethoscope,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  advanceTelemetry,
  completeDroneService,
  confirmDelivery,
  createNoFlyZone,
  deleteNoFlyZone,
  getRecommendations,
  getForecast,
  getTracking,
  simulateMissionStep,
} from './api'
import { useI18n } from './i18n'
import type { NoFlyZoneInput, Overview, Role } from './types'

export type AdvancedView = 'intelligence' | 'tracking' | 'maintenance' | 'audit'

type Props = {
  view: AdvancedView
  overview: Overview
  onRefresh: () => Promise<unknown> | unknown
  role: Role
}

export function AdvancedViews({ view, overview, onRefresh, role }: Props) {
  if (view === 'intelligence') return <IntelligenceView overview={overview} onRefresh={onRefresh} role={role} />
  if (view === 'tracking') return <TrackingView overview={overview} onRefresh={onRefresh} role={role} />
  if (view === 'maintenance') return <MaintenanceView overview={overview} onRefresh={onRefresh} />
  return <AuditView overview={overview} />
}

function IntelligenceView({ overview, onRefresh, role }: Pick<Props, 'overview' | 'onRefresh' | 'role'>) {
  const { t } = useI18n()
  const pending = overview.missions.filter((mission) => mission.status === 'pending')
  const [zoneDraft, setZoneDraft] = useState<NoFlyZoneInput>({
    id: `NFZ-${overview.noFlyZones.length + 100}`,
    name: 'New restricted corridor',
    center: { latitude: 32.087, longitude: 34.799, label: 'Custom zone' },
    radiusKm: 0.25,
    reason: 'Temporary operations restriction.',
  })
  const zoneAction = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onSuccess: () => onRefresh(),
  })
  const [missionId, setMissionId] = useState(pending[0]?.id ?? '')
  const recommendations = useQuery({
    queryKey: ['recommendations', missionId],
    queryFn: () => getRecommendations(missionId),
    enabled: Boolean(missionId),
  })
  const forecast = useQuery({
    queryKey: ['forecast', missionId],
    queryFn: () => getForecast(missionId),
    enabled: Boolean(missionId),
  })

  return (
    <section className="advanced">
      <ViewHeader title={t('advanced.intelligenceTitle')} text={t('advanced.intelligenceText')} icon={<BrainCircuit />} />
      <div className="insight-metrics">
        <Insight label={t('advanced.delivered')} value={overview.analytics.deliveredMissions} />
        <Insight label={t('advanced.fleetUtilization')} value={`${overview.analytics.fleetUtilizationPercent}%`} />
        <Insight label={t('advanced.chargingLoad')} value={`${overview.analytics.chargingCapacityPercent}%`} />
        <Insight label={t('advanced.maintenanceDue')} value={overview.analytics.maintenanceDue} danger />
      </div>
      <div className="advanced-grid">
        <article className="panel">
          <h3 className="section-heading"><AlertTriangle size={17} /> {t('advanced.alertsCenter')}</h3>
          <div className="alert-list">
            {overview.alerts.length === 0 && <p className="empty-copy">{t('advanced.noAlerts')}</p>}
            {overview.alerts.map((alert) => (
              <div className={`alert-card ${alert.severity}`} key={alert.id}>
                <ShieldAlert size={17} />
                <div><strong>{alert.title}</strong><p>{alert.message}</p></div>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <h3 className="section-heading"><BrainCircuit size={17} /> {t('advanced.smartDispatch')}</h3>
          <select className="standalone-select" value={missionId} onChange={(event) => setMissionId(event.target.value)}>
            {pending.map((mission) => <option value={mission.id} key={mission.id}>{mission.id} - {mission.destination.label}</option>)}
          </select>
          <div className="recommendations">
            {recommendations.data?.map((recommendation, index) => (
              <div className="recommendation" key={recommendation.drone.id}>
                <b>#{index + 1}</b>
                <div><strong>{recommendation.drone.id}</strong><p>{recommendation.rationale}</p></div>
                <em>{recommendation.score}</em>
              </div>
            ))}
            {!missionId && <p className="empty-copy">{t('advanced.noPending')}</p>}
          </div>
        </article>
      </div>
      <article className="panel">
        <h3 className="section-heading"><MapPinned size={17} /> {t('advanced.noFlyZones')}</h3>
        {role === 'admin' && (
          <form className="geofence-form" onSubmit={(event) => {
            event.preventDefault()
            zoneAction.mutate(() => createNoFlyZone(zoneDraft))
          }}>
            <input value={zoneDraft.id} onChange={(event) => setZoneDraft({ ...zoneDraft, id: event.target.value })} />
            <input value={zoneDraft.name} onChange={(event) => setZoneDraft({ ...zoneDraft, name: event.target.value })} />
            <input type="number" step="0.01" value={zoneDraft.radiusKm} onChange={(event) => setZoneDraft({ ...zoneDraft, radiusKm: Number(event.target.value) })} />
            <button className="action"><Plus size={14} /> {t('advanced.addGeofence')}</button>
          </form>
        )}
        <div className="zone-grid">
          {overview.noFlyZones.map((zone) => (
            <div className="zone" key={zone.id}>
              <strong>{zone.name}</strong>
              <span>{t('advanced.protectedRadius', { value: zone.radiusKm })}</span>
              <p>{zone.reason}</p>
              {role === 'admin' && <button className="action danger" onClick={() => zoneAction.mutate(() => deleteNoFlyZone(zone.id))}><Trash2 size={14} /> {t('advanced.remove')}</button>}
            </div>
          ))}
        </div>
      </article>
      <div className="advanced-grid">
        <article className="panel">
          <h3 className="section-heading"><MapPinned size={17} /> {t('advanced.weatherScheduling')}</h3>
          {forecast.data?.bestWindow && (
            <div className="best-window">
              <strong>{t('advanced.bestDeparture')}: {new Date(forecast.data.bestWindow.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
              <p>{forecast.data.bestWindow.speedKmh} {t('dashboard.wind')}, {forecast.data.bestWindow.gustKmh} {t('dashboard.gust')}</p>
            </div>
          )}
          <div className="forecast-list">
            {forecast.data?.slots.map((slot) => (
              <div key={slot.time}><time>{new Date(slot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time><span>{slot.speedKmh}/{slot.gustKmh} km/h</span><b className={slot.recommendation.toLowerCase()}>{slot.recommendation}</b></div>
            ))}
          </div>
        </article>
        <article className="panel">
          <h3 className="section-heading"><ShieldAlert size={17} /> {t('advanced.notificationRouting')}</h3>
          <div className="notification-list">
            {overview.notifications.map((notice) => (
              <div key={notice.id}><strong>{notice.title}</strong><span>{notice.channel}</span><small>{notice.deliveryState}</small></div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}

function TrackingView({ overview, onRefresh, role }: Pick<Props, 'overview' | 'onRefresh' | 'role'>) {
  const { t } = useI18n()
  const [missionId, setMissionId] = useState(overview.missions[0]?.id ?? '')
  const [confirmationCode, setConfirmationCode] = useState('')
  const tracking = useQuery({
    queryKey: ['tracking', missionId, overview.missions],
    queryFn: () => getTracking(missionId),
    enabled: Boolean(missionId),
  })
  const action = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onSuccess: async () => {
      await onRefresh()
      await tracking.refetch()
    },
  })
  const result = tracking.data

  return (
    <section className="advanced">
      <ViewHeader title={t('advanced.trackingTitle')} text={t('advanced.trackingText')} icon={<MapPinned />} />
      <div className="tracking-picker">
        <select value={missionId} onChange={(event) => setMissionId(event.target.value)}>
          {overview.missions.map((mission) => <option key={mission.id} value={mission.id}>{mission.id} - {mission.customer}</option>)}
        </select>
        <button className="action" onClick={() => window.print()}><Printer size={15} /> {t('advanced.missionReport')}</button>
      </div>
      {result && (
        <div className="tracking-grid">
          <article className="panel delivery-card">
            <div className="delivery-code">{result.publicCode}</div>
            <h2>{result.mission.origin.label} {t('common.to')} {result.mission.destination.label}</h2>
            {result.mission.serviceType === 'medical' && <p className="medical-badge">{t('advanced.medicalColdChain')}</p>}
            {result.mission.priceIls && <p>{t('advanced.quotedPrice')}: ILS {result.mission.priceIls} | {result.mission.routeNotice}</p>}
            <p>{result.mission.status === 'delivered' ? t('advanced.deliveredSuccessfully') : t('advanced.etaMinutes', { value: result.estimatedArrivalMinutes })}</p>
            <div className="progress"><span style={{ width: `${result.mission.progressPercent}%` }} /></div>
            <strong>{t('advanced.percentComplete', { value: result.mission.progressPercent })}</strong>
            {result.drone && <p>{t('management.drone')}: {result.drone.id} | {t('management.battery')}: {result.drone.battery}%</p>}
            {role !== 'customer' && (result.mission.status === 'assigned' || result.mission.status === 'in-transit') ? (
              <button className="primary demo-button" onClick={() => action.mutate(() => simulateMissionStep(result.mission.id))}>
                {t('advanced.runLifecycle')}
              </button>
            ) : null}
            {role !== 'customer' && (result.mission.status === 'assigned' || result.mission.status === 'in-transit') ? (
              <button className="action demo-button" onClick={() => action.mutate(() => advanceTelemetry(result.mission.id))}>
                {t('advanced.moveDrone')}
              </button>
            ) : null}
            {result.mission.status === 'in-transit' && (
              <div className="proof">
                <input value={confirmationCode} onChange={(event) => setConfirmationCode(event.target.value)} placeholder={t('advanced.recipientOtp')} />
                <button className="action" onClick={() => action.mutate(() => confirmDelivery(result.mission.id, confirmationCode))}>
                  {t('advanced.confirmDelivery')}
                </button>
                {result.demoConfirmationCode && <small>{t('advanced.demoOtp')}: {result.demoConfirmationCode}</small>}
              </div>
            )}
          </article>
          <article className="panel">
            <h3 className="section-heading"><ClipboardList size={17} /> {t('advanced.missionTimeline')}</h3>
            <div className="timeline">
              {[...result.mission.timeline].reverse().map((entry) => (
                <div key={`${entry.status}-${entry.timestamp}`}>
                  <CheckCircle2 size={17} />
                  <strong>{entry.title}</strong>
                  <time>{new Date(entry.timestamp).toLocaleString()}</time>
                  <p>{entry.detail}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}
    </section>
  )
}

function MaintenanceView({ overview, onRefresh }: Pick<Props, 'overview' | 'onRefresh'>) {
  const { t } = useI18n()
  const service = useMutation({
    mutationFn: completeDroneService,
    onSuccess: () => onRefresh(),
  })
  return (
    <section className="advanced">
      <ViewHeader title={t('advanced.maintenanceTitle')} text={t('advanced.maintenanceText')} icon={<Stethoscope />} />
      <div className="data-table">
        <table>
          <thead><tr><th>{t('management.drone')}</th><th>{t('advanced.batteryHealth')}</th><th>{t('advanced.flightHours')}</th><th>{t('advanced.deliveries')}</th><th>{t('advanced.nextService')}</th><th>{t('management.actions')}</th></tr></thead>
          <tbody>
            {overview.drones.map((drone) => {
              const due = drone.flightHours >= drone.nextServiceHours || drone.batteryHealth < 82
              return (
                <tr key={drone.id}>
                  <td><strong>{drone.id}</strong><small>{drone.model}</small></td>
                  <td><span className={`health ${due ? 'due' : ''}`}>{drone.batteryHealth.toFixed(1)}%</span></td>
                  <td>{drone.flightHours}</td>
                  <td>{drone.completedDeliveries}</td>
                  <td>{drone.nextServiceHours} h</td>
                  <td><button className="action" disabled={drone.status === 'mission' || service.isPending} onClick={() => service.mutate(drone.id)}>{t('advanced.completeService')}</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AuditView({ overview }: Pick<Props, 'overview'>) {
  const { t } = useI18n()
  const events = useMemo(() => overview.auditEvents, [overview.auditEvents])
  return (
    <section className="advanced">
      <ViewHeader title={t('advanced.auditTitle')} text={t('advanced.auditText')} icon={<ClipboardList />} />
      <div className="audit-list">
        {events.map((event) => (
          <article className="audit-event" key={event.id}>
            <time>{new Date(event.timestamp).toLocaleString()}</time>
            <strong>{event.action.replaceAll('_', ' ')}</strong>
            <span>{event.entityType}: {event.entityId}</span>
            <p>{event.detail}</p>
            <small>{event.actor}</small>
          </article>
        ))}
      </div>
    </section>
  )
}

function ViewHeader({ title, text, icon }: { title: string; text: string; icon: ReactNode }) {
  return <header className="feature-header"><div className="feature-icon">{icon}</div><div><h2>{title}</h2><p>{text}</p></div></header>
}

function Insight({ label, value, danger }: { label: string; value: string | number; danger?: boolean }) {
  return <article className={`insight ${danger ? 'danger' : ''}`}><span>{label}</span><strong>{value}</strong></article>
}
