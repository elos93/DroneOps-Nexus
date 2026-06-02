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
import { languageOptions, type Language, useI18n } from './i18n'
import type { CustomerInput, DroneInput, MissionInput, NoFlyZoneInput, Overview, PublicOrderInput, StationInput } from './types'

type Screen = 'dashboard' | 'book' | 'fleet' | 'missions' | 'customers' | 'stations' | 'intel' | 'track' | 'maintenance' | 'audit'
type LandingZone = 'Back yard' | 'Roof' | 'Entrance' | 'Balcony'
type PaymentMethod = 'Card' | 'Bit' | 'PayPal'

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

const screens: { id: Screen; labelKey: string }[] = [
  { id: 'dashboard', labelKey: 'nav.dashboard' },
  { id: 'book', labelKey: 'nav.book' },
  { id: 'fleet', labelKey: 'nav.fleet' },
  { id: 'missions', labelKey: 'nav.missions' },
  { id: 'customers', labelKey: 'nav.customers' },
  { id: 'stations', labelKey: 'nav.stations' },
  { id: 'intel', labelKey: 'nav.intel' },
  { id: 'track', labelKey: 'nav.track' },
  { id: 'maintenance', labelKey: 'nav.maintenance' },
  { id: 'audit', labelKey: 'nav.audit' },
]

export function DroneOpsMobile() {
  const { t, isRtl } = useI18n()
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [trackingCode, setTrackingCode] = useState('TRACK-MS207')
  const overview = useQuery({ queryKey: ['mobile-overview'], queryFn: getOverview, refetchInterval: 8000 })

  const refresh = () => overview.refetch()

  return (
    <LinearGradient colors={['#061122', '#081a2e', '#061122']} style={styles.app}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, isRtl && styles.rtlRow]}>
          <View style={styles.logoMark} />
          <View style={styles.flex}>
            <Text style={styles.eyebrow}>DRONEOPS NEXUS</Text>
            <Text style={[styles.title, isRtl && styles.rtlText]}>{t('app.title')}</Text>
            <Text style={[styles.muted, isRtl && styles.rtlText]}>{t('app.subtitle')}</Text>
          </View>
        </View>
        <LanguageSwitcher />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nav}>
          {screens.map((item) => (
            <Tab key={item.id} active={screen === item.id} label={t(item.labelKey)} onPress={() => setScreen(item.id)} />
          ))}
        </ScrollView>

        {overview.isLoading && <LoadingCard text={t('common.loadingFleet')} />}
        {overview.isError && <EmptyCard text={t('common.loadError')} />}
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

function landingZoneKey(zone: LandingZone) {
  return {
    'Back yard': 'landing.backYard',
    Roof: 'landing.roof',
    Entrance: 'landing.entrance',
    Balcony: 'landing.balcony',
  }[zone]
}

function paymentKey(method: PaymentMethod) {
  return {
    Card: 'payment.card',
    Bit: 'payment.bit',
    PayPal: 'payment.paypal',
  }[method]
}

