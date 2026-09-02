// Frontend port of functions/utils/messageTokens.js — kept in sync so a
// manually-sent message (device-native WhatsApp/SMS handoff, see
// EventMessages.vue) previews identically to what the backend would produce
// for the same campaign's SMS body. Supports "{{token}}" (current) and
// "@token" (legacy) syntax, same as the API-driven sends.

// Matches functions/utils/constants.js `hfspa` — the public-facing origin
// guest links must point to, regardless of which host the admin panel itself
// is served from.
const HFSPA = 'https://haflaway-f14aa.web.app'

// Event-level tokens — resolve once per event, not per recipient.
// event.startDate is a naive local wall-clock string (see src/utils/eventDates.js);
// `new Date(...)` parses it in the browser's local time, which is correct for
// this product's single-timezone (EAT) audience.
export function resolveEventTokens(event) {
  let date = ''
  let time = ''
  try {
    if (event?.startDate) {
      const d = new Date(event.startDate)
      if (!Number.isNaN(d.getTime())) {
        date = d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
        time = d.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })
      }
    }
  } catch {
    // leave date/time blank
  }
  return {
    eventname: event?.title ?? '',
    venue: event?.location ?? '',
    date,
    time,
  }
}

// Substitutes every {{token}} / @token pair into `message`. eventTokens is
// the object resolveEventTokens() returns (pass {} to skip event-level tokens).
export function refineMessage(eventId, fullName, passcode, message, cardUrl, cardName, pledgedAmount, paidAmount, eventTokens = {}) {
  const debt = Math.max(0, (pledgedAmount ?? 0) - (paidAmount ?? 0))
  const remit = `${HFSPA}/changia/${eventId}/${passcode}`
  const eventUrl = `${HFSPA}/events/${eventId}/${passcode}`
  const tokens = [
    // Attendee-level
    ['username', fullName],
    ['passcode', passcode],
    ['card', cardUrl],
    ['cname', cardName],
    ['pledge', pledgedAmount],
    ['paid', paidAmount],
    ['debt', debt],
    ['remit', remit],
    ['event', eventUrl],
    // Event-level
    ['eventname', eventTokens.eventname ?? ''],
    ['venue', eventTokens.venue ?? ''],
    ['date', eventTokens.date ?? ''],
    ['time', eventTokens.time ?? ''],
  ]
  let newMsg = message ?? ''
  for (const [key, val] of tokens) {
    newMsg = newMsg.replaceAll(`{{${key}}}`, val ?? '')
    newMsg = newMsg.replaceAll(`@${key}`, val ?? '')
  }
  return newMsg
}
