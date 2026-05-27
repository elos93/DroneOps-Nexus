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
} from 'lucide-react'
import {
  completeDroneService,
  confirmDelivery,
  getRecommendations,
  getTracking,
  simulateMissionStep,
} from './api'
import type { Overview } from './types'

export type AdvancedView = 'intelligence' | 'tracking' | 'maintenance' | 'audit'

type Props = {
  view: AdvancedView
  overview: Overview
  onRefresh: () => Promise<unknown> | unknown
}

export function AdvancedViews({ view, overview, onRefresh }: Props) {
  if (view === 'intelligence') return <IntelligenceView overview={overview} />
  if (view === 'tracking') return <TrackingView overview={overview} onRefresh={onRefresh} />
  if (view === 'maintenance') return <MaintenanceView overview={overview} onRefresh={onRefresh} />
  return <AuditView overview={overview} />
}

function IntelligenceView({ overview }: Pick<Props, 'overview'>) {
  const pending = overview.missions.filter((mission) => mission.status === 'pending')
  const [missionId, setMissionId] = useState(pending[0]?.id ?? '')
  const recommendations = useQuery({
    queryKey: ['recommendations', missionId],
    queryFn: () => getRecommendations(missionId),
    enabled: Boolean(missionId),
  })

  return (
    <section className="advanced">
      <ViewHeader title="Mission Intelligence" text="Automated risk alerts and AI-style dispatch scoring." icon={<BrainCircuit />} />
      <div className="insight-metrics">
        <Insight label="Delivered" value={overview.analytics.deliveredMissions} />
        <Insight label="Fleet utilization" value={`${overview.analytics.fleetUtilizationPercent}%`} />
        <Insight label="Charging load" value={`${overview.analytics.chargingCapacityPercent}%`} />
        <Insight label="Maintenance due" value={overview.analytics.maintenanceDue} danger />
      </div>
      <div className="advanced-grid">
        <article className="panel">
          <h3 className="section-heading"><AlertTriangle size={17} /> Alerts Center</h3>
          <div className="alert-list">
            {overview.alerts.length === 0 && <p className="empty-copy">No operational alerts. Fleet is clear.</p>}
            {overview.alerts.map((alert) => (
              <div className={`alert-card ${alert.severity}`} key={alert.id}>
                <ShieldAlert size={17} />
                <div><strong>{alert.title}</strong><p>{alert.message}</p></div>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <h3 className="section-heading"><BrainCircuit size={17} /> Smart Dispatch Recommendation</h3>
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
            {!missionId && <p className="empty-copy">No pending delivery is waiting for dispatch.</p>}
          </div>
        </article>
      </div>
      <article className="panel">
        <h3 className="section-heading"><MapPinned size={17} /> No-Fly Zones</h3>
        <div className="zone-grid">
          {overview.noFlyZones.map((zone) => (
            <div className="zone" key={zone.id}>
              <strong>{zone.name}</strong>
              <span>{zone.radiusKm} km protected radius</span>
              <p>{zone.reason}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}

function TrackingView({ overview, onRefresh }: Pick<Props, 'overview' | 'onRefresh'>) {
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
      <ViewHeader title="Customer Tracking Portal" text="Public delivery visibility, timeline and proof of delivery." icon={<MapPinned />} />
      <div className="tracking-picker">
        <select value={missionId} onChange={(event) => setMissionId(event.target.value)}>
          {overview.missions.map((mission) => <option key={mission.id} value={mission.id}>{mission.id} - {mission.customer}</option>)}
        </select>
        <button className="action" onClick={() => window.print()}><Printer size={15} /> Mission Report</button>
      </div>
      {result && (
        <div className="tracking-grid">
          <article className="panel delivery-card">
            <div className="delivery-code">{result.publicCode}</div>
            <h2>{result.mission.origin.label} to {result.mission.destination.label}</h2>
            <p>{result.mission.status === 'delivered' ? 'Delivered successfully' : `ETA ${result.estimatedArrivalMinutes} minutes`}</p>
            <div className="progress"><span style={{ width: `${result.mission.progressPercent}%` }} /></div>
            <strong>{result.mission.progressPercent}% complete</strong>
            {result.drone && <p>Drone: {result.drone.id} | Battery: {result.drone.battery}%</p>}
            {result.mission.status === 'assigned' || result.mission.status === 'in-transit' ? (
              <button className="primary demo-button" onClick={() => action.mutate(() => simulateMissionStep(result.mission.id))}>
                Run Live Demo Step
              </button>
            ) : null}
            {result.mission.status === 'in-transit' && (
              <div className="proof">
                <input value={confirmationCode} onChange={(event) => setConfirmationCode(event.target.value)} placeholder="Recipient OTP" />
                <button className="action" onClick={() => action.mutate(() => confirmDelivery(result.mission.id, confirmationCode))}>
                  Confirm Delivery
                </button>
                {result.demoConfirmationCode && <small>Demo OTP: {result.demoConfirmationCode}</small>}
              </div>
            )}
          </article>
          <article className="panel">
            <h3 className="section-heading"><ClipboardList size={17} /> Mission Timeline</h3>
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
  const service = useMutation({
    mutationFn: completeDroneService,
    onSuccess: () => onRefresh(),
  })
  return (
    <section className="advanced">
      <ViewHeader title="Fleet Maintenance" text="Battery health, flight hours and preventive service control." icon={<Stethoscope />} />
      <div className="data-table">
        <table>
          <thead><tr><th>Drone</th><th>Battery health</th><th>Flight hours</th><th>Deliveries</th><th>Next service</th><th>Action</th></tr></thead>
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
                  <td><button className="action" disabled={drone.status === 'mission' || service.isPending} onClick={() => service.mutate(drone.id)}>Complete Service</button></td>
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
  const events = useMemo(() => overview.auditEvents, [overview.auditEvents])
  return (
    <section className="advanced">
      <ViewHeader title="Audit Log" text="Traceability for operational actions and compliance reviews." icon={<ClipboardList />} />
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