function Dashboard({ overview, onRefresh }: { overview: Overview; onRefresh: () => void }) {
  const { t } = useI18n()
  const ready = overview.drones.filter((drone) => drone.status === 'available').length
  const airborne = overview.drones.filter((drone) => drone.status === 'mission').length

  return (
    <>
      <View style={styles.heroCard}>
        <Text style={styles.heroKicker}>{t('dashboard.kicker')}</Text>
        <Text style={styles.heroTitle}>{t('dashboard.title')}</Text>
        <Text style={styles.heroText}>{t('dashboard.text')}</Text>
        <Pressable style={styles.smallButton} onPress={onRefresh}><Text style={styles.smallButtonText}>{t('common.refresh')}</Text></Pressable>
      </View>
      <View style={styles.metricGrid}>
        <Metric label={t('dashboard.totalDrones')} value={overview.metrics.totalDrones} />
        <Metric label={t('dashboard.activeMissions')} value={overview.metrics.activeMissions} />
        <Metric label={t('dashboard.readyNow')} value={ready} />
        <Metric label={t('dashboard.airborne')} value={airborne} />
        <Metric label={t('dashboard.avgBattery')} value={`${overview.metrics.averageBattery}%`} />
        <Metric label={t('dashboard.revenuePending')} value={`₪${overview.analytics.pendingRevenueIls}`} />
      </View>
      <View style={styles.card}>
        <SectionTitle title={t('dashboard.fleetHealth')} text={t('dashboard.fleetHealthText')} />
        {overview.drones.slice(0, 5).map((drone) => <DroneCard key={drone.id} drone={drone} />)}
      </View>
      <View style={styles.card}>
        <SectionTitle title={t('dashboard.alerts')} text={t('dashboard.alertsText')} />
        {overview.alerts.slice(0, 4).map((alert) => (
          <InfoRow key={alert.id} title={alert.title} text={alert.message} badge={alert.severity.toUpperCase()} danger={alert.severity === 'critical'} />
        ))}
        {overview.notifications.slice(0, 3).map((notice) => (
          <InfoRow key={notice.id} title={notice.title} text={`${notice.channel} · ${notice.deliveryState}`} badge="Notify" />
        ))}
      </View>
      <View style={styles.card}>
        <SectionTitle title={t('dashboard.analytics')} text={t('dashboard.analyticsText')} />
        <View style={styles.metricGrid}>
          <Metric label={t('dashboard.utilization')} value={`${overview.analytics.fleetUtilizationPercent}%`} />
          <Metric label={t('dashboard.chargingLoad')} value={`${overview.analytics.chargingCapacityPercent}%`} />
          <Metric label={t('dashboard.avgPayload')} value={`${overview.analytics.averagePayloadKg}kg`} />
          <Metric label={t('dashboard.avgRoute')} value={`${overview.analytics.averageRouteKm}km`} />
        </View>
      </View>
    </>
  )
}

function BookingScreen({ onTrack }: { onTrack: (code: string) => void }) {
  const { t } = useI18n()
  const [order, setOrder] = useState<PublicOrderInput>(initialOrder)
  const [landingZone, setLandingZone] = useState<LandingZone>('Back yard')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Card')
  const quote = useMutation({ mutationFn: quoteOrder })
  const createOrder = useMutation({
    mutationFn: createPublicOrder,
    onSuccess: (result) => onTrack(result.mission.id),
  })
  const update = (field: keyof PublicOrderInput, value: string | number | boolean) => setOrder((current) => ({ ...current, [field]: value }))

  return (
    <>
      <View style={styles.card}>
        <SectionTitle title={t('booking.title')} text={t('booking.text')} />
        <Field label={t('booking.senderName')} value={order.senderName} onChange={(value) => update('senderName', value)} hint={t('booking.senderNameHint')} />
        <Field label={t('booking.senderPhone')} value={order.senderPhone} onChange={(value) => update('senderPhone', value)} keyboardType="phone-pad" hint={t('booking.phoneHint')} />
        <Field label={t('booking.recipientName')} value={order.recipientName} onChange={(value) => update('recipientName', value)} />
        <Field label={t('booking.recipientPhone')} value={order.recipientPhone} onChange={(value) => update('recipientPhone', value)} keyboardType="phone-pad" />
        <Field label={t('booking.pickup')} value={order.origin.label} onChange={(value) => setOrder((current) => ({ ...current, origin: { ...current.origin, label: value } }))} hint={t('booking.pickupHint')} />
        <Field label={t('booking.destination')} value={order.destination.label} onChange={(value) => setOrder((current) => ({ ...current, destination: { ...current.destination, label: value } }))} />
        <Field label={t('booking.payload')} value={String(order.payloadKg)} onChange={(value) => update('payloadKg', Number(value) || 0.1)} keyboardType="decimal-pad" />
        <ChoiceRow label={t('booking.landingZone')} items={['Back yard', 'Roof', 'Entrance', 'Balcony']} getLabel={(value) => t(landingZoneKey(value as LandingZone))} active={landingZone} onPick={(value) => setLandingZone(value as LandingZone)} />
        <ChoiceRow label={t('booking.payment')} items={['Card', 'Bit', 'PayPal']} getLabel={(value) => t(paymentKey(value as PaymentMethod))} active={paymentMethod} onPick={(value) => setPaymentMethod(value as PaymentMethod)} />
        <Pressable style={styles.primaryButton} onPress={() => quote.mutate(order)}>
          <Text style={styles.primaryText}>{quote.isPending ? t('booking.calculating') : t('booking.calculate')}</Text>
        </Pressable>
      </View>
      {quote.data && (
        <View style={styles.quoteCard}>
          <Text style={styles.heroKicker}>{t('booking.smartQuote')}</Text>
          <Text style={styles.price}>₪{quote.data.priceIls}</Text>
          <Text style={styles.heroText}>{quote.data.distanceKm} km · {quote.data.estimatedMinutes} min · {t(landingZoneKey(landingZone))} · {t(paymentKey(paymentMethod))}</Text>
          <Text style={styles.muted}>{quote.data.routeNotice}</Text>
          <Pressable style={styles.flightButton} onPress={() => createOrder.mutate(order)}>
            <Text style={styles.flightText}>{createOrder.isPending ? t('booking.submitting') : t('booking.submit')}</Text>
          </Pressable>
        </View>
      )}
    </>
  )
}

