import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { confirmDelivery, createPublicOrder, getOverview, getTracking, quoteOrder } from './api'
import type { PublicOrderInput } from './types'

type Screen = 'home' | 'book' | 'track'
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

export function DroneOpsMobile() {
  const [screen, setScreen] = useState<Screen>('home')
  const [trackingCode, setTrackingCode] = useState('TRACK-MS207')

  return (
    <LinearGradient colors={['#061122', '#081a2e', '#061122']} style={styles.app}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoMark} />
          <View>
            <Text style={styles.eyebrow}>DRONEOPS NEXUS</Text>
            <Text style={styles.title}>Mobile Command</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <Tab active={screen === 'home'} label="Dashboard" onPress={() => setScreen('home')} />
          <Tab active={screen === 'book'} label="Book" onPress={() => setScreen('book')} />
          <Tab active={screen === 'track'} label="Track" onPress={() => setScreen('track')} />
        </View>

        {screen === 'home' && <HomeScreen />}
        {screen === 'book' && <BookingScreen onTrack={(code) => { setTrackingCode(code); setScreen('track') }} />}
        {screen === 'track' && <TrackingScreen trackingCode={trackingCode} setTrackingCode={setTrackingCode} />}
      </ScrollView>
    </LinearGradient>
  )
}

function HomeScreen() {
  const overview = useQuery({ queryKey: ['mobile-overview'], queryFn: getOverview, refetchInterval: 8000 })

  if (overview.isLoading) return <LoadingCard text="Connecting to live fleet..." />
  if (!overview.data) return <EmptyCard text="Could not load fleet data." />

  const ready = overview.data.drones.filter((drone) => drone.status === 'available')
  const active = overview.data.drones.filter((drone) => drone.status === 'mission')

  return (
    <View style={styles.stack}>
      <View style={styles.heroCard}>
        <Text style={styles.heroKicker}>Live fleet intelligence</Text>
        <Text style={styles.heroTitle}>Android control layer for safer drone delivery.</Text>
        <Text style={styles.heroText}>Book, monitor, verify and hand off deliveries from a real mobile app connected to your DroneOps API.</Text>
      </View>

      <View style={styles.metricGrid}>
        <Metric label="Drones" value={overview.data.metrics.totalDrones} />
        <Metric label="Ready" value={ready.length} />
        <Metric label="In air" value={active.length} />
        <Metric label="Avg battery" value={`${overview.data.metrics.averageBattery}%`} />
      </View>

      <View style={styles.card}>
        <SectionTitle title="Fleet Cards" text="Mobile-ready micro dashboards" />
        {overview.data.drones.slice(0, 4).map((drone) => (
          <View key={drone.id} style={styles.droneRow}>
            <View style={[styles.statusDot, styles[drone.status]]} />
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{drone.id}</Text>
              <Text style={styles.muted}>{drone.model}</Text>
              <View style={styles.batteryTrack}><View style={[styles.batteryFill, { width: `${drone.battery}%` }]} /></View>
            </View>
            <Text style={styles.batteryText}>{drone.battery}%</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function BookingScreen({ onTrack }: { onTrack: (code: string) => void }) {
  const [order, setOrder] = useState<PublicOrderInput>(initialOrder)
  const [landingZone, setLandingZone] = useState<LandingZone>('Back yard')
  const quote = useMutation({ mutationFn: quoteOrder })
  const createOrder = useMutation({
    mutationFn: createPublicOrder,
    onSuccess: (result) => onTrack(result.mission.id),
  })

  const update = (field: keyof PublicOrderInput, value: string | number | boolean) => {
    setOrder((current) => ({ ...current, [field]: value }))
  }

  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <SectionTitle title="Book Drone Delivery" text="Customer flow optimized for Android" />
        <Field label="Sender" value={order.senderName} onChange={(value) => update('senderName', value)} />
        <Field label="Sender phone" value={order.senderPhone} onChange={(value) => update('senderPhone', value)} keyboardType="phone-pad" />
        <Field label="Recipient" value={order.recipientName} onChange={(value) => update('recipientName', value)} />
        <Field label="Recipient phone" value={order.recipientPhone} onChange={(value) => update('recipientPhone', value)} keyboardType="phone-pad" />
        <Field label="Pickup" value={order.origin.label} onChange={(value) => setOrder((current) => ({ ...current, origin: { ...current.origin, label: value } }))} />
        <Field label="Destination" value={order.destination.label} onChange={(value) => setOrder((current) => ({ ...current, destination: { ...current.destination, label: value } }))} />
        <Field label="Payload kg" value={String(order.payloadKg)} onChange={(value) => update('payloadKg', Number(value) || 0.1)} keyboardType="decimal-pad" />

        <Text style={styles.label}>Landing zone</Text>
        <View style={styles.zoneGrid}>
          {(['Back yard', 'Roof', 'Entrance', 'Balcony'] as LandingZone[]).map((zone) => (
            <Pressable key={zone} style={[styles.zone, landingZone === zone && styles.zoneActive]} onPress={() => setLandingZone(zone)}>
              <Text style={styles.zoneText}>{zone}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.primaryButton} onPress={() => quote.mutate(order)}>
          <Text style={styles.primaryText}>{quote.isPending ? 'Calculating...' : 'Calculate Route & Price'}</Text>
        </Pressable>
      </View>

      {quote.data && (
        <View style={styles.quoteCard}>
          <Text style={styles.heroKicker}>Smart quote</Text>
          <Text style={styles.price}>ILS {quote.data.priceIls}</Text>
          <Text style={styles.heroText}>{quote.data.distanceKm} km | {quote.data.estimatedMinutes} min ETA | {landingZone}</Text>
          <Text style={styles.muted}>{quote.data.routeNotice}</Text>
          <Pressable style={styles.flightButton} onPress={() => createOrder.mutate(order)}>
            <Text style={styles.flightText}>{createOrder.isPending ? 'Submitting...' : 'Confirm Delivery Request'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

function TrackingScreen({ trackingCode, setTrackingCode }: { trackingCode: string; setTrackingCode: (value: string) => void }) {
  const [otp, setOtp] = useState('')
  const tracking = useQuery({
    queryKey: ['mobile-tracking', trackingCode],
    queryFn: () => getTracking(trackingCode),
    enabled: trackingCode.length > 2,
  })
  const confirmation = useMutation({
    mutationFn: () => confirmDelivery(tracking.data?.mission.id ?? trackingCode, otp),
    onSuccess: () => tracking.refetch(),
  })

  const progress = tracking.data?.mission.progressPercent ?? 0
  const radarPosition = useMemo(() => Math.min(86, 16 + progress * 0.7), [progress])

  return (
    <View style={styles.stack}>
      <View style={styles.card}>
        <SectionTitle title="Track Delivery" text="Use tracking code or mission ID" />
        <Field label="Tracking code" value={trackingCode} onChange={setTrackingCode} autoCapitalize="characters" />
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
              <Metric label="Air time" value={`${tracking.data.estimatedArrivalMinutes}m`} />
              <Metric label="Altitude" value="45m" />
            </View>
          </View>

          <View style={styles.card}>
            <SectionTitle title={tracking.data.publicCode} text={`${tracking.data.mission.origin.label} → ${tracking.data.mission.destination.label}`} />
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
            <Text style={styles.heroText}>{progress}% complete | {tracking.data.mission.status}</Text>
            {tracking.data.drone && <Text style={styles.muted}>Drone {tracking.data.drone.id} | Battery {tracking.data.drone.battery}%</Text>}
          </View>

          <View style={styles.card}>
            <SectionTitle title="Secure Handover" text="OTP / QR-style release confirmation" />
            <Text style={styles.muted}>Demo OTP: {tracking.data.demoConfirmationCode ?? tracking.data.mission.proofOfDeliveryCode ?? 'available in transit'}</Text>
            <Field label="Recipient OTP" value={otp} onChange={setOtp} keyboardType="number-pad" />
            <Pressable style={styles.primaryButton} onPress={() => confirmation.mutate()}>
              <Text style={styles.primaryText}>{confirmation.isPending ? 'Confirming...' : 'Confirm Delivery'}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
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

function Field({
  label,
  value,
  onChange,
  keyboardType,
  autoCapitalize,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad' | 'phone-pad'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
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
  app: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 42,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
    marginBottom: 20,
    marginTop: 8,
  },
  logoMark: {
    backgroundColor: '#22d3ee',
    borderRadius: 16,
    height: 48,
    shadowColor: '#22d3ee',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    width: 48,
  },
  eyebrow: {
    color: '#22d3ee',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  title: {
    color: '#f5f9ff',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1.4,
  },
  tabs: {
    backgroundColor: 'rgba(255,255,255,.04)',
    borderColor: 'rgba(148,163,184,.15)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
    padding: 6,
  },
  tab: {
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12,
  },
  tabActive: {
    backgroundColor: '#22d3ee',
  },
  tabText: {
    color: '#8fa3bd',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#061122',
  },
  stack: {
    gap: 14,
  },
  heroCard: {
    backgroundColor: 'rgba(13,25,44,.88)',
    borderColor: 'rgba(34,211,238,.18)',
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
  },
  heroKicker: {
    color: '#22d3ee',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#f5f9ff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1.3,
    lineHeight: 31,
    marginBottom: 10,
  },
  heroText: {
    color: '#9eb1ca',
    fontSize: 14,
    lineHeight: 22,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metric: {
    backgroundColor: 'rgba(13,25,44,.9)',
    borderColor: 'rgba(148,163,184,.14)',
    borderRadius: 18,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: '46%',
    padding: 16,
  },
  metricLabel: {
    color: '#7f93ad',
    fontSize: 11,
    marginBottom: 8,
  },
  metricValue: {
    color: '#f5f9ff',
    fontSize: 25,
    fontWeight: '900',
  },
  card: {
    backgroundColor: 'rgba(13,25,44,.94)',
    borderColor: 'rgba(148,163,184,.15)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 13,
    padding: 18,
  },
  sectionTitle: {
    gap: 5,
    marginBottom: 2,
  },
  sectionHeading: {
    color: '#f5f9ff',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  muted: {
    color: '#8297b2',
    fontSize: 12,
    lineHeight: 18,
  },
  flex: {
    flex: 1,
  },
  droneRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(16,31,53,.62)',
    borderColor: 'rgba(148,163,184,.1)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 13,
  },
  statusDot: {
    borderRadius: 999,
    height: 9,
    width: 9,
  },
  available: {
    backgroundColor: '#22c55e',
  },
  charging: {
    backgroundColor: '#f59e0b',
  },
  mission: {
    backgroundColor: '#22d3ee',
  },
  rowTitle: {
    color: '#f5f9ff',
    fontSize: 14,
    fontWeight: '900',
  },
  batteryTrack: {
    backgroundColor: 'rgba(255,255,255,.08)',
    borderRadius: 999,
    height: 7,
    marginTop: 8,
    overflow: 'hidden',
  },
  batteryFill: {
    backgroundColor: '#22d3ee',
    borderRadius: 999,
    height: '100%',
  },
  batteryText: {
    color: '#dce9f8',
    fontSize: 12,
    fontWeight: '800',
  },
  field: {
    gap: 7,
  },
  label: {
    color: '#8fa3bd',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#101f35',
    borderColor: 'rgba(148,163,184,.18)',
    borderRadius: 13,
    borderWidth: 1,
    color: '#f5f9ff',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  zoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  zone: {
    backgroundColor: '#101f35',
    borderColor: 'rgba(148,163,184,.16)',
    borderRadius: 13,
    borderWidth: 1,
    minWidth: '47%',
    padding: 12,
  },
  zoneActive: {
    backgroundColor: 'rgba(34,211,238,.11)',
    borderColor: '#22d3ee',
  },
  zoneText: {
    color: '#dce9f8',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#22d3ee',
    borderRadius: 14,
    paddingVertical: 15,
  },
  primaryText: {
    color: '#061122',
    fontSize: 14,
    fontWeight: '900',
  },
  quoteCard: {
    backgroundColor: 'rgba(34,211,238,.1)',
    borderColor: 'rgba(34,211,238,.25)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  price: {
    color: '#f5f9ff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -2,
  },
  flightButton: {
    alignItems: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 15,
  },
  flightText: {
    color: '#f5f9ff',
    fontSize: 14,
    fontWeight: '900',
  },
  radarCard: {
    backgroundColor: 'rgba(13,25,44,.94)',
    borderColor: 'rgba(34,211,238,.18)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 13,
    padding: 18,
  },
  radar: {
    alignItems: 'center',
    backgroundColor: 'rgba(3,9,20,.45)',
    borderColor: 'rgba(34,211,238,.15)',
    borderRadius: 20,
    borderWidth: 1,
    height: 250,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ring: {
    borderColor: 'rgba(34,211,238,.2)',
    borderRadius: 999,
    borderWidth: 1,
    position: 'absolute',
  },
  ringOne: { height: 82, width: 82 },
  ringTwo: { height: 146, width: 146 },
  ringThree: { height: 214, width: 214 },
  radarDrone: {
    backgroundColor: '#22d3ee',
    borderRadius: 999,
    height: 14,
    position: 'absolute',
    top: '48%',
    width: 14,
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,.08)',
    borderRadius: 999,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#22d3ee',
    borderRadius: 999,
    height: '100%',
  },
  loadingText: {
    color: '#9eb1ca',
    marginTop: 10,
    textAlign: 'center',
  },
})
