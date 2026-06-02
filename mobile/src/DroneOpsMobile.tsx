import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import {
  advanceTelemetry,
  assessFlight,
  chargeDrone,
  completeDroneService,
  confirmDelivery,
  createCustomer,
  createDrone,
  createMission,
  createNoFlyZone,
  createPublicOrder,
  createStation,
  deleteCustomer,
  deleteDrone,
  deleteMission,
  deleteNoFlyZone,
  deleteStation,
  dispatchMission,
  emergencyReturnHome,
  getForecast,
  getOverview,
  getRecommendations,
  getTracking,
  pickupMission,
  quoteOrder,
  releaseCharge,
  simulateMissionStep,
} from './api'
import type { CustomerInput, DroneInput, MissionInput, NoFlyZoneInput, Overview, PublicOrderInput, StationInput } from './types'

type Screen = 'dashboard' | 'book' | 'fleet' | 'missions' | 'customers' | 'stations' | 'intel' | 'track' | 'maintenance' | 'audit'
type LandingZone = 'Back yard' | 'Roof' | 'Entrance' | 'Balcony'

const initialOrder: PublicOrderInput = {
  senderName: 'Emergency Lab',
  senderEmail: 'lab@example.com',
  senderPhone: '050-1111111',
  recipientName: 'North Clinic',
  recipientEmail: 'desk@clinic.example',
  recipientPhone: '050-2222222',
  origin: { latitude: 32.07, longitude: 34.78, label: 'Central Medical Lab' },
  destination: { latitude: 32.091, longitude: 34.812, label: 'North Clinic' },
  payloadKg: 1.2,
  priority: 'critical',
  serviceType: 'medical',
  temperatureControlled: true,
}

const screens: { id: Screen; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'book', label: 'Book' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'missions', label: 'Missions' },
  { id: 'customers', label: 'Customers' },
  { id: 'stations', label: 'Stations' },
  { id: 'intel', label: 'Intel' },
  { id: 'track', label: 'Track' },
  { id: 'maintenance', label: 'Service' },
  { id: 'audit', label: 'Audit' },
]

export function DroneOpsMobile() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [trackingCode, setTrackingCode] = useState('TRACK-MS207')
  const overview = useQuery({ queryKey: ['mobile-overview'], queryFn: getOverview, refetchInterval: 8000 })

  const refresh = () => overview.refetch()

  return (
    <LinearGradient colors={['#061122', '#081a2e', '#061122']} style={styles.app}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoMark} />
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>DRONEOPS NEXUS</Text>
            <Text style={styles.title}>Mobile Command</Text>
            <Text style={styles.muted}>All core web features, shaped for Android operations.</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nav}>
          {screens.map((item) => (
            <Tab key={item.id} active={screen === item.id} label={item.label} onPress={() => setScreen(item.id)} />
          ))}
        </ScrollView>

        {overview.isLoading && <LoadingCard text="Connecting to live fleet..." />}
        {overview.isError && <EmptyCard text="Could not load fleet data." />}
        {overview.data && (
          <View style={styles.stack}>
            {screen === 'dashboard' && <Dashboard overview={overview.data} onRefresh={refresh} />}
            {screen === 'book' && <BookingScreen onTrack={(code) => { setTrackingCode(code); setScreen('track') }} />}
            {screen === 'fleet' && <FleetScreen overview={overview.data} onRefresh={refresh} />}
            {screen === 'missions' && <MissionsScreen overview={overview.data} onRefresh={refresh} onTrack={(id) => { setTrackingCode(id); setScreen('track') }} />}
            {screen === 'customers' && <CustomersScreen overview={overview.data} onRefresh={refresh} />}
            {screen === 'stations' && <StationsScreen overview={overview.data} onRefresh={refresh} />}
            {screen === 'intel' && <IntelligenceScreen overview={overview.data} onRefresh={refresh} />}
            {screen === 'track' && <TrackingScreen trackingCode={trackingCode} setTrackingCode={setTrackingCode} onRefresh={refresh} />}
            {screen === 'maintenance' && <MaintenanceScreen overview={overview.data} onRefresh={refresh} />}
            {screen === 'audit' && <AuditScreen overview={overview.data} />}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  )
}