function FleetScreen({ overview, onRefresh }: { overview: Overview; onRefresh: () => void }) {
  const { t } = useI18n()
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
      <EntityForm title={t('fleet.addTitle')} text={t('fleet.addText')} busy={action.isPending} onSubmit={() => action.mutate(() => createDrone(draft))}>
        <Field label={t('fleet.id')} value={draft.id} onChange={(id) => setDraft({ ...draft, id })} />
        <Field label={t('fleet.model')} value={draft.model} onChange={(model) => setDraft({ ...draft, model })} />
        <Field label={t('fleet.battery')} value={String(draft.battery)} keyboardType="number-pad" onChange={(battery) => setDraft({ ...draft, battery: Number(battery) || 0 })} />
      </EntityForm>
      {overview.drones.map((drone) => (
        <View key={drone.id} style={styles.card}>
          <DroneCard drone={drone} />
          <ButtonRow>
            <MiniButton label={t('fleet.charge')} onPress={() => action.mutate(() => chargeDrone(drone.id, overview.stations[0]?.id ?? ''))} />
            <MiniButton label={t('fleet.release')} onPress={() => action.mutate(() => releaseCharge(drone.id, 45))} />
            <MiniButton label={t('fleet.returnHome')} onPress={() => action.mutate(() => emergencyReturnHome(drone.id))} />
            <MiniButton label={t('fleet.delete')} danger onPress={() => action.mutate(() => deleteDrone(drone.id))} />
          </ButtonRow>
        </View>
      ))}
    </>
  )
}

