import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, CreditCard, HeartPulse, MapPinned, PlaneTakeoff, ShieldCheck, Wallet, Zap } from 'lucide-react'
import { createPublicOrder, quoteOrder } from './api'
import { LanguageSwitcher, useI18n } from './i18n'
import type { Location, PublicOrderInput } from './types'

type LandingProps = {
  onOpenControl: () => void
  onBook: () => void
}

type AddressFields = {
  city: string
  street: string
  houseNumber: string
  apartment: string
}

type AddressSuggestion = {
  id: string
  label: string
  latitude: number
  longitude: number
  city: string
  street: string
  houseNumber: string
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
  const [pickupAddress, setPickupAddress] = useState<AddressFields>({ city: 'Tel Aviv', street: 'Central Medical Lab', houseNumber: '', apartment: '' })
  const [destinationAddress, setDestinationAddress] = useState<AddressFields>({ city: 'Tel Aviv', street: 'North Clinic', houseNumber: '', apartment: '' })
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
            <AddressAutocomplete
              fields={pickupAddress}
              help={t('booking.pickupHelp')}
              location={draft.origin}
              onChange={(nextFields, nextLocation) => {
                setPickupAddress(nextFields)
                setDraft((current) => ({ ...current, origin: nextLocation }))
              }}
              title={t('booking.pickup')}
            />
            <AddressAutocomplete
              fields={destinationAddress}
              help={t('booking.destinationHelp')}
              location={draft.destination}
              onChange={(nextFields, nextLocation) => {
                setDestinationAddress(nextFields)
                setDraft((current) => ({ ...current, destination: nextLocation }))
              }}
              title={t('booking.destination')}
            />
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

function AddressAutocomplete({
  fields,
  help,
  location,
  onChange,
  title,
}: {
  fields: AddressFields
  help: string
  location: Location
  onChange: (fields: AddressFields, location: Location) => void
  title: string
}) {
  const { t } = useI18n()
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const searchQuery = useMemo(() => {
    const query = [fields.street, fields.houseNumber, fields.city].filter(Boolean).join(' ')
    return query.trim()
  }, [fields.city, fields.houseNumber, fields.street])

  useEffect(() => {
    if (searchQuery.length < 2) {
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsLoading(true)
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search')
        url.searchParams.set('format', 'json')
        url.searchParams.set('limit', '7')
        url.searchParams.set('addressdetails', '1')
        url.searchParams.set('countrycodes', 'il')
        url.searchParams.set('accept-language', 'he,en')
        url.searchParams.set('q', `${searchQuery}, Israel`)
        const response = await fetch(url, { signal: controller.signal })
        const data = (await response.json()) as Array<{
          osm_id: number
          display_name: string
          lat: string
          lon: string
          address?: Record<string, string>
        }>
        setSuggestions(data.map((item) => {
          const address = item.address ?? {}
          return {
            id: `${item.osm_id}-${item.lat}-${item.lon}`,
            label: item.display_name,
            latitude: Number(item.lat),
            longitude: Number(item.lon),
            city: address.city ?? address.town ?? address.village ?? address.suburb ?? fields.city,
            street: address.road ?? address.pedestrian ?? address.footway ?? address.neighbourhood ?? fields.street,
            houseNumber: address.house_number ?? fields.houseNumber,
          }
        }))
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }, 350)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [fields.city, fields.houseNumber, fields.street, searchQuery])

  const updateFields = (nextFields: AddressFields) => {
    onChange(nextFields, {
      ...location,
      label: formatAddressLabel(nextFields, t('booking.addressApartmentShort')),
    })
    setIsOpen(true)
  }

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    const nextFields = {
      city: suggestion.city,
      street: suggestion.street,
      houseNumber: suggestion.houseNumber,
      apartment: fields.apartment,
    }
    onChange(nextFields, {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      label: formatAddressLabel(nextFields, t('booking.addressApartmentShort')),
    })
    setIsOpen(false)
  }

  return (
    <fieldset className="address-card">
      <legend>{title}</legend>
      <p>{help}</p>
      <div className="address-grid">
        <label className="field-label">{t('booking.addressCity')}
          <input
            autoComplete="address-level2"
            required
            value={fields.city}
            onChange={(event) => updateFields({ ...fields, city: event.target.value })}
            onFocus={() => setIsOpen(true)}
            placeholder={t('booking.addressCityPlaceholder')}
          />
          <span>{t('booking.addressCityHelp')}</span>
        </label>
        <label className="field-label">{t('booking.addressStreet')}
          <input
            autoComplete="street-address"
            required
            value={fields.street}
            onChange={(event) => updateFields({ ...fields, street: event.target.value })}
            onFocus={() => setIsOpen(true)}
            placeholder={t('booking.addressStreetPlaceholder')}
          />
          <span>{t('booking.addressStreetHelp')}</span>
        </label>
        <label className="field-label">{t('booking.addressHouse')}
          <input
            autoComplete="address-line2"
            inputMode="numeric"
            required
            value={fields.houseNumber}
            onChange={(event) => updateFields({ ...fields, houseNumber: event.target.value })}
            onFocus={() => setIsOpen(true)}
            placeholder={t('booking.addressHousePlaceholder')}
          />
          <span>{t('booking.addressHouseHelp')}</span>
        </label>
        <label className="field-label">{t('booking.addressApartment')}
          <input
            autoComplete="address-line3"
            value={fields.apartment}
            onChange={(event) => updateFields({ ...fields, apartment: event.target.value })}
            placeholder={t('booking.addressApartmentPlaceholder')}
          />
          <span>{t('booking.addressApartmentHelp')}</span>
        </label>
      </div>
      <div className="address-summary">
        <MapPinned size={15} />
        <span>{formatAddressLabel(fields, t('booking.addressApartmentShort')) || t('booking.addressEmpty')}</span>
      </div>
      {isOpen && searchQuery.length >= 2 && (suggestions.length > 0 || isLoading) && (
        <div className="address-suggestions">
          {isLoading && <span>{t('booking.addressSearching')}</span>}
          {suggestions.map((suggestion) => (
            <button key={suggestion.id} type="button" onClick={() => selectSuggestion(suggestion)}>
              {suggestion.label}
            </button>
          ))}
        </div>
      )}
    </fieldset>
  )
}

function formatAddressLabel(fields: AddressFields, apartmentPrefix: string) {
  return [
    fields.street && fields.houseNumber ? `${fields.street} ${fields.houseNumber}` : fields.street,
    fields.apartment ? `${apartmentPrefix} ${fields.apartment}` : '',
    fields.city,
  ].filter(Boolean).join(', ')
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
