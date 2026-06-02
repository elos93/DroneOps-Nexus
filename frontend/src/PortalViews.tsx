import { type FormEvent, type ReactNode, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, CreditCard, HeartPulse, MapPinned, PlaneTakeoff, ShieldCheck, Wallet, Zap } from 'lucide-react'
import { createPublicOrder, quoteOrder } from './api'
import { LanguageSwitcher, useI18n } from './i18n'
import type { PublicOrderInput } from './types'

type LandingProps = {
  onOpenControl: () => void
  onBook: () => void
}

export function LandingPage({ onOpenControl, onBook }: LandingProps) {
  const { t } = useI18n()
  return (
    <main className="landing">
      <header className="landing-nav">
        <div className="logo"><span className="logo-mark" /><div><strong>DroneOps</strong><small>NEXUS</small></div></div>
        <div><LanguageSwitcher /><button className="ghost" onClick={onOpenControl}>{t('landing.console')}</button><button className="primary" onClick={onBook}>{t('landing.book')}</button></div>
      </header>
      <section className="hero">
        <div>
          <p className="eyebrow">{t('landing.eyebrow')}</p>
          <h1>{t('landing.title')}</h1>
          <p className="hero-copy">{t('landing.copy')}</p>
          <div className="hero-actions">
            <button className="primary" onClick={onBook}>{t('landing.request')} <ArrowRight size={17} /></button>
            <button className="ghost" onClick={onOpenControl}>{t('landing.explore')}</button>
          </div>
        </div>
        <article className="hero-card">
          <div className="flight-line"><PlaneTakeoff /><span>{t('landing.priorityMission')}</span><b>{t('landing.ready')}</b></div>
          <h2>{t('landing.origin')} <span>{t('common.to')}</span> {t('landing.destination')}</h2>
          <div className="hero-stats"><strong>6 {t('landing.min')}<small>{t('landing.eta')}</small></strong><strong>94%<small>{t('landing.battery')}</small></strong><strong>GO<small>{t('landing.windGate')}</small></strong></div>
          <p><ShieldCheck size={16} /> {t('landing.coldChain')}</p>
        </article>
      </section>
      <section className="feature-cards">
        <Feature icon={<HeartPulse />} title={t('landing.medicalPriority')} text={t('landing.medicalText')} />
        <Feature icon={<MapPinned />} title={t('landing.smartRoutes')} text={t('landing.smartRoutesText')} />
        <Feature icon={<Zap />} title={t('landing.liveDecisions')} text={t('landing.liveDecisionsText')} />
      </section>
    </main>
  )
}

