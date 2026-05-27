import { type FormEvent, type ReactNode, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, HeartPulse, MapPinned, PlaneTakeoff, ShieldCheck, Zap } from 'lucide-react'
import { createPublicOrder, quoteOrder } from './api'
import type { PublicOrderInput } from './types'

type LandingProps = {
  onOpenControl: () => void
  onBook: () => void
}

export function LandingPage({ onOpenControl, onBook }: LandingProps) {
  return (
    <main className="landing">
      <header className="landing-nav">
        <div className="logo"><span className="logo-mark" /><div><strong>DroneOps</strong><small>NEXUS</small></div></div>
        <div><button className="ghost" onClick={onOpenControl}>Operations Console</button><button className="primary" onClick={onBook}>Book Delivery</button></div>
      </header>
      <section className="hero">
        <div>
          <p className="eyebrow">Autonomous Urban Logistics</p>
          <h1>Mission-critical delivery controlled by live intelligence.</h1>
          <p className="hero-copy">Weather-aware drone dispatch, medical cold-chain delivery and real-time operations visibility for modern cities.</p>
          <div className="hero-actions">
            <button className="primary" onClick={onBook}>Request a Delivery <ArrowRight size={17} /></button>
            <button className="ghost" onClick={onOpenControl}>Explore Control Center</button>
          </div>
        </div>
        <article className="hero-card">
          <div className="flight-line"><PlaneTakeoff /><span>Priority medical mission</span><b>READY</b></div>
          <h2>Tel Aviv Central <span>to</span> North Clinic</h2>
          <div className="hero-stats"><strong>6 min<small>ETA</small></strong><strong>94%<small>Battery</small></strong><strong>GO<small>Wind Gate</small></strong></div>
          <p><ShieldCheck size={16} /> Cold-chain monitoring and no-fly rerouting enabled.</p>
        </article>
      </section>
      <section className="feature-cards">
        <Feature icon={<HeartPulse />} title="Medical Priority" text="Temperature-controlled urgent shipments with dedicated handling." />
        <Feature icon={<MapPinned />} title="Smart Routes" text="Automatic bypass planning around protected airspace." />
        <Feature icon={<Zap />} title="Live Decisions" text="Wind-aware takeoff checks and forecast scheduling." />
      </section>
    </main>
  )
}

export function BookingPortal({ onBack, onOpenControl }: { onBack: () => void; onOpenControl: () => void }) {
  const [draft, setDraft] = useState<PublicOrderInput>({
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
  })
  const quote = useMutation({ mutationFn: quoteOrder })
  const order = useMutation({ mutationFn: createPublicOrder })

  function calculate(event: FormEvent) {
    event.preventDefault()
    quote.mutate(draft)
  }

  return (
    <main className="booking">
      <header className="landing-nav">
        <button className="ghost" onClick={onBack}>Back to DroneOps</button>
        <button className="ghost" onClick={onOpenControl}>Operations Console</button>
      </header>
      <section className="booking-layout">
        <div className="booking-heading">
          <p className="eyebrow">Customer Delivery Portal</p>
          <h1>Request a drone delivery</h1>
          <p>Get an instant route, ETA and price estimate. Medical deliveries include cold-chain controls.</p>
        </div>
        <form className="booking-form" onSubmit={calculate}>
          <h2>Shipment details</h2>
          <div className="booking-fields">
            <input required value={draft.senderName} onChange={(event) => setDraft({ ...draft, senderName: event.target.value })} placeholder="Sender name" />
            <input required type="email" value={draft.senderEmail} onChange={(event) => setDraft({ ...draft, senderEmail: event.target.value })} placeholder="Sender email" />
            <input required value={draft.senderPhone} onChange={(event) => setDraft({ ...draft, senderPhone: event.target.value })} placeholder="Sender phone" />
            <input required value={draft.recipientName} onChange={(event) => setDraft({ ...draft, recipientName: event.target.value })} placeholder="Recipient name" />
            <input required type="email" value={draft.recipientEmail} onChange={(event) => setDraft({ ...draft, recipientEmail: event.target.value })} placeholder="Recipient email" />
            <input required value={draft.recipientPhone} onChange={(event) => setDraft({ ...draft, recipientPhone: event.target.value })} placeholder="Recipient phone" />
            <input required value={draft.origin.label} onChange={(event) => setDraft({ ...draft, origin: { ...draft.origin, label: event.target.value } })} placeholder="Pickup location" />
            <input required value={draft.destination.label} onChange={(event) => setDraft({ ...draft, destination: { ...draft.destination, label: event.target.value } })} placeholder="Destination" />
            <input type="number" min="0.1" step="0.1" value={draft.payloadKg} onChange={(event) => setDraft({ ...draft, payloadKg: Number(event.target.value) })} />
            <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as PublicOrderInput['priority'] })}>
              <option value="standard">Standard priority</option><option value="urgent">Urgent priority</option><option value="critical">Critical priority</option>
            </select>
            <select value={draft.serviceType} onChange={(event) => setDraft({ ...draft, serviceType: event.target.value as PublicOrderInput['serviceType'] })}>
              <option value="standard">Standard delivery</option><option value="medical">Medical delivery</option>
            </select>
            <label className="check"><input type="checkbox" checked={draft.temperatureControlled} onChange={(event) => setDraft({ ...draft, temperatureControlled: event.target.checked })} /> Temperature controlled</label>
          </div>
          <button className="primary" disabled={quote.isPending}> {quote.isPending ? 'Calculating...' : 'Calculate Route & Price'} </button>
        </form>
        <article className="quote-card">
          <h2>Smart Quote</h2>
          {!quote.data && <p className="empty-copy">Fill in the request and calculate your delivery offer.</p>}
          {quote.data && <>
            <strong className="price">ILS {quote.data.priceIls}</strong>
            <div className="quote-stats"><span>{quote.data.distanceKm} km</span><span>{quote.data.estimatedMinutes} min ETA</span><span>{quote.data.serviceType}</span></div>
            <p className="route-note"><MapPinned size={15} /> {quote.data.routeNotice}</p>
            <button className="flight-button" disabled={order.isPending} onClick={() => order.mutate(draft)}>
              <PlaneTakeoff size={17} /> {order.isPending ? 'Submitting...' : 'Confirm Delivery Request'}
            </button>
          </>}
          {order.data && <div className="booking-success"><ShieldCheck /><strong>Request received</strong><p>Tracking: {order.data.mission.trackingCode}</p><small>{order.data.notificationPreview[0]}</small></div>}
        </article>
      </section>
    </main>
  )
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <article><span>{icon}</span><h2>{title}</h2><p>{text}</p></article>
}