function MissionsScreen({ overview, onRefresh, onTrack }: { overview: Overview; onRefresh: () => void; onTrack: (id: string) => void }) {
  const { t } = useI18n()
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
      <EntityForm title={t('missions.createTitle')} text={t('missions.createText')} busy={action.isPending} onSubmit={() => action.mutate(() => createMission(draft))}>
        <Field label={t('missions.id')} value={draft.id} onChange={(id) => setDraft({ ...draft, id })} />
        <Field label={t('missions.payload')} value={String(draft.payloadKg)} keyboardType="decimal-pad" onChange={(payloadKg) => setDraft({ ...draft, payloadKg: Number(payloadKg) || 0.1 })} />
        <ChoiceRow label={t('missions.priority')} items={['standard', 'urgent', 'critical']} getLabel={(value) => t(`common.priority.${value}`)} active={draft.priority} onPick={(priority) => setDraft({ ...draft, priority: priority as MissionInput['priority'] })} />
      </EntityForm>
      <View style={styles.card}>
        <SectionTitle title={t('missions.flightGate')} text={t('missions.flightGateText')} />
        <ChoiceRow label={t('missions.drone')} items={overview.drones.map((drone) => drone.id)} active={selectedDroneId} onPick={setSelectedDroneId} />
      </View>
      {overview.missions.map((mission) => (
        <View key={mission.id} style={styles.card}>
          <InfoRow title={`${mission.id} · ${mission.customer}`} text={`${mission.origin.label} → ${mission.destination.label}`} badge={mission.status} />
          <Progress value={mission.progressPercent} />
          <Text style={styles.muted}>{t('missions.payload')} {mission.payloadKg}kg · ETA {mission.etaMinutes}m · {t(`common.priority.${mission.priority}`)}</Text>
          <ButtonRow>
            <MiniButton label={t('missions.gate')} onPress={() => action.mutate(() => assessFlight(selectedDroneId, mission.id))} />
            <MiniButton label={t('missions.dispatch')} onPress={() => action.mutate(() => dispatchMission(selectedDroneId, mission.id))} />
            <MiniButton label={t('missions.pickup')} onPress={() => action.mutate(() => pickupMission(mission.id))} />
            <MiniButton label={t('missions.sim')} onPress={() => action.mutate(() => simulateMissionStep(mission.id))} />
            <MiniButton label={t('missions.track')} onPress={() => onTrack(mission.id)} />
            <MiniButton label={t('common.delete')} danger onPress={() => action.mutate(() => deleteMission(mission.id))} />
          </ButtonRow>
        </View>
      ))}
    </>
  )
}

function CustomersScreen({ overview, onRefresh }: { overview: Overview; onRefresh: () => void }) {
  const { t } = useI18n()
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
      <EntityForm title={t('customers.addTitle')} text={t('customers.addText')} busy={action.isPending} onSubmit={() => action.mutate(() => createCustomer(draft))}>
        <Field label={t('customers.name')} value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
        <Field label={t('customers.phone')} value={draft.phone} onChange={(phone) => setDraft({ ...draft, phone })} keyboardType="phone-pad" />
        <Field label={t('customers.email')} value={draft.email} onChange={(email) => setDraft({ ...draft, email })} />
      </EntityForm>
      {overview.customers.map((customer) => (
        <View key={customer.id} style={styles.card}>
          <InfoRow title={customer.name} text={`${customer.phone} · ${customer.email}`} badge={customer.id} />
          <Text style={styles.muted}>{customer.location.label}</Text>
          <MiniButton label={t('customers.delete')} danger onPress={() => action.mutate(() => deleteCustomer(customer.id))} />
        </View>
      ))}
    </>
  )
}

function StationsScreen({ overview, onRefresh }: { overview: Overview; onRefresh: () => void }) {
  const { t } = useI18n()
  const [draft, setDraft] = useState<StationInput>({
    id: `ST-${Math.floor(Math.random() * 90) + 10}`,
    name: 'New Charging Nest',
    totalSlots: 4,
    location: { latitude: 32.085, longitude: 34.79, label: 'Charging nest' },
  })
  const action = useAction(onRefresh)
  return (
    <>
      <EntityForm title={t('stations.addTitle')} text={t('stations.addText')} busy={action.isPending} onSubmit={() => action.mutate(() => createStation(draft))}>
        <Field label={t('stations.name')} value={draft.name} onChange={(name) => setDraft({ ...draft, name })} />
        <Field label={t('stations.slots')} value={String(draft.totalSlots)} keyboardType="number-pad" onChange={(slots) => setDraft({ ...draft, totalSlots: Number(slots) || 1 })} />
      </EntityForm>
      {overview.stations.map((station) => (
        <View key={station.id} style={styles.card}>
          <InfoRow title={station.name} text={station.location.label} badge={station.id} />
          <Progress value={Math.round((station.occupiedSlots / station.totalSlots) * 100)} />
          <Text style={styles.muted}>{station.occupiedSlots}/{station.totalSlots} {t('stations.occupied')}</Text>
          <MiniButton label={t('stations.delete')} danger onPress={() => action.mutate(() => deleteStation(station.id))} />
        </View>
      ))}
    </>
  )
}