export function BookingPortal({ onBack, onOpenControl }: { onBack: () => void; onOpenControl: () => void }) {
  const { t } = useI18n()
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bit' | 'paypal'>('card')
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
        <button className="ghost" onClick={onBack}>{t('booking.back')}</button>
        <div><LanguageSwitcher /><button className="ghost" onClick={onOpenControl}>{t('landing.console')}</button></div>
      </header>
      <section className="booking-layout">
        <div className="booking-heading">
          <p className="eyebrow">{t('booking.eyebrow')}</p>
          <h1>{t('booking.title')}</h1>
          <p>{t('booking.copy')}</p>
        </div>
        <form className="booking-form" onSubmit={calculate}>
          <h2>{t('booking.shipment')}</h2>
          <div className="form-progress" aria-label={t('booking.stepsLabel')}>
            <span className="active">1 {t('booking.stepSender')}</span>
            <span>2 {t('booking.stepRecipient')}</span>
            <span>3 {t('booking.stepPayment')}</span>
          </div>
          <h3 className="form-section-title">{t('booking.senderSection')}</h3>
          <div className="booking-fields">
            <label className="field-label">{t('booking.senderName')}
              <input required value={draft.senderName} onChange={(event) => setDraft({ ...draft, senderName: event.target.value })} placeholder={t('booking.senderName')} />
              <span>{t('booking.senderNameHelp')}</span>
            </label>
            <label className="field-label">{t('booking.senderEmail')}
              <input required type="email" value={draft.senderEmail} onChange={(event) => setDraft({ ...draft, senderEmail: event.target.value })} placeholder={t('booking.senderEmail')} />
              <span>{t('booking.senderEmailHelp')}</span>
            </label>
            <label className="field-label">{t('booking.senderPhone')}
              <input required type="tel" inputMode="tel" value={draft.senderPhone} onChange={(event) => setDraft({ ...draft, senderPhone: event.target.value })} placeholder="050-1234567" />
              <span>{t('booking.senderPhoneHelp')}</span>
            </label>
          </div>
          <h3 className="form-section-title">{t('booking.recipientSection')}</h3>
          <div className="booking-fields">
            <label className="field-label">{t('booking.recipientName')}
              <input required value={draft.recipientName} onChange={(event) => setDraft({ ...draft, recipientName: event.target.value })} placeholder={t('booking.recipientName')} />
              <span>{t('booking.recipientNameHelp')}</span>
            </label>
            <label className="field-label">{t('booking.recipientEmail')}
              <input required type="email" value={draft.recipientEmail} onChange={(event) => setDraft({ ...draft, recipientEmail: event.target.value })} placeholder={t('booking.recipientEmail')} />
              <span>{t('booking.recipientEmailHelp')}</span>
            </label>
            <label className="field-label">{t('booking.recipientPhone')}
              <input required type="tel" inputMode="tel" value={draft.recipientPhone} onChange={(event) => setDraft({ ...draft, recipientPhone: event.target.value })} placeholder="050-7654321" />
              <span>{t('booking.recipientPhoneHelp')}</span>
            </label>
          </div>
          <h3 className="form-section-title">{t('booking.routeSection')}</h3>
          <div className="booking-fields">
            <label className="field-label">{t('booking.pickup')}
              <input required value={draft.origin.label} onChange={(event) => setDraft({ ...draft, origin: { ...draft.origin, label: event.target.value } })} placeholder={t('booking.pickup')} />
              <span>{t('booking.pickupHelp')}</span>
            </label>
            <label className="field-label">{t('booking.destination')}
              <input required value={draft.destination.label} onChange={(event) => setDraft({ ...draft, destination: { ...draft.destination, label: event.target.value } })} placeholder={t('booking.destination')} />
              <span>{t('booking.destinationHelp')}</span>
            </label>
            <label className="field-label">{t('booking.payloadKg')}
              <input type="number" min="0.1" step="0.1" value={draft.payloadKg} onChange={(event) => setDraft({ ...draft, payloadKg: Number(event.target.value) })} />
              <span>{t('booking.payloadHelp')}</span>
            </label>
            <label className="field-label">{t('booking.priority')}
              <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as PublicOrderInput['priority'] })}>
                <option value="standard">{t('booking.standardPriority')}</option><option value="urgent">{t('booking.urgentPriority')}</option><option value="critical">{t('booking.criticalPriority')}</option>
              </select>
              <span>{t('booking.priorityHelp')}</span>
            </label>
            <label className="field-label">{t('booking.deliveryType')}
              <select value={draft.serviceType} onChange={(event) => setDraft({ ...draft, serviceType: event.target.value as PublicOrderInput['serviceType'] })}>
                <option value="standard">{t('booking.standardDelivery')}</option><option value="medical">{t('booking.medicalDelivery')}</option>
              </select>
              <span>{t('booking.deliveryTypeHelp')}</span>
            </label>
            <label className="check"><input type="checkbox" checked={draft.temperatureControlled} onChange={(event) => setDraft({ ...draft, temperatureControlled: event.target.checked })} /> {t('booking.temperatureControlled')}</label>
          </div>
          <div className="payment-box">
            <h3>{t('booking.paymentTitle')}</h3>
            <p>{t('booking.paymentCopy')}</p>
            <div className="payment-options">
              <PaymentOption active={paymentMethod === 'card'} icon={<CreditCard size={18} />} title={t('booking.payCard')} text={t('booking.payCardHelp')} onClick={() => setPaymentMethod('card')} />
              <PaymentOption active={paymentMethod === 'bit'} icon={<Wallet size={18} />} title={t('booking.payBit')} text={t('booking.payBitHelp')} onClick={() => setPaymentMethod('bit')} />
              <PaymentOption active={paymentMethod === 'paypal'} icon={<Wallet size={18} />} title={t('booking.payPaypal')} text={t('booking.payPaypalHelp')} onClick={() => setPaymentMethod('paypal')} />
            </div>
            <small>{t('booking.paymentDemo')}</small>
          </div>
          <button className="primary" disabled={quote.isPending}> {quote.isPending ? t('booking.calculating') : t('booking.calculate')} </button>
        </form>
        <article className="quote-card">
          <h2>{t('booking.smartQuote')}</h2>
          {!quote.data && <p className="empty-copy">{t('booking.emptyQuote')}</p>}
          {quote.data && <>
            <strong className="price">ILS {quote.data.priceIls}</strong>
            <div className="quote-stats"><span>{quote.data.distanceKm} {t('common.km')}</span><span>{quote.data.estimatedMinutes} {t('common.min')} {t('common.eta')}</span><span>{t(`status.${quote.data.serviceType}`)}</span><span>{t(`booking.payment.${paymentMethod}`)}</span></div>
            <p className="route-note"><MapPinned size={15} /> {quote.data.routeNotice}</p>
            <button className="flight-button" disabled={order.isPending} onClick={() => order.mutate(draft)}>
              <PlaneTakeoff size={17} /> {order.isPending ? t('booking.confirming') : t('booking.confirm')}
            </button>
          </>}
          {order.data && <div className="booking-success"><ShieldCheck /><strong>{t('booking.received')}</strong><p>{t('booking.tracking')}: {order.data.mission.trackingCode}</p><small>{order.data.notificationPreview[0]}</small></div>}
        </article>
      </section>
    </main>
  )
}

function PaymentOption({ active, icon, title, text, onClick }: { active: boolean; icon: ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" className={`payment-option ${active ? 'active' : ''}`} onClick={onClick}>
      <span>{icon}</span>
      <strong>{title}</strong>
      <small>{text}</small>
    </button>
  )
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <article><span>{icon}</span><h2>{title}</h2><p>{text}</p></article>
}
