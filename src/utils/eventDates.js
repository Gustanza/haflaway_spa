// Event start/end dates are stored as a NAIVE local wall-clock ISO string with
// no timezone — "2026-07-25T14:00:00.000" — matching exactly what the Flutter
// app writes: Dart's DateTime.toIso8601String() omits the offset for a local
// DateTime (see lib/top_destinations/eventz/create_event.dart).
//
// This is the convention every existing consumer already assumes:
//
//   • The Flutter app reads with DateTime.parse() and never calls .toLocal()
//     anywhere in lib/. A naive string parses to a local DateTime and renders
//     correctly; an absolute "…Z" string stays UTC and renders 3 hours early
//     in EAT. That was the bug — events created on the web looked 3 hours
//     behind on mobile, while mobile-created ones were fine.
//
//   • Cloud Functions render invitation date/time by extracting wall-clock
//     parts in Africa/Dar_es_Salaam, and the functions runtime is configured to
//     that zone, so a naive string round-trips correctly there too.
//
// The web used to write new Date(input).toISOString() — an absolute UTC instant
// — which is the odd one out. EAT observes no daylight saving, so a naive wall
// clock is unambiguous for this product's single-timezone audience.
//
// Note this applies only to event start/end dates, which are wall-clock
// appointments. Bookkeeping fields (createdAt, updatedAt) are genuine instants
// and should keep using toISOString().

const pad = (n) => String(n).padStart(2, '0')

/**
 * <input type="datetime-local"> value → the stored naive wall-clock string.
 * "2026-07-25T14:00" → "2026-07-25T14:00:00.000"
 *
 * The millisecond suffix matches Dart's output so the two writers produce
 * byte-identical shapes — the Flutter app runs Firestore range queries and
 * orderBy directly on this field, which compares these values as strings.
 */
export function toStoredEventDate(datetimeLocal) {
  if (!datetimeLocal) return null
  const d = new Date(datetimeLocal)
  if (Number.isNaN(d.getTime())) return null
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.000`
  )
}

/**
 * Stored value → "YYYY-MM-DDTHH:mm" for <input type="datetime-local">.
 *
 * Built from local getters rather than toISOString(), which is always UTC and
 * showed times ~3 hours behind for EAT organizers on every re-open. Handles
 * both shapes: naive strings, and the legacy "…Z" values already in Firestore
 * from before this fix (new Date() converts those back to local correctly).
 */
export function toDatetimeLocal(stored) {
  if (!stored) return ''
  const d = new Date(stored)
  if (Number.isNaN(d.getTime())) return ''
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  )
}