function Dashboard({ overview, onRefresh }: { overview: Overview; onRefresh: () => void }) {
  const ready = overview.drones.filter((drone) => drone.status === 'available').length
  const airborne = overview.drones.filter((drone) => drone.status === 'mission').length

  return (
    <>
      <View style={styles.heroCard}>
        <Text style={styles.heroKicker}>Live operations platform</Text>
        <Text style={styles.heroTitle}>Command center in your pocket.</Text>
        <Text style={styles.heroText}>Fleet health, dispatch risk, charging capacity, alerts and customer delivery flow from one Android-ready dashboard.</Text>
        <Pressable style={styles.smallButton} onPress={onRefresh}><Text style={styles.smallButtonText}>Refresh live data</Text></Pressable>
      </View>
      <View style={styles.metricGrid}>
        <Metric label="Total drones" value={overview.metrics.totalDrones} />
        <Metric label="Active missions" value={overview.metrics.activeMissions} />
        <Metric label="Ready now" value={ready} />
        <Metric label="Airborne" value={airborne} />
        <Metric label="Avg battery" value={`${overview.metrics.averageBattery}%`} />
        <Metric label="Revenue pending" value={`₪${overview.analytics.pendingRevenueIls}`} />
      </View>
      <View style={styles.card}>
        <SectionTitle title="Fleet Health" text="Battery, service and operational readiness" />
        {overview.drones.slice(0, 5).map((drone) => <DroneCard key={drone.id} drone={drone} />)}
      </View>
      <View style={styles.card}>
        <SectionTitle title="Alerts & Notifications" text="Operational warnings and outbound channels" />
        {overview.alerts.slice(0, 4).map((alert) => (
          <InfoRow key={alert.id} title={alert.title} text={alert.message} badge={alert.severity.toUpperCase()} danger={alert.severity === 'critical'} />
        ))}
        {overview.notifications.slice(0, 3).map((notice) => (
          <InfoRow key={notice.id} title={notice.title} text={`${notice.channel} · ${notice.deliveryState}`} badge="Notify" />
        ))}
      </View>
      <View style={styles.card}>
        <SectionTitle title="Payload & Battery Analytics" text="Smart delivery readiness KPIs" />
        <View style={styles.metricGrid}>
          <Metric label="Utilization" value={`${overview.analytics.fleetUtilizationPercent}%`} />
          <Metric label="Charging load" value={`${overview.analytics.chargingCapacityPercent}%`} />
          <Metric label="Avg payload" value={`${overview.analytics.averagePayloadKg}kg`} />
          <Metric label="Avg route" value={`${overview.analytics.averageRouteKm}km`} />
        </View>
      </View>
    </>
  )
}

function BookingScreen({ onTrack }: { onTrack: (code: string) => void }) {
  const [order, setOrder] = useState<PublicOrderInput>(initialOrder)
  const [landingZone, setLandingZone] = useState<LandingZone>('Back yard')
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Bit' | 'PayPal'>('Card')
  const quote = useMutation({ mutationFn: quoteOrder })
  const createOrder = useMutation({
    mutationFn: createPublicOrder,
    onSuccess: (result) => onTrack(result.mission.id),
  })
  const update = (field: keyof PublicOrderInput, value: string | number | boolean) => setOrder((current) => ({ ...current, [field]: value }))

  return (
    <>
      <View style={styles.card}>
        <SectionTitle title="Book Drone Delivery" text="Customer portal, payment preference and address fields" />
        <Field label="Sender name" value={order.senderName} onChange={(value) => update('senderName', value)} hint="Who sends the package?" />
        <Field label="Sender phone" value={order.senderPhone} onChange={(value) => update('senderPhone', value)} keyboardType="phone-pad" hint="Example: 050-1111111" />
        <Field label="Recipient name" value={order.recipientName} onChange={(value) => update('recipientName', value)} />
        <Field label="Recipient phone" value={order.recipientPhone} onChange={(value) => update('recipientPhone', value)} keyboardType="phone-pad" />
        <Field label="Pickup address" value={order.origin.label} onChange={(value) => setOrder((current) => ({ ...current, origin: { ...current.origin, label: value } }))} hint="City, street, house and apartment" />
        <Field label="Destination address" value={order.destination.label} onChange={(value) => setOrder((current) => ({ ...current, destination: { ...current.destination, label: value } }))} />
        <Field label="Payload kg" value={String(order.payloadKg)} onChange={(value) => update('payloadKg', Number(value) || 0.1)} keyboardType="decimal-pad" />
        <ChoiceRow label="Landing zone" items={['Back yard', 'Roof', 'Entrance', 'Balcony']} active={landingZone} onPick={(value) => setLandingZone(value as LandingZone)} />
        <ChoiceRow label="Payment" items={['Card', 'Bit', 'PayPal']} active={paymentMethod} onPick={(value) => setPaymentMethod(value as typeof paymentMethod)} />
        <Pressable style={styles.primaryButton} onPress={() => quote.mutate(order)}>
          <Text style={styles.primaryText}>{quote.isPending ? 'Calculating...' : 'Calculate Route & Price'}</Text>
        </Pressable>
      </View>
      {quote.data && (
        <View style={styles.quoteCard}>
          <Text style={styles.heroKicker}>Smart quote</Text>
          <Text style={styles.price}>₪{quote.data.priceIls}</Text>
          <Text style={styles.heroText}>{quote.data.distanceKm} km · {quote.data.estimatedMinutes} min · {landingZone} · {paymentMethod}</Text>
          <Text style={styles.muted}>{quote.data.routeNotice}</Text>
          <Pressable style={styles.flightButton} onPress={() => createOrder.mutate(order)}>
            <Text style={styles.flightText}>{createOrder.isPending ? 'Submitting...' : 'Confirm Delivery Request'}</Text>
          </Pressable>
        </View>
      )}
    </>
  )
}