function IntelligenceScreen({ overview, onRefresh }: { overview: Overview; onRefresh: () => void }) {
  const { t } = useI18n()
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
        <SectionTitle title={t('intel.title')} text={t('intel.text')} />
        <ChoiceRow label={t('intel.mission')} items={overview.missions.map((mission) => mission.id)} active={missionId} onPick={setMissionId} />
        {recommendations.data?.map((rec, index) => (
          <InfoRow key={rec.drone.id} title={`#${index + 1} ${rec.drone.id} · Score ${rec.score}`} text={rec.rationale} badge={`${rec.approachKm}km`} />
        ))}
      </View>
      <View style={styles.card}>
        <SectionTitle title={t('intel.weather')} text={t('intel.weatherText')} />
        {forecast.data?.bestWindow && <InfoRow title={t('intel.bestWindow')} text={`${new Date(forecast.data.bestWindow.time).toLocaleTimeString()} · ${forecast.data.bestWindow.speedKmh}/${forecast.data.bestWindow.gustKmh} km/h`} badge={forecast.data.bestWindow.recommendation} />}
        {forecast.data?.slots.slice(0, 5).map((slot) => (
          <InfoRow key={slot.time} title={new Date(slot.time).toLocaleTimeString()} text={`${slot.speedKmh}/${slot.gustKmh} km/h`} badge={slot.recommendation} />
        ))}
      </View>
      <EntityForm title={t('intel.noFlyTitle')} text={t('intel.noFlyText')} busy={action.isPending} onSubmit={() => action.mutate(() => createNoFlyZone(zoneDraft))}>
        <Field label={t('intel.zoneName')} value={zoneDraft.name} onChange={(name) => setZoneDraft({ ...zoneDraft, name })} />
        <Field label={t('intel.radius')} value={String(zoneDraft.radiusKm)} keyboardType="decimal-pad" onChange={(radius) => setZoneDraft({ ...zoneDraft, radiusKm: Number(radius) || 0.1 })} />
      </EntityForm>
      {overview.noFlyZones.map((zone) => (
        <View key={zone.id} style={styles.card}>
          <InfoRow title={zone.name} text={zone.reason} badge={`${zone.radiusKm}km`} danger />
          <MiniButton label={t('intel.removeZone')} danger onPress={() => action.mutate(() => deleteNoFlyZone(zone.id))} />
        </View>
      ))}
    </>
  )
}

