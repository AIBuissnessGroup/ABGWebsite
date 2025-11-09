const EASTERN_TIMEZONE = 'America/New_York';

const easternInputFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: EASTERN_TIMEZONE,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

const defaultEasternFormatterOptions: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

function getTimeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);

  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      lookup[part.type] = part.value;
    }
  }

  const asUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second),
  );

  return (asUtc - date.getTime()) / 60000;
}

export function formatUtcDateInEastern(
  iso?: string,
  options: Intl.DateTimeFormatOptions = defaultEasternFormatterOptions,
  appendZoneLabel = true,
): string {
  if (!iso) return 'Not set';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIMEZONE,
    hour12: true,
    ...options,
  });

  const formatted = formatter.format(new Date(iso));
  return appendZoneLabel ? `${formatted} ET` : formatted;
}

export function utcToEasternInput(iso?: string): string {
  if (!iso) return '';
  const formatted = easternInputFormatter.format(new Date(iso));
  return formatted.replace(' ', 'T');
}

export function easternInputToUtc(input: string): string {
  if (!input) return '';

  const [datePart, timePart] = input.split('T');
  if (!datePart || !timePart) {
    throw new Error('Invalid date input');
  }

  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  const guessUtc = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = getTimeZoneOffsetMinutes(guessUtc, EASTERN_TIMEZONE);
  const actualUtc = new Date(guessUtc.getTime() - offset * 60000);
  return actualUtc.toISOString();
}

export function getEasternDateKey(iso?: string): string {
  const inputValue = utcToEasternInput(iso);
  return inputValue ? inputValue.split('T')[0] : '';
}

export { EASTERN_TIMEZONE };