function FleetScreen({ overview, onRefresh }: { overview: Overview; onRefresh: () => void }) {
  const [draft, setDraft] = useState<DroneInput>({
    id: `DX-${Math.floor(Math.random() * 80) + 30}`,
    model: 'AeroLift X4',
    battery: 88,
    maxPayloadKg: 3,
    location: { latitude: 32.08, longitude: 34.79, label: 'New drone pad' },
  })
  const action = useAction(onRefresh)

  return (
    <>
      <EntityForm title="Add Drone" text="Create, charge, release, recall and remove fleet units" busy={action.isPending} onSubmit={() => action.mutate(() => createDrone(draft))}>
        <Field label="Drone ID" value={draft.id} onChange={(id) => setDraft({ ...draft, id })} />
        <Field label="Model" value={draft.model} onChange={(model) => setDraft({ ...draft, model })} />
        <Field label="Battery" value={String(draft.battery)} keyboardType="number-pad" onChange={(battery) => setDraft({ ...draft, battery: Number(battery) || 0 })} />
      </EntityForm>
      {overview.drones.map((drone) => (
        <View key={drone.id} style={styles.card}>
          <DroneCard drone={drone} />
          <ButtonRow>
            <MiniButton label="Charge" onPress={() => action.mutate(() => chargeDrone(drone.id, overview.stations[0]?.id ?? ''))} />
            <MiniButton label="Release" onPress={() => action.mutate(() => releaseCharge(drone.id, 45))} />
            <MiniButton label="Return" onPress={() => action.mutate(() => emergencyReturnHome(drone.id))} />
            <MiniButton label="Delete" danger onPress={() => action.mutate(() => deleteDrone(drone.id))} />
          </ButtonRow>
        </View>
      ))}
    </>
  )
}

function MissionsScreen({ overview, onRefresh, onTrack }: { overview: Overview; onRefresh: () => void; onTrack: (id: string) => void }) {
  const firstSender = overview.customers[0]?.id ?? ''
  const firstTarget = overview.customers[1]?.id ?? firstSender
  const [draft, setDraft] = useState<MissionInput>({
    id: `MS-${Math.floor(Math.random() * 700) + 300}`,
    senderCustomerId: firstSender,
    targetCustomerId: firstTarget,
    payloadKg: 1.1,
    priority: 'urgent',
    etaMinutes: 32,
  })
  const [selectedDroneId, setSelectedDroneId] = useState(overview.drones.find((drone) => drone.status === 'available')?.id ?? overview.drones[0]?.id ?? '')
  const action = useAction(onRefresh)

  return (
    <>
      <EntityForm title="Create Mission" text="Mission lifecycle, dispatch, weather gate and tracking" busy={action.isPending} onSubmit={() => action.mutate(() => createMission(draft))}>
        <Field label="Mission ID" value={draft.id} onChange={(id) => setDraft({ ...draft, id })} />
        <Field label="Payload kg" value={String(draft.payloadKg)} keyboardType="decimal-pad" onChange={(payloadKg) => setDraft({ ...draft, payloadKg: Number(payloadKg) || 0.1 })} />
        <ChoiceRow label="Priority" items={['standard', 'urgent', 'critical']} active={draft.priority} onPick={(priority) => setDraft({ ...draft, priority: priority as MissionInput['priority'] })} />
      </EntityForm>
      <View style={styles.card}>
        <SectionTitle title="Weather Flight Gate" text="Evaluate takeoff before dispatch" />
        <ChoiceRow label="Drone" items={overview.drones.map((drone) => drone.id)} active={selectedDroneId} onPick={setSelectedDroneId} />
      </View>
      {overview.missions.map((mission) => (
        <View key={mission.id} style={styles.card}>
          <InfoRow title={`${mission.id} · ${mission.customer}`} text={`${mission.origin.label} → ${mission.destination.label}`} badge={mission.status} />
          <Progress value={mission.progressPercent} />
          <Text style={styles.muted}>Payload {mission.payloadKg}kg · ETA {mission.etaMinutes}m · {mission.priority}</Text>
          <ButtonRow>
            <MiniButton label="Gate" onPress={() => action.mutate(() => assessFlight(selectedDroneId, mission.id))} />
            <MiniButton label="Dispatch" onPress={() => action.mutate(() => dispatchMission(selectedDroneId, mission.id))} />
            <MiniButton label="Pickup" onPress={() => action.mutate(() => pickupMission(mission.id))} />
            <MiniButton label="Sim" onPress={() => action.mutate(() => simulateMissionStep(mission.id))} />
            <MiniButton label="Track" onPress={() => onTrack(mission.id)} />
            <MiniButton label="Delete" danger onPress={() => action.mutate(() => deleteMission(mission.id))} />
          </ButtonRow>
        </View>
      ))}
    </>
  )
}