function TrackingScreen({ trackingCode, setTrackingCode, onRefresh }: { trackingCode: string; setTrackingCode: (value: string) => void; onRefresh: () => void }) {
  const { t } = useI18n()
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
        <SectionTitle title={t('tracking.title')} text={t('tracking.text')} />
        <Field label={t('tracking.code')} value={trackingCode} onChange={setTrackingCode} autoCapitalize="characters" />
      </View>
      {tracking.isLoading && <LoadingCard text={t('tracking.loading')} />}
      {tracking.data && (
        <>
          <View style={styles.radarCard}>
            <Text style={styles.heroKicker}>{t('tracking.skyRadar')}</Text>
            <View style={styles.radar}>
              <View style={[styles.ring, styles.ringOne]} />
              <View style={[styles.ring, styles.ringTwo]} />
              <View style={[styles.ring, styles.ringThree]} />
              <View style={[styles.radarDrone, { left: `${radarPosition}%` }]} />
            </View>
            <View style={styles.metricGrid}>
              <Metric label={t('tracking.eta')} value={`${tracking.data.estimatedArrivalMinutes}m`} />
              <Metric label={t('tracking.progress')} value={`${progress}%`} />
            </View>
          </View>
          <View style={styles.card}>
            <InfoRow title={tracking.data.publicCode} text={`${tracking.data.mission.origin.label} → ${tracking.data.mission.destination.label}`} badge={tracking.data.mission.status} />
            <Progress value={progress} />
            {tracking.data.drone && <Text style={styles.muted}>Drone {tracking.data.drone.id} · Battery {tracking.data.drone.battery}%</Text>}
            <ButtonRow>
              <MiniButton label={t('tracking.lifecycle')} onPress={() => action.mutate(() => simulateMissionStep(tracking.data!.mission.id))} />
              <MiniButton label={t('tracking.telemetry')} onPress={() => action.mutate(() => advanceTelemetry(tracking.data!.mission.id))} />
            </ButtonRow>
          </View>
          <View style={styles.card}>
            <SectionTitle title={t('tracking.handover')} text={t('tracking.handoverText')} />
            <Text style={styles.muted}>{t('tracking.demoOtp')}: {tracking.data.demoConfirmationCode ?? tracking.data.mission.proofOfDeliveryCode ?? 'available in transit'}</Text>
            <Field label={t('tracking.recipientOtp')} value={otp} onChange={setOtp} keyboardType="number-pad" />
            <Pressable style={styles.primaryButton} onPress={() => action.mutate(() => confirmDelivery(tracking.data!.mission.id, otp))}>
              <Text style={styles.primaryText}>{t('tracking.confirm')}</Text>
            </Pressable>
          </View>
          <View style={styles.card}>
            <SectionTitle title={t('tracking.timeline')} text={t('tracking.timelineText')} />
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
  const { t } = useI18n()
  const action = useAction(onRefresh)
  return (
    <>
      <View style={styles.card}>
        <SectionTitle title={t('maintenance.title')} text={t('maintenance.text')} />
        <View style={styles.metricGrid}>
          <Metric label={t('maintenance.dueNow')} value={overview.analytics.maintenanceDue} />
          <Metric label={t('maintenance.delivered')} value={overview.analytics.deliveredMissions} />
        </View>
      </View>
      {overview.drones.map((drone) => {
        const due = drone.flightHours >= drone.nextServiceHours || drone.batteryHealth < 82
        return (
          <View key={drone.id} style={styles.card}>
            <InfoRow title={`${drone.id} · ${drone.model}`} text={`${drone.flightHours}h · ${drone.completedDeliveries} ${t('maintenance.delivered')}`} badge={due ? t('maintenance.due') : t('maintenance.ok')} danger={due} />
            <Progress value={Math.round(drone.batteryHealth)} />
            <Text style={styles.muted}>{t('maintenance.batteryHealth')} {drone.batteryHealth.toFixed(1)}% · {t('maintenance.nextService')} {drone.nextServiceHours}h</Text>
            <MiniButton label={t('maintenance.complete')} onPress={() => action.mutate(() => completeDroneService(drone.id))} />
          </View>
        )
      })}
    </>
  )
}

function AuditScreen({ overview }: { overview: Overview }) {
  const { t } = useI18n()
  return (
    <View style={styles.card}>
      <SectionTitle title={t('audit.title')} text={t('audit.text')} />
      {overview.auditEvents.map((event) => (
        <InfoRow key={event.id} title={event.action.replaceAll('_', ' ')} text={`${event.entityType}: ${event.entityId} · ${event.detail}`} badge={event.actor} />
      ))}
    </View>
  )
}

function useAction(onRefresh: () => void) {
  const { t } = useI18n()
  return useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onSuccess: () => onRefresh(),
    onError: (error) => Alert.alert(t('action.failedTitle'), error instanceof Error ? error.message : t('action.failedFallback')),
  })
}

