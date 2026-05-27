import { type ButtonHTMLAttributes, type FormEvent, type ReactNode, useState } from 'react'
import { BatteryCharging, PackageCheck, PlaneTakeoff, Plus, Trash2, Truck } from 'lucide-react'
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

function DronesView({ overview, busy, run }: ViewProps) {
  const [draft, setDraft] = useState({
    id: '',
    model: '',
    battery: 100,
    maxPayloadKg: 5,
    location: emptyLocation,
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    void run('create-drone', () => createDrone(draft), 'Drone added to the fleet successfully.')
  }

  return (
    <>
      <ManagementHeader title="Fleet Management" text="Add drones, update specifications and manage charging cycles." />
      <EntityForm title="Add Drone" onSubmit={submit} busy={busy === 'create-drone'}>
        <input required placeholder="Drone ID" value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} />
        <input required placeholder="Model" value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} />
        <input required type="number" min="0" max="100" placeholder="Battery %" value={draft.battery} onChange={(event) => setDraft({ ...draft, battery: Number(event.target.value) })} />
        <input required type="number" min="0.1" step="0.1" placeholder="Payload kg" value={draft.maxPayloadKg} onChange={(event) => setDraft({ ...draft, maxPayloadKg: Number(event.target.value) })} />
        <LocationInputs location={draft.location} onChange={(location) => setDraft({ ...draft, location })} />
      </EntityForm>
      <DataTable columns={['Drone', 'Status', 'Battery', 'Payload', 'Position', 'Actions']}>
        {overview.drones.map((drone) => (
          <tr key={drone.id}>
            <td><strong>{drone.id}</strong><small>{drone.model}</small></td>
            <td><Status value={drone.status} /></td>
            <td>{drone.battery}%</td>
            <td>{drone.maxPayloadKg} kg</td>
            <td>{drone.location.label}</td>
            <td className="actions">
              <ActionButton onClick={() => editDrone(drone, run)} disabled={Boolean(busy)}>Edit</ActionButton>
              {drone.status === 'available' && overview.stations.length > 0 && (
                <ActionButton
                  onClick={() => void run(`charge-${drone.id}`, () => chargeDrone(drone.id, overview.stations[0].id), 'Drone sent to charging station.')}
                  disabled={Boolean(busy)}
                >
                  <BatteryCharging size={14} /> Charge
                </ActionButton>
              )}
              {drone.status === 'charging' && (
                <ActionButton
                  onClick={() => void run(`release-${drone.id}`, () => releaseCharge(drone.id, 20), 'Drone released from charging.')}
                  disabled={Boolean(busy)}
                >
                  Release
                </ActionButton>
              )}
              {drone.status === 'mission' && (
                <DangerButton
                  onClick={() => void run(`return-${drone.id}`, () => emergencyReturnHome(drone.id), 'Emergency return initiated. Mission returned to queue.')}
                  disabled={Boolean(busy)}
                >
                  Return Home
                </DangerButton>
              )}
              <DangerButton onClick={() => void run(`delete-${drone.id}`, () => deleteDrone(drone.id), 'Drone removed.')} disabled={Boolean(busy)}>
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
  const [draft, setDraft] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    location: emptyLocation,
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    void run('create-customer', () => createCustomer(draft), 'Customer added successfully.')
  }

  return (
    <>
      <ManagementHeader title="Customer Center" text="Manage senders and recipients used in delivery orders." />
      <EntityForm title="Add Customer" onSubmit={submit} busy={busy === 'create-customer'}>
        <input required placeholder="Customer ID" value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} />
        <input required placeholder="Full name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <input required placeholder="Phone" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
        <input required type="email" placeholder="Email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
        <LocationInputs location={draft.location} onChange={(location) => setDraft({ ...draft, location })} />
      </EntityForm>
      <DataTable columns={['Customer', 'Phone', 'Email', 'Address', 'Actions']}>
        {overview.customers.map((customer) => (
          <tr key={customer.id}>
            <td><strong>{customer.name}</strong><small>{customer.id}</small></td>
            <td>{customer.phone}</td>
            <td>{customer.email}</td>
            <td>{customer.location.label}</td>
            <td className="actions">
              <ActionButton onClick={() => editCustomer(customer, run)} disabled={Boolean(busy)}>Edit</ActionButton>
              <DangerButton onClick={() => void run(`delete-${customer.id}`, () => deleteCustomer(customer.id), 'Customer removed.')} disabled={Boolean(busy)}>
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
  const [draft, setDraft] = useState({
    id: '',
    name: '',
    totalSlots: 4,
    location: emptyLocation,
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    void run('create-station', () => createStation(draft), 'Charging station added.')
  }

  return (
    <>
      <ManagementHeader title="Charging Stations" text="Control charging capacity and fleet service points." />
      <EntityForm title="Add Station" onSubmit={submit} busy={busy === 'create-station'}>
        <input required placeholder="Station ID" value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} />
        <input required placeholder="Station name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <input required type="number" min="1" placeholder="Total slots" value={draft.totalSlots} onChange={(event) => setDraft({ ...draft, totalSlots: Number(event.target.value) })} />
        <LocationInputs location={draft.location} onChange={(location) => setDraft({ ...draft, location })} />
      </EntityForm>
      <DataTable columns={['Station', 'Slots', 'Location', 'Availability', 'Actions']}>
        {overview.stations.map((station) => (
          <tr key={station.id}>
            <td><strong>{station.name}</strong><small>{station.id}</small></td>
            <td>{station.occupiedSlots}/{station.totalSlots}</td>
            <td>{station.location.label}</td>
            <td>{station.totalSlots - station.occupiedSlots} ready</td>
            <td className="actions">
              <ActionButton onClick={() => editStation(station, run)} disabled={Boolean(busy)}>Edit</ActionButton>
              <DangerButton onClick={() => void run(`delete-${station.id}`, () => deleteStation(station.id), 'Charging station removed.')} disabled={Boolean(busy)}>
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
    void run('create-mission', () => createMission(draft), 'New delivery created.')
  }

  return (
    <>
      <ManagementHeader title="Delivery Operations" text="Create orders and operate the full assign, pickup and delivery lifecycle." />
      <EntityForm title="Add Delivery" onSubmit={submit} busy={busy === 'create-mission'}>
        <input required placeholder="Mission ID" value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} />
        <select required value={draft.senderCustomerId} onChange={(event) => setDraft({ ...draft, senderCustomerId: event.target.value })}>
          <option value="">Sender customer</option>
          {overview.customers.map((customer) => <option value={customer.id} key={customer.id}>From: {customer.name}</option>)}
        </select>
        <select required value={draft.targetCustomerId} onChange={(event) => setDraft({ ...draft, targetCustomerId: event.target.value })}>
          <option value="">Recipient customer</option>
          {overview.customers.map((customer) => <option value={customer.id} key={customer.id}>To: {customer.name}</option>)}
        </select>
        <input required type="number" min="0.1" step="0.1" value={draft.payloadKg} onChange={(event) => setDraft({ ...draft, payloadKg: Number(event.target.value) })} />
        <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as typeof draft.priority })}>
          <option value="standard">Standard</option>
          <option value="urgent">Urgent</option>
          <option value="critical">Critical</option>
        </select>
        <input required type="number" min="1" value={draft.etaMinutes} onChange={(event) => setDraft({ ...draft, etaMinutes: Number(event.target.value) })} />
      </EntityForm>
      <div className="dispatch-control">
        <PlaneTakeoff size={17} />
        Weather-approved dispatch drone
        <select value={selectedDroneId} onChange={(event) => setSelectedDroneId(event.target.value)}>
          {available.map((drone) => <option key={drone.id} value={drone.id}>{drone.id} ({drone.battery}%)</option>)}
        </select>
      </div>
      <DataTable columns={['Delivery', 'Route', 'Load', 'Drone', 'Status', 'Actions']}>
        {overview.missions.map((mission) => (
          <tr key={mission.id}>
            <td><strong>{mission.id}</strong><small>{mission.customer}</small></td>
            <td>{mission.origin.label} to {mission.destination.label}</td>
            <td>{mission.payloadKg} kg <Status value={mission.priority} /></td>
            <td>{mission.droneId ?? '-'}</td>
            <td><Status value={mission.status} /></td>
            <td className="actions">
              {mission.status === 'pending' && (
                <ActionButton
                  disabled={!selectedDroneId || Boolean(busy)}
                  onClick={() => void run(`dispatch-${mission.id}`, () => dispatchMission(selectedDroneId, mission.id), 'Weather check passed and drone dispatched.')}
                >
                  <PlaneTakeoff size={14} /> Dispatch
                </ActionButton>
              )}
              {mission.status === 'assigned' && (
                <ActionButton onClick={() => void run(`pickup-${mission.id}`, () => pickupMission(mission.id), 'Package collected from sender.')} disabled={Boolean(busy)}>
                  <Truck size={14} /> Pickup
                </ActionButton>
              )}
              {mission.status === 'in-transit' && (
                <ActionButton onClick={() => void run(`deliver-${mission.id}`, () => deliverMission(mission.id), 'Package delivered to customer.')} disabled={Boolean(busy)}>
                  <PackageCheck size={14} /> Deliver
                </ActionButton>
              )}
              {(mission.status === 'pending' || mission.status === 'delivered') && (
                <DangerButton onClick={() => void run(`delete-${mission.id}`, () => deleteMission(mission.id), 'Delivery removed.')} disabled={Boolean(busy)}>
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

function EntityForm({ title, busy, children, onSubmit }: { title: string; busy: boolean; children: ReactNode; onSubmit: (event: FormEvent) => void }) {
  return <form className="entity-form" onSubmit={onSubmit}><h3>{title}</h3><div className="form-grid">{children}<button className="primary" disabled={busy}><Plus size={16} />{busy ? 'Saving...' : 'Add'}</button></div></form>
}

function LocationInputs({ location, onChange }: { location: Location; onChange: (location: Location) => void }) {
  return (
    <>
      <input required placeholder="Location label" value={location.label} onChange={(event) => onChange({ ...location, label: event.target.value })} />
      <input required type="number" step="any" placeholder="Latitude" value={location.latitude} onChange={(event) => onChange({ ...location, latitude: Number(event.target.value) })} />
      <input required type="number" step="any" placeholder="Longitude" value={location.longitude} onChange={(event) => onChange({ ...location, longitude: Number(event.target.value) })} />
    </>
  )
}

function DataTable({ columns, children }: { columns: string[]; children: ReactNode }) {
  return <div className="data-table"><table><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
}

function Status({ value }: { value: string }) {
  return <span className={`pill ${value}`}>{value}</span>
}

function ActionButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className="action" {...props}>{children}</button>
}

function DangerButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className="action danger" {...props}>{children}</button>
}

function editDrone(drone: Drone, run: ViewProps['run']) {
  const model = window.prompt('Drone model', drone.model)
  if (!model) return
  void run(`edit-${drone.id}`, () => updateDrone(drone.id, { model }), 'Drone updated.')
}

function editCustomer(customer: Customer, run: ViewProps['run']) {
  const phone = window.prompt('Customer phone', customer.phone)
  if (!phone) return
  void run(`edit-${customer.id}`, () => updateCustomer(customer.id, { phone }), 'Customer updated.')
}

function editStation(station: Station, run: ViewProps['run']) {
  const slots = window.prompt('Total charging slots', station.totalSlots.toString())
  if (!slots) return
  void run(`edit-${station.id}`, () => updateStation(station.id, { totalSlots: Number(slots) }), 'Station updated.')
}

function getErrorMessage(reason: unknown) {
  if (typeof reason === 'object' && reason && 'response' in reason) {
    const response = reason.response as { data?: { message?: string | string[] } }
    const message = response.data?.message
    return Array.isArray(message) ? message.join(', ') : message ?? 'Operation failed.'
  }
  return 'Operation failed. Please try again.'
}