function CustomersScreen({ overview, onRefresh }: { overview: Overview; onRefresh: () => void }) {
  const [draft, setDraft] = useState<CustomerInput>({
    id: `CU-${Math.floor(Math.random() * 900) + 100}`,
    name: 'New Customer',
    phone: '050-0000000',
    email: 'customer@example.com',
    location: { latitude: 32.08, longitude: 34.78, label: 'Customer address' },
  })
  const action = useAction(onRefresh)
  return (
    <>
      <EntityForm title="Add Customer" text="Customer CRM for delivery requests" busy={action.isPending} onSubmit={() => action.mutate(() => createCustomer(draft))}>
        <Field label="Name" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
        <Field label="Phone" value={draft.phone} onChange={(phone) => setDraft({ ...draft, phone })} keyboardType="phone-pad" />
        <Field label="Email" value={draft.email} onChange={(email) => setDraft({ ...draft, email })} />
      </EntityForm>
      {overview.customers.map((customer) => (
        <View key={customer.id} style={styles.card}>
          <InfoRow title={customer.name} text={`${customer.phone} · ${customer.email}`} badge={customer.id} />
          <Text style={styles.muted}>{customer.location.label}</Text>
          <MiniButton label="Delete customer" danger onPress={() => action.mutate(() => deleteCustomer(customer.id))} />
        </View>
      ))}
    </>
  )
}

function StationsScreen({ overview, onRefresh }: { overview: Overview; onRefresh: () => void }) {
  const [draft, setDraft] = useState<StationInput>({
    id: `ST-${Math.floor(Math.random() * 90) + 10}`,
    name: 'New Charging Nest',
    totalSlots: 4,
    location: { latitude: 32.085, longitude: 34.79, label: 'Charging nest' },
  })
  const action = useAction(onRefresh)
  return (
    <>
      <EntityForm title="Add Station" text="Charging capacity and robotic nesting overview" busy={action.isPending} onSubmit={() => action.mutate(() => createStation(draft))}>
        <Field label="Station name" value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
        <Field label="Slots" value={String(draft.totalSlots)} keyboardType="number-pad" onChange={(slots) => setDraft({ ...draft, totalSlots: Number(slots) || 1 })} />
      </EntityForm>
      {overview.stations.map((station) => (
        <View key={station.id} style={styles.card}>
          <InfoRow title={station.name} text={station.location.label} badge={station.id} />
          <Progress value={Math.round((station.occupiedSlots / station.totalSlots) * 100)} />
          <Text style={styles.muted}>{station.occupiedSlots}/{station.totalSlots} slots occupied</Text>
          <MiniButton label="Delete station" danger onPress={() => action.mutate(() => deleteStation(station.id))} />
        </View>
      ))}
    </>
  )
}