function EntityForm({ title, text, busy, children, onSubmit }: { title: string; text: string; busy: boolean; children: React.ReactNode; onSubmit: () => void }) {
  const { t } = useI18n()
  return (
    <View style={styles.card}>
      <SectionTitle title={title} text={text} />
      {children}
      <Pressable style={styles.primaryButton} disabled={busy} onPress={onSubmit}>
        <Text style={styles.primaryText}>{busy ? t('common.working') : title}</Text>
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
  const { isRtl } = useI18n()
  return (
    <View style={[styles.infoRow, isRtl && styles.rtlRow, danger && styles.infoDanger]}>
      <View style={styles.flex}>
        <Text style={[styles.rowTitle, isRtl && styles.rtlText]}>{title}</Text>
        <Text style={[styles.muted, isRtl && styles.rtlText]}>{text}</Text>
      </View>
      {badge && <Text style={[styles.badge, danger && styles.badgeDanger]}>{badge}</Text>}
    </View>
  )
}

function ChoiceRow({
  label,
  items,
  active,
  onPick,
  getLabel,
}: {
  label: string
  items: string[]
  active: string
  onPick: (value: string) => void
  getLabel?: (value: string) => string
}) {
  const { isRtl } = useI18n()
  return (
    <View style={styles.field}>
      <Text style={[styles.label, isRtl && styles.rtlText]}>{label}</Text>
      <View style={styles.zoneGrid}>
        {items.map((item) => (
          <Pressable key={item} style={[styles.zone, active === item && styles.zoneActive]} onPress={() => onPick(item)}>
            <Text style={styles.zoneText}>{getLabel ? getLabel(item) : item}</Text>
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

function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()
  return (
    <View style={styles.languagePanel}>
      <Text style={styles.label}>{t('language.label')}</Text>
      <View style={styles.languageRow}>
        {languageOptions().map((option: Language) => (
          <Pressable
            key={option}
            style={[styles.languageButton, language === option && styles.languageActive]}
            onPress={() => setLanguage(option)}
          >
            <Text style={[styles.languageText, language === option && styles.languageTextActive]}>
              {t(`language.${option}`)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  const { isRtl } = useI18n()
  return (
    <View style={styles.metric}>
      <Text style={[styles.metricLabel, isRtl && styles.rtlText]}>{label}</Text>
      <Text style={[styles.metricValue, isRtl && styles.rtlText]}>{value}</Text>
    </View>
  )
}

function SectionTitle({ title, text }: { title: string; text: string }) {
  const { isRtl } = useI18n()
  return (
    <View style={styles.sectionTitle}>
      <Text style={[styles.sectionHeading, isRtl && styles.rtlText]}>{title}</Text>
      <Text style={[styles.muted, isRtl && styles.rtlText]}>{text}</Text>
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
  const { isRtl } = useI18n()
  return (
    <View style={styles.field}>
      <Text style={[styles.label, isRtl && styles.rtlText]}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        onChangeText={onChange}
        placeholderTextColor="#5f728b"
        style={[styles.input, isRtl && styles.rtlText]}
        value={value}
      />
      {hint && <Text style={[styles.hint, isRtl && styles.rtlText]}>{hint}</Text>}
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
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  rtlRow: { flexDirection: 'row-reverse' },
  languagePanel: {
    backgroundColor: 'rgba(255,255,255,.04)',
    borderColor: 'rgba(148,163,184,.15)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 9,
    marginBottom: 14,
    padding: 12,
  },
  languageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  languageButton: {
    backgroundColor: '#101f35',
    borderColor: 'rgba(148,163,184,.16)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  languageActive: { backgroundColor: '#22d3ee', borderColor: '#22d3ee' },
  languageText: { color: '#9eb1ca', fontSize: 12, fontWeight: '900' },
  languageTextActive: { color: '#061122' },
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
