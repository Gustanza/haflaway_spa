// Fills an approved Twilio Content Template body (pasted into a template's
// Notes — see WhatsAppTemplatesView.vue in haflaway_admin_spa and the org's
// own template drawer in OrganizationSettings.vue) with the values
// haflaway_server would actually send, so the send drawer's phone preview
// shows a real-looking message instead of raw {{1}}/{{2}} placeholders.
//
// Variable numbering and formatting mirror buildContentVariables() in
// haflaway_server/src/dispatch/whatsapp.js, and the date/time formatters are
// ported from haflaway_server/src/dispatch/messageTokens.js — keep in sync.
import { refineMessage } from './messageTokens.js'

const TEMPLATE_VAR = /\{\{\s*(\d+)\s*\}\}/g

export function hasTemplateVariables(text) {
  return typeof text === 'string' && /\{\{\s*\d+\s*\}\}/.test(text)
}

function toDate(value) {
  if (!value) return null
  const d = value.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

// Same as the server's formatEventDate: dd/MM/yyyy.
function formatEventDate(date) {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${date.getFullYear()}`
}

// Byte-for-byte port of the server's formatEventTime — Swahili always uses
// the Saa/Asubuhi-Mchana-... phrasing; English respects event.timeFormat.
function formatEventTime(time, language, timeFormat) {
  const hours = time.getHours()
  const minutes = String(time.getMinutes()).padStart(2, '0')
  if ((language || 'sw') === 'sw') {
    const swahiliHour = ((hours - 6 + 24) % 12) || 12
    let period
    if (hours >= 6 && hours < 12) period = 'Asubuhi'
    else if (hours >= 12 && hours < 15) period = 'Mchana'
    else if (hours >= 15 && hours < 18) period = 'Alasiri'
    else if (hours >= 18 && hours < 20) period = 'Jioni'
    else period = 'Usiku'
    return `Saa ${swahiliHour}:${minutes} ${period}`
  }
  if (timeFormat === '24h') return `${String(hours).padStart(2, '0')}:${minutes}`
  return `${hours % 12 || 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`
}

// Same as the server's resolveLocationTime: an optional "HH:mm" applied on
// top of the event's own date.
function resolveLocationTime(timeStr, fallback) {
  if (!timeStr || !fallback) return fallback
  const [h, m] = timeStr.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return fallback
  const resolved = new Date(fallback)
  resolved.setHours(h, m, 0, 0)
  return resolved
}

function flatten(value) {
  return String(value ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim()
}

// `attendee` is a real guest from this event when one is available (the
// first picked recipient, else the first in the pool); otherwise a generic
// stand-in. Returns { '1': value, ... }, with '' for anything the event
// hasn't set so the preview can flag it.
export function buildPreviewVariables({ event, eventId, attendee, customMessage, hasCard = true }) {
  const lang = event?.language ?? 'sw'
  const start = toDate(event?.startDate ?? event?.calendar?.[0]?.eventDate)
  const startTime = toDate(event?.startDate ?? event?.calendar?.[0]?.startTime) ?? start
  const fDate = start ? formatEventDate(start) : ''
  const venueTime = resolveLocationTime(event?.venueStartTime, startTime)
  const worshipTime = resolveLocationTime(event?.worshipStartTime, startTime)
  const fTime = venueTime ? formatEventTime(venueTime, lang, event?.timeFormat) : ''
  const fWorshipTime = worshipTime ? formatEventTime(worshipTime, lang, event?.timeFormat) : ''

  const guestName = attendee?.fullName || (lang === 'sw' ? 'Mgeni' : 'Guest')
  const attendeeId = attendee?.id ?? 'guest'
  const eventTokens = { eventname: event?.title ?? '', venue: event?.location ?? '', date: fDate, time: fTime }
  const refinedCustom = customMessage
    ? refineMessage(eventId, guestName, attendeeId, customMessage, '', undefined,
        attendee?.pledgedAmount ?? 0, attendee?.paidAmount ?? 0, eventTokens)
    : ''

  return {
    '1': flatten(guestName),
    '2': flatten(event?.title),
    '3': fDate,
    '4': flatten(event?.location),
    '5': fTime,
    // The card itself goes out as the message's image; its storage path is
    // meaningless to read, so the preview just labels it. A card-less send
    // passes '' here, same as the server.
    '6': hasCard ? (lang === 'sw' ? '[Kadi ya mwaliko]' : '[Invitation card]') : '',
    '7': `${eventId ?? ''}/${attendeeId}`,
    '8': flatten(refinedCustom),
    '9': flatten(event?.worshipLocation),
    '10': fWorshipTime,
  }
}

// What each variable is, for the "not set" flag — same numbering as the
// variable hints in the template forms.
const VARIABLE_LABELS = {
  1: 'Guest name', 2: 'Event title', 3: 'Date', 4: 'Venue', 5: 'Time',
  6: 'Card', 7: 'Event/Attendee ID', 8: 'Custom message', 9: 'Worship venue', 10: 'Worship time',
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// Escapes WhatsApp's formatting markers too, so a value like a guest name
// with an underscore can't open/close bold/italic in the surrounding body.
function escapeValue(s) {
  return escapeHtml(s).replace(/\*/g, '&#42;').replace(/_/g, '&#95;').replace(/~/g, '&#126;').replace(/`/g, '&#96;')
}

// Returns safe HTML: the body escaped, each {{n}} replaced by its value in a
// highlighted span (or a flagged "not set" span), then WhatsApp's own
// *bold* / _italic_ / ~strike~ / ```mono``` applied.
export function renderWhatsAppPreviewHtml(body, vars) {
  let html = escapeHtml(body).replace(TEMPLATE_VAR, (_, n) => {
    const key = String(Number(n))
    const value = vars[key]
    return value
      ? `<span class="em-preview-var">${escapeValue(value)}</span>`
      : `<span class="em-preview-var em-preview-var--missing">${VARIABLE_LABELS[key] ?? `{{${key}}}`} not set</span>`
  })
  html = html
    .replace(/```([\s\S]+?)```/g, '<code>$1</code>')
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~([^~\n]+)~/g, '<s>$1</s>')
  return html
}
