import { type ButtonHTMLAttributes, type FormEvent, type ReactNode, useState } from 'react'
import { BatteryCharging, MapPinned, PackageCheck, PlaneTakeoff, Plus, RadioTower, Trash2, Truck, Users } from 'lucide-react'
import {
  chargeDrone,
  createCustomer,
  createDrone,
  createMission,
  createStation,
  deleteCustomer,
  deleteDrone,
  deleteMission,
  deleteStation,
  deliverMission,
  dispatchMission,
  emergencyReturnHome,
  pickupMission,
  releaseCharge,
  updateCustomer,
  updateDrone,
  updateStation,
} from './api'
import { useI18n } from './i18n'
import type { Customer, Drone, Location, Overview, Station } from './types'

export type View = 'dashboard' | 'drones' | 'customers' | 'stations' | 'missions'

type Props = {
  view: Exclude<View, 'dashboard'>
  overview: Overview
  onRefresh: () => Promise<unknown> | unknown
}

const emptyLocation: Location = { latitude: 32.075, longitude: 34.79, label: '' }

export function ManagementViews({ view, overview, onRefresh }: Props) {
  const [notice, setNotice] = useState<string>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState<string>()

  async function run(key: string, action: () => Promise<unknown>, success: string) {
    setBusy(key)
    setError(undefined)
    try {
      await action()
      setNotice(success)
      await onRefresh()
    } catch (reason) {
      setNotice(undefined)
      setError(getErrorMessage(reason))
    } finally {
      setBusy(undefined)
    }
  }

  return (
    <section className="management">
      {(notice || error) && <p className={`feedback ${error ? 'failure' : 'success'}`}>{error ?? notice}</p>}
      {view === 'drones' && <DronesView overview={overview} busy={busy} run={run} />}
      {view === 'customers' && <CustomersView overview={overview} busy={busy} run={run} />}
      {view === 'stations' && <StationsView overview={overview} busy={busy} run={run} />}
      {view === 'missions' && <MissionsView overview={overview} busy={busy} run={run} />}
    </section>
  )
}

type ViewProps = Pick<Props, 'overview'> & {
  busy?: string
  run: (key: string, action: () => Promise<unknown>, success: string) => Promise<void>
}
type Translate = (key: string, params?: Record<string, string | number>) => string

