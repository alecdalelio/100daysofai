export const IANATimeZones: string[] =
  (Intl as any).supportedValuesOf?.('timeZone') ?? [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Berlin',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Australia/Sydney',
  ]