function IntelligenceScreen({ overview, onRefresh }: { overview: Overview; onRefresh: () => void }) {
  const pending = overview.missions.filter((mission) => mission.status === 'pending')
  const [missionId, setMissionId] = useState(pending[0]?.id ?? overview.missions[0]?.id ?? '')
  const [zoneDraft, setZoneDraft] = useState<NoFlyZoneInput>({
    id: `NFZ-${overview.noFlyZones.length + 100}`,
    name: 'Temporary air restriction',
    center: { latitude: 32.087, longitude: 34.799, label: 'Restricted zone' },
    radiusKm: 0.25,
    reason: 'Dynamic operations restriction.',
  })
  const recommendations = useQuery({ queryKey: ['mobile-recommendations', missionId], queryFn: () => getRecommendations(missionId), enabled: Boolean(missionId) })
  const forecast = useQuery({ queryKey: ['mobile-forecast', missionId], queryFn: () => getForecast(missionId), enabled: Boolean(missionId) })
  const action = useAction(onRefresh)

  return (
    <>
      <View style={styles.card}>
        <SectionTitle title="Fleet Intelligence" text="AI dispatch, no-fly zones, weather windows and notifications" />
        <ChoiceRow label="Mission" items={overview.missions.map((mission) => mission.id)} active={missionId} onPick={setMissionId} />
        {recommendations.data?.map((rec, index) => (
          <InfoRow key={rec.drone.id} title={`#${index + 1} ${rec.drone.id} · Score ${rec.score}`} text={rec.rationale} badge={`${rec.approachKm}km`} />
        ))}
      </View>
      <View style={styles.card}>
        <SectionTitle title="Weather Scheduling" text="Best departure windows by wind and gusts" />
        {forecast.data?.bestWindow && <InfoRow title="Best window" text={`${new Date(forecast.data.bestWindow.time).toLocaleTimeString()} · ${forecast.data.bestWindow.speedKmh}/${forecast.data.bestWindow.gustKmh} km/h`} badge={forecast.data.bestWindow.recommendation} />}
        {forecast.data?.slots.slice(0, 5).map((slot) => (
          <InfoRow key={slot.time} title={new Date(slot.time).toLocaleTimeString()} text={`${slot.speedKmh}/${slot.gustKmh} km/h`} badge={slot.recommendation} />
        ))}
      </View>
      <EntityForm title="No-Fly Zone" text="Create dynamic restricted areas" busy={action.isPending} onSubmit={() => action.mutate(() => createNoFlyZone(zoneDraft))}>
        <Field label="Zone name" value={zoneDraft.name} onChange={(name) => setZoneDraft({ ...zoneDraft, name })} />
        <Field label="Radius km" value={String(zoneDraft.radiusKm)} keyboardType="decimal-pad" onChange={(radius) => setZoneDraft({ ...zoneDraft, radiusKm: Number(radius) || 0.1 })} />
      </EntityForm>
      {overview.noFlyZones.map((zone) => (
        <View key={zone.id} style={styles.card}>
          <InfoRow title={zone.name} text={zone.reason} badge={`${zone.radiusKm}km`} danger />
          <MiniButton label="Remove zone" danger onPress={() => action.mutate(() => deleteNoFlyZone(zone.id))} />
        </View>
      ))}
    </>
  )
}