function DronesView({ overview, busy, run }: ViewProps) {
  const { t } = useI18n()
  const [draft, setDraft] = useState({
    id: '',
    model: '',
    battery: 100,
    maxPayloadKg: 5,
    location: emptyLocation,
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    void run('create-drone', () => createDrone(draft), t('management.droneAdded'))
  }

  return (
    <>
      <ManagementHeader title={t('management.fleetTitle')} text={t('management.fleetText')} />
      <ManagementSummary>
        <SummaryCard icon={<PlaneTakeoff />} label={t('metrics.totalDrones')} value={overview.drones.length} text={t('metrics.registeredFleet')} />
        <SummaryCard icon={<BatteryCharging />} label={t('metrics.readyNow')} value={overview.drones.filter((drone) => drone.status === 'available').length} text={t('dashboard.operationalAvailability')} />
        <SummaryCard icon={<RadioTower />} label={t('metrics.charging')} value={overview.drones.filter((drone) => drone.status === 'charging').length} text={t('metrics.atStations')} />
      </ManagementSummary>
      <EntityForm title={t('management.addDrone')} onSubmit={submit} busy={busy === 'create-drone'}>
        <input required placeholder={t('management.droneId')} value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} />
        <input required placeholder={t('management.model')} value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} />
        <input required type="number" min="0" max="100" placeholder={t('management.batteryPercent')} value={draft.battery} onChange={(event) => setDraft({ ...draft, battery: Number(event.target.value) })} />
        <input required type="number" min="0.1" step="0.1" placeholder={t('management.payloadKg')} value={draft.maxPayloadKg} onChange={(event) => setDraft({ ...draft, maxPayloadKg: Number(event.target.value) })} />
        <LocationInputs location={draft.location} onChange={(location) => setDraft({ ...draft, location })} />
      </EntityForm>
      <DataTable columns={[t('management.drone'), t('management.status'), t('management.battery'), t('management.payload'), t('management.position'), t('management.actions')]}>
        {overview.drones.map((drone) => (
          <tr key={drone.id}>
            <td><strong>{drone.id}</strong><small>{drone.model}</small></td>
            <td><Status value={drone.status} /></td>
            <td>{drone.battery}%</td>
            <td>{drone.maxPayloadKg} kg</td>
            <td>{drone.location.label}</td>
            <td className="actions">
              <ActionButton onClick={() => editDrone(drone, run, t)} disabled={Boolean(busy)}>{t('management.edit')}</ActionButton>
              {drone.status === 'available' && overview.stations.length > 0 && (
                <ActionButton
                  onClick={() => void run(`charge-${drone.id}`, () => chargeDrone(drone.id, overview.stations[0].id), t('management.droneCharging'))}
                  disabled={Boolean(busy)}
                >
                  <BatteryCharging size={14} /> {t('management.charge')}
                </ActionButton>
              )}
              {drone.status === 'charging' && (
                <ActionButton
                  onClick={() => void run(`release-${drone.id}`, () => releaseCharge(drone.id, 20), t('management.droneReleased'))}
                  disabled={Boolean(busy)}
                >
                  {t('management.release')}
                </ActionButton>
              )}
              {drone.status === 'mission' && (
                <DangerButton
                  onClick={() => void run(`return-${drone.id}`, () => emergencyReturnHome(drone.id), t('management.returnInitiated'))}
                  disabled={Boolean(busy)}
                >
                  {t('management.returnHome')}
                </DangerButton>
              )}
              <DangerButton onClick={() => void run(`delete-${drone.id}`, () => deleteDrone(drone.id), t('management.droneRemoved'))} disabled={Boolean(busy)}>
                <Trash2 size={14} />
              </DangerButton>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

function CustomersView({ overview, busy, run }: ViewProps) {
  const { t } = useI18n()
  const [draft, setDraft] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    location: emptyLocation,
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    void run('create-customer', () => createCustomer(draft), t('management.customerAdded'))
  }

  return (
    <>
      <ManagementHeader title={t('management.customerTitle')} text={t('management.customerText')} />
      <ManagementSummary>
        <SummaryCard icon={<Users />} label={t('nav.customers')} value={overview.customers.length} text={t('management.customerText')} />
        <SummaryCard icon={<MapPinned />} label={t('management.location')} value={overview.customers.filter((customer) => customer.location.label).length} text={t('management.address')} />
        <SummaryCard icon={<PackageCheck />} label={t('advanced.delivered')} value={overview.analytics.deliveredMissions} text={t('dashboard.deliveredToday')} />
      </ManagementSummary>
      <EntityForm title={t('management.addCustomer')} onSubmit={submit} busy={busy === 'create-customer'}>
        <input required placeholder={t('management.customerId')} value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} />
        <input required placeholder={t('management.fullName')} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <input required placeholder={t('management.phone')} value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
        <input required type="email" placeholder={t('management.email')} value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
        <LocationInputs location={draft.location} onChange={(location) => setDraft({ ...draft, location })} />
      </EntityForm>
      <DataTable columns={[t('management.customer'), t('management.phone'), t('management.email'), t('management.address'), t('management.actions')]}>
        {overview.customers.map((customer) => (
          <tr key={customer.id}>
            <td><strong>{customer.name}</strong><small>{customer.id}</small></td>
            <td>{customer.phone}</td>
            <td>{customer.email}</td>
            <td>{customer.location.label}</td>
            <td className="actions">
              <ActionButton onClick={() => editCustomer(customer, run, t)} disabled={Boolean(busy)}>{t('management.edit')}</ActionButton>
              <DangerButton onClick={() => void run(`delete-${customer.id}`, () => deleteCustomer(customer.id), t('management.customerRemoved'))} disabled={Boolean(busy)}>
                <Trash2 size={14} />
              </DangerButton>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

function StationsView({ overview, busy, run }: ViewProps) {
  const { t } = useI18n()
  const [draft, setDraft] = useState({
    id: '',
    name: '',
    totalSlots: 4,
    location: emptyLocation,
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    void run('create-station', () => createStation(draft), t('management.stationAdded'))
  }

  return (
    <>
      <ManagementHeader title={t('management.stationTitle')} text={t('management.stationText')} />
      <ManagementSummary>
        <SummaryCard icon={<RadioTower />} label={t('nav.stations')} value={overview.stations.length} text={t('management.stationText')} />
        <SummaryCard icon={<BatteryCharging />} label={t('management.slots')} value={overview.stations.reduce((sum, station) => sum + station.totalSlots, 0)} text={t('management.totalSlots')} />
        <SummaryCard icon={<PlaneTakeoff />} label={t('management.availability')} value={overview.stations.reduce((sum, station) => sum + station.totalSlots - station.occupiedSlots, 0)} text={t('metrics.readyNow')} />
      </ManagementSummary>
      <EntityForm title={t('management.addStation')} onSubmit={submit} busy={busy === 'create-station'}>
        <input required placeholder={t('management.stationId')} value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} />
        <input required placeholder={t('management.stationName')} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <input required type="number" min="1" placeholder={t('management.totalSlots')} value={draft.totalSlots} onChange={(event) => setDraft({ ...draft, totalSlots: Number(event.target.value) })} />
        <LocationInputs location={draft.location} onChange={(location) => setDraft({ ...draft, location })} />
      </EntityForm>
      <DataTable columns={[t('management.station'), t('management.slots'), t('management.location'), t('management.availability'), t('management.actions')]}>
        {overview.stations.map((station) => (
          <tr key={station.id}>
            <td><strong>{station.name}</strong><small>{station.id}</small></td>
            <td>{station.occupiedSlots}/{station.totalSlots}</td>
            <td>{station.location.label}</td>
            <td>{t('management.readyCount', { value: station.totalSlots - station.occupiedSlots })}</td>
            <td className="actions">
              <ActionButton onClick={() => editStation(station, run, t)} disabled={Boolean(busy)}>{t('management.edit')}</ActionButton>
              <DangerButton onClick={() => void run(`delete-${station.id}`, () => deleteStation(station.id), t('management.stationRemoved'))} disabled={Boolean(busy)}>
                <Trash2 size={14} />
              </DangerButton>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

function MissionsView({ overview, busy, run }: ViewProps) {
  const { t } = useI18n()
  const available = overview.drones.filter((drone) => drone.status === 'available')
  const [selectedDroneId, setSelectedDroneId] = useState(available[0]?.id ?? '')
  const [draft, setDraft] = useState({
    id: '',
    senderCustomerId: overview.customers[0]?.id ?? '',
    targetCustomerId: overview.customers[1]?.id ?? overview.customers[0]?.id ?? '',
    payloadKg: 1,
    priority: 'standard' as 'standard' | 'urgent' | 'critical',
    etaMinutes: 20,
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    void run('create-mission', () => createMission(draft), t('management.deliveryCreated'))
  }

  return (
    <>
      <ManagementHeader title={t('management.deliveryTitle')} text={t('management.deliveryText')} />
      <ManagementSummary>
        <SummaryCard icon={<PackageCheck />} label={t('nav.missions')} value={overview.missions.length} text={t('management.deliveryText')} />
        <SummaryCard icon={<PlaneTakeoff />} label={t('metrics.activeMissions')} value={overview.metrics.activeMissions} text={t('metrics.inProgress')} />
        <SummaryCard icon={<BatteryCharging />} label={t('dashboard.batteryReadiness')} value={`${overview.metrics.averageBattery}%`} text={t('metrics.avgBattery', { value: overview.metrics.averageBattery })} />
      </ManagementSummary>
      <EntityForm title={t('management.addDelivery')} onSubmit={submit} busy={busy === 'create-mission'}>
        <input required placeholder={t('management.missionId')} value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} />
        <select required value={draft.senderCustomerId} onChange={(event) => setDraft({ ...draft, senderCustomerId: event.target.value })}>
          <option value="">{t('management.senderCustomer')}</option>
          {overview.customers.map((customer) => <option value={customer.id} key={customer.id}>{t('management.fromCustomer', { value: customer.name })}</option>)}
        </select>
        <select required value={draft.targetCustomerId} onChange={(event) => setDraft({ ...draft, targetCustomerId: event.target.value })}>
          <option value="">{t('management.recipientCustomer')}</option>
          {overview.customers.map((customer) => <option value={customer.id} key={customer.id}>{t('management.toCustomer', { value: customer.name })}</option>)}
        </select>
        <input required type="number" min="0.1" step="0.1" value={draft.payloadKg} onChange={(event) => setDraft({ ...draft, payloadKg: Number(event.target.value) })} />
        <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as typeof draft.priority })}>
          <option value="standard">{t('status.standard')}</option>
          <option value="urgent">{t('status.urgent')}</option>
          <option value="critical">{t('status.critical')}</option>
        </select>
        <input required type="number" min="1" value={draft.etaMinutes} onChange={(event) => setDraft({ ...draft, etaMinutes: Number(event.target.value) })} />
      </EntityForm>
      <div className="dispatch-control">
        <PlaneTakeoff size={17} />
        {t('management.weatherDispatch')}
        <select value={selectedDroneId} onChange={(event) => setSelectedDroneId(event.target.value)}>
          {available.map((drone) => <option key={drone.id} value={drone.id}>{drone.id} ({drone.battery}%)</option>)}
        </select>
      </div>
      <DataTable columns={[t('management.delivery'), t('management.route'), t('management.load'), t('management.drone'), t('management.status'), t('management.actions')]}>
        {overview.missions.map((mission) => (
          <tr key={mission.id}>
            <td><strong>{mission.id}</strong><small>{mission.customer}</small></td>
            <td>{mission.origin.label} {t('common.to')} {mission.destination.label}</td>
            <td>{mission.payloadKg} kg <Status value={mission.priority} /></td>
            <td>{mission.droneId ?? '-'}</td>
            <td><Status value={mission.status} /></td>
            <td className="actions">
              {mission.status === 'pending' && (
                <ActionButton
                  disabled={!selectedDroneId || Boolean(busy)}
                  onClick={() => void run(`dispatch-${mission.id}`, () => dispatchMission(selectedDroneId, mission.id), t('management.dispatched'))}
                >
                  <PlaneTakeoff size={14} /> {t('management.dispatch')}
                </ActionButton>
              )}
              {mission.status === 'assigned' && (
                <ActionButton onClick={() => void run(`pickup-${mission.id}`, () => pickupMission(mission.id), t('management.pickedUp'))} disabled={Boolean(busy)}>
                  <Truck size={14} /> {t('management.pickup')}
                </ActionButton>
              )}
              {mission.status === 'in-transit' && (
                <ActionButton onClick={() => void run(`deliver-${mission.id}`, () => deliverMission(mission.id), t('management.delivered'))} disabled={Boolean(busy)}>
                  <PackageCheck size={14} /> {t('management.deliver')}
                </ActionButton>
              )}
              {(mission.status === 'pending' || mission.status === 'delivered') && (
                <DangerButton onClick={() => void run(`delete-${mission.id}`, () => deleteMission(mission.id), t('management.deliveryRemoved'))} disabled={Boolean(busy)}>
                  <Trash2 size={14} />
                </DangerButton>
              )}
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

function ManagementHeader({ title, text }: { title: string; text: string }) {
  return <div className="management-header"><div><h2>{title}</h2><p>{text}</p></div></div>
}

function ManagementSummary({ children }: { children: ReactNode }) {
  return <div className="management-summary">{children}</div>
}

function SummaryCard({ icon, label, value, text }: { icon: ReactNode; label: string; value: string | number; text: string }) {
  return <article className="summary-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{text}</p></div></article>
}

function EntityForm({ title, busy, children, onSubmit }: { title: string; busy: boolean; children: ReactNode; onSubmit: (event: FormEvent) => void }) {
  const { t } = useI18n()
  return <form className="entity-form" onSubmit={onSubmit}><h3>{title}</h3><div className="form-grid">{children}<button className="primary" disabled={busy}><Plus size={16} />{busy ? t('management.saving') : t('management.add')}</button></div></form>
}

function LocationInputs({ location, onChange }: { location: Location; onChange: (location: Location) => void }) {
  const { t } = useI18n()
  return (
    <>
      <input required placeholder={t('management.locationLabel')} value={location.label} onChange={(event) => onChange({ ...location, label: event.target.value })} />
      <input required type="number" step="any" placeholder={t('management.latitude')} value={location.latitude} onChange={(event) => onChange({ ...location, latitude: Number(event.target.value) })} />
      <input required type="number" step="any" placeholder={t('management.longitude')} value={location.longitude} onChange={(event) => onChange({ ...location, longitude: Number(event.target.value) })} />
    </>
  )
}

function DataTable({ columns, children }: { columns: string[]; children: ReactNode }) {
  return <div className="data-table"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
}

function Status({ value }: { value: string }) {
  const { t } = useI18n()
  return <span className={`pill ${value}`}>{t(`status.${value}`)}</span>
}

function ActionButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className="action" {...props}>{children}</button>
}

function DangerButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className="action danger" {...props}>{children}</button>
}

function editDrone(drone: Drone, run: ViewProps['run'], t: Translate) {
  const model = window.prompt(t('management.model'), drone.model)
  if (!model) return
  void run(`edit-${drone.id}`, () => updateDrone(drone.id, { model }), t('management.droneUpdated'))
}

function editCustomer(customer: Customer, run: ViewProps['run'], t: Translate) {
  const phone = window.prompt(t('management.phone'), customer.phone)
  if (!phone) return
  void run(`edit-${customer.id}`, () => updateCustomer(customer.id, { phone }), t('management.customerUpdated'))
}

function editStation(station: Station, run: ViewProps['run'], t: Translate) {
  const slots = window.prompt(t('management.totalSlots'), station.totalSlots.toString())
  if (!slots) return
  void run(`edit-${station.id}`, () => updateStation(station.id, { totalSlots: Number(slots) }), t('management.stationUpdated'))
}

function getErrorMessage(reason: unknown) {
  if (typeof reason === 'object' && reason && 'response' in reason) {
    const response = reason.response as { data?: { message?: string | string[] } }
    const message = response.data?.message
    return Array.isArray(message) ? message.join(', ') : message ?? 'Operation failed.'
  }
  return 'Operation failed. Please try again.'
}
