import { DateTime } from 'luxon'

export function nextEligiblePublish(tsz: string, nowISO?: string, graceHours = 3) {
  const tz = tsz || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const now = (nowISO ? DateTime.fromISO(nowISO) : DateTime.now()).setZone(tz)
  const boundary = now.startOf('day').plus({ hours: graceHours })
  const next = now < boundary ? boundary : boundary.plus({ days: 1 })
  return { tz, nextISO: next.toISO(), pretty: next.toFormat('EEE, LLL d • h:mm a ZZZZ') }
}