function TrackingScreen({ trackingCode, setTrackingCode, onRefresh }: { trackingCode: string; setTrackingCode: (value: string) => void; onRefresh: () => void }) {
  const [otp, setOtp] = useState('')
  const tracking = useQuery({ queryKey: ['mobile-tracking', trackingCode], queryFn: () => getTracking(trackingCode), enabled: trackingCode.length > 2 })
  const action = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onSuccess: async () => {
      await tracking.refetch()
      onRefresh()
    },
  })
  const progress = tracking.data?.mission.progressPercent ?? 0
  const radarPosition = useMemo(() => Math.min(86, 16 + progress * 0.7), [progress])

  return (
    <>
      <View style={styles.card}>
        <SectionTitle title="Track Delivery" text="Mission report, telemetry simulation and secure handover" />
        <Field label="Tracking code or mission ID" value={trackingCode} onChange={setTrackingCode} autoCapitalize="characters" />
      </View>
      {tracking.isLoading && <LoadingCard text="Loading delivery..." />}
      {tracking.data && (
        <>
          <View style={styles.radarCard}>
            <Text style={styles.heroKicker}>Sky Radar</Text>
            <View style={styles.radar}>
              <View style={[styles.ring, styles.ringOne]} />
              <View style={[styles.ring, styles.ringTwo]} />
              <View style={[styles.ring, styles.ringThree]} />
              <View style={[styles.radarDrone, { left: `${radarPosition}%` }]} />
            </View>
            <View style={styles.metricGrid}>
              <Metric label="ETA" value={`${tracking.data.estimatedArrivalMinutes}m`} />
              <Metric label="Progress" value={`${progress}%`} />
            </View>
          </View>
          <View style={styles.card}>
            <InfoRow title={tracking.data.publicCode} text={`${tracking.data.mission.origin.label} → ${tracking.data.mission.destination.label}`} badge={tracking.data.mission.status} />
            <Progress value={progress} />
            {tracking.data.drone && <Text style={styles.muted}>Drone {tracking.data.drone.id} · Battery {tracking.data.drone.battery}%</Text>}
            <ButtonRow>
              <MiniButton label="Lifecycle" onPress={() => action.mutate(() => simulateMissionStep(tracking.data!.mission.id))} />
              <MiniButton label="Telemetry" onPress={() => action.mutate(() => advanceTelemetry(tracking.data!.mission.id))} />
            </ButtonRow>
          </View>
          <View style={styles.card}>
            <SectionTitle title="Secure Handover" text="OTP delivery confirmation" />
            <Text style={styles.muted}>Demo OTP: {tracking.data.demoConfirmationCode ?? tracking.data.mission.proofOfDeliveryCode ?? 'available in transit'}</Text>
            <Field label="Recipient OTP" value={otp} onChange={setOtp} keyboardType="number-pad" />
            <Pressable style={styles.primaryButton} onPress={() => action.mutate(() => confirmDelivery(tracking.data!.mission.id, otp))}>
              <Text style={styles.primaryText}>Confirm Delivery</Text>
            </Pressable>
          </View>
          <View style={styles.card}>
            <SectionTitle title="Mission Timeline" text="Black-box style lifecycle events" />
            {(tracking.data.mission.timeline ?? []).slice().reverse().map((event) => (
              <InfoRow key={`${event.status}-${event.timestamp}`} title={event.title} text={event.detail} badge={new Date(event.timestamp).toLocaleTimeString()} />
            ))}
          </View>
        </>
      )}
    </>
  )
}

function MaintenanceScreen({ overview, onRefresh }: { overview: Overview; onRefresh: () => void }) {
  const action = useAction(onRefresh)
  return (
    <>
      <View style={styles.card}>
        <SectionTitle title="Maintenance" text="Battery health, flight hours and service completion" />
        <View style={styles.metricGrid}>
          <Metric label="Due now" value={overview.analytics.maintenanceDue} />
          <Metric label="Delivered" value={overview.analytics.deliveredMissions} />
        </View>
      </View>
      {overview.drones.map((drone) => {
        const due = drone.flightHours >= drone.nextServiceHours || drone.batteryHealth < 82
        return (
          <View key={drone.id} style={styles.card}>
            <InfoRow title={`${drone.id} · ${drone.model}`} text={`${drone.flightHours}h flown · ${drone.completedDeliveries} deliveries`} badge={due ? 'DUE' : 'OK'} danger={due} />
            <Progress value={Math.round(drone.batteryHealth)} />
            <Text style={styles.muted}>Battery health {drone.batteryHealth.toFixed(1)}% · next service at {drone.nextServiceHours}h</Text>
            <MiniButton label="Complete service" onPress={() => action.mutate(() => completeDroneService(drone.id))} />
          </View>
        )
      })}
    </>
  )
}

function AuditScreen({ overview }: { overview: Overview }) {
  return (
    <View style={styles.card}>
      <SectionTitle title="Audit Log" text="Black-box operations ledger" />
      {overview.auditEvents.map((event) => (
        <InfoRow key={event.id} title={event.action.replaceAll('_', ' ')} text={`${event.entityType}: ${event.entityId} · ${event.detail}`} badge={event.actor} />
      ))}
    </View>
  )
}

function useAction(onRefresh: () => void) {
  return useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onSuccess: () => onRefresh(),
    onError: (error) => Alert.alert('Action failed', error instanceof Error ? error.message : 'Unknown error'),
  })
}

function EntityForm({ title, text, busy, children, onSubmit }: { title: string; text: string; busy: boolean; children: React.ReactNode; onSubmit: () => void }) {
  return (
    <View style={styles.card}>
      <SectionTitle title={title} text={text} />
      {children}
      <Pressable style={styles.primaryButton} disabled={busy} onPress={onSubmit}>
        <Text style={styles.primaryText}>{busy ? 'Working...' : title}</Text>
      </Pressable>
    </View>
  )
}

function DroneCard({ drone }: { drone: Overview['drones'][number] }) {
  return (
    <View style={styles.droneRow}>
      <View style={[styles.statusDot, styles[drone.status]]} />
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{drone.id} · {drone.model}</Text>
        <Text style={styles.muted}>{drone.status} · {drone.location.label}</Text>
        <Progress value={drone.battery} />
      </View>
      <Text style={styles.batteryText}>{drone.battery}%</Text>
    </View>
  )
}

function InfoRow({ title, text, badge, danger }: { title: string; text: string; badge?: string; danger?: boolean }) {
  return (
    <View style={[styles.infoRow, danger && styles.infoDanger]}>
      <View style={styles.flex}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.muted}>{text}</Text>
      </View>
      {badge && <Text style={[styles.badge, danger && styles.badgeDanger]}>{badge}</Text>}
    </View>
  )
}

function ChoiceRow({ label, items, active, onPick }: { label: string; items: string[]; active: string; onPick: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.zoneGrid}>
        {items.map((item) => (
          <Pressable key={item} style={[styles.zone, active === item && styles.zoneActive]} onPress={() => onPick(item)}>
            <Text style={styles.zoneText}>{item}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

function ButtonRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.buttonRow}>{children}</View>
}

function MiniButton({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable style={[styles.miniButton, danger && styles.miniDanger]} onPress={onPress}>
      <Text style={[styles.miniText, danger && styles.miniDangerText]}>{label}</Text>
    </Pressable>
  )
}

function Tab({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  )
}

function SectionTitle({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      <Text style={styles.muted}>{text}</Text>
    </View>
  )
}

function Progress({ value }: { value: number }) {
  const width = `${Math.max(0, Math.min(100, value))}%` as `${number}%`
  return <View style={styles.progressTrack}><View style={[styles.progressFill, { width }]} /></View>
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
  autoCapitalize,
  hint,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  hint?: string
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onChangeText={onChange}
        placeholderTextColor="#5f728b"
        style={styles.input}
        value={value}
      />
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  )
}

function LoadingCard({ text }: { text: string }) {
  return (
    <View style={styles.card}>
      <ActivityIndicator color="#22d3ee" />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  )
}

function EmptyCard({ text }: { text: string }) {
  return <View style={styles.card}><Text style={styles.heroText}>{text}</Text></View>
}

const styles = StyleSheet.create({
  app: { flex: 1 },
  content: { padding: 18, paddingBottom: 42 },
  header: { alignItems: 'center', flexDirection: 'row', gap: 13, marginBottom: 16, marginTop: 8 },
  logoMark: { backgroundColor: '#22d3ee', borderRadius: 16, height: 48, shadowColor: '#22d3ee', shadowOpacity: 0.35, shadowRadius: 18, width: 48 },
  eyebrow: { color: '#22d3ee', fontSize: 11, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: '#f5f9ff', fontSize: 30, fontWeight: '900', letterSpacing: -1.4 },
  nav: { marginBottom: 18 },
  tab: { backgroundColor: 'rgba(255,255,255,.04)', borderColor: 'rgba(148,163,184,.15)', borderRadius: 999, borderWidth: 1, marginRight: 8, paddingHorizontal: 14, paddingVertical: 11 },
  tabActive: { backgroundColor: '#22d3ee' },
  tabText: { color: '#8fa3bd', fontSize: 12, fontWeight: '800' },
  tabTextActive: { color: '#061122' },
  stack: { gap: 14 },
  heroCard: { backgroundColor: 'rgba(13,25,44,.88)', borderColor: 'rgba(34,211,238,.18)', borderRadius: 24, borderWidth: 1, gap: 10, padding: 22 },
  heroKicker: { color: '#22d3ee', fontSize: 11, fontWeight: '900', letterSpacing: 1.7, textTransform: 'uppercase' },
  heroTitle: { color: '#f5f9ff', fontSize: 28, fontWeight: '900', letterSpacing: -1.3, lineHeight: 31 },
  heroText: { color: '#9eb1ca', fontSize: 14, lineHeight: 22 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { backgroundColor: 'rgba(13,25,44,.9)', borderColor: 'rgba(148,163,184,.14)', borderRadius: 18, borderWidth: 1, flexGrow: 1, minWidth: '46%', padding: 16 },
  metricLabel: { color: '#7f93ad', fontSize: 11, marginBottom: 8 },
  metricValue: { color: '#f5f9ff', fontSize: 25, fontWeight: '900' },
  card: { backgroundColor: 'rgba(13,25,44,.94)', borderColor: 'rgba(148,163,184,.15)', borderRadius: 22, borderWidth: 1, gap: 13, padding: 18 },
  sectionTitle: { gap: 5, marginBottom: 2 },
  sectionHeading: { color: '#f5f9ff', fontSize: 19, fontWeight: '900', letterSpacing: -0.5 },
  muted: { color: '#8297b2', fontSize: 12, lineHeight: 18 },
  hint: { color: '#627994', fontSize: 11 },
  flex: { flex: 1 },
  droneRow: { alignItems: 'center', backgroundColor: 'rgba(16,31,53,.62)', borderColor: 'rgba(148,163,184,.1)', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 13 },
  infoRow: { alignItems: 'center', backgroundColor: 'rgba(16,31,53,.62)', borderColor: 'rgba(148,163,184,.1)', borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 13 },
  infoDanger: { borderColor: 'rgba(248,113,113,.4)' },
  statusDot: { borderRadius: 999, height: 9, width: 9 },
  available: { backgroundColor: '#22c55e' },
  charging: { backgroundColor: '#f59e0b' },
  mission: { backgroundColor: '#22d3ee' },
  rowTitle: { color: '#f5f9ff', fontSize: 14, fontWeight: '900' },
  batteryText: { color: '#dce9f8', fontSize: 12, fontWeight: '800' },
  badge: { backgroundColor: 'rgba(34,211,238,.13)', borderRadius: 999, color: '#67e8f9', fontSize: 10, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 6, textTransform: 'uppercase' },
  badgeDanger: { backgroundColor: 'rgba(248,113,113,.16)', color: '#fca5a5' },
  field: { gap: 7 },
  label: { color: '#8fa3bd', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  input: { backgroundColor: '#101f35', borderColor: 'rgba(148,163,184,.18)', borderRadius: 13, borderWidth: 1, color: '#f5f9ff', fontSize: 14, paddingHorizontal: 14, paddingVertical: 13 },
  zoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zone: { backgroundColor: '#101f35', borderColor: 'rgba(148,163,184,.16)', borderRadius: 13, borderWidth: 1, minWidth: '47%', padding: 12 },
  zoneActive: { backgroundColor: 'rgba(34,211,238,.11)', borderColor: '#22d3ee' },
  zoneText: { color: '#dce9f8', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  primaryButton: { alignItems: 'center', backgroundColor: '#22d3ee', borderRadius: 14, paddingVertical: 15 },
  primaryText: { color: '#061122', fontSize: 14, fontWeight: '900' },
  smallButton: { alignSelf: 'flex-start', backgroundColor: 'rgba(34,211,238,.14)', borderColor: 'rgba(34,211,238,.3)', borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  smallButtonText: { color: '#67e8f9', fontSize: 12, fontWeight: '900' },
  quoteCard: { backgroundColor: 'rgba(34,211,238,.1)', borderColor: 'rgba(34,211,238,.25)', borderRadius: 22, borderWidth: 1, gap: 12, padding: 18 },
  price: { color: '#f5f9ff', fontSize: 42, fontWeight: '900', letterSpacing: -2 },
  flightButton: { alignItems: 'center', backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 15 },
  flightText: { color: '#f5f9ff', fontSize: 14, fontWeight: '900' },
  radarCard: { backgroundColor: 'rgba(13,25,44,.94)', borderColor: 'rgba(34,211,238,.18)', borderRadius: 24, borderWidth: 1, gap: 13, padding: 18 },
  radar: { alignItems: 'center', backgroundColor: 'rgba(3,9,20,.45)', borderColor: 'rgba(34,211,238,.15)', borderRadius: 20, borderWidth: 1, height: 250, justifyContent: 'center', overflow: 'hidden' },
  ring: { borderColor: 'rgba(34,211,238,.2)', borderRadius: 999, borderWidth: 1, position: 'absolute' },
  ringOne: { height: 82, width: 82 },
  ringTwo: { height: 146, width: 146 },
  ringThree: { height: 214, width: 214 },
  radarDrone: { backgroundColor: '#22d3ee', borderRadius: 999, height: 14, position: 'absolute', top: '48%', width: 14 },
  progressTrack: { backgroundColor: 'rgba(255,255,255,.08)', borderRadius: 999, height: 10, overflow: 'hidden' },
  progressFill: { backgroundColor: '#22d3ee', borderRadius: 999, height: '100%' },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniButton: { backgroundColor: 'rgba(34,211,238,.12)', borderColor: 'rgba(34,211,238,.24)', borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  miniDanger: { backgroundColor: 'rgba(248,113,113,.13)', borderColor: 'rgba(248,113,113,.35)' },
  miniText: { color: '#67e8f9', fontSize: 11, fontWeight: '900' },
  miniDangerText: { color: '#fca5a5' },
  loadingText: { color: '#9eb1ca', marginTop: 10, textAlign: 'center' },
})
