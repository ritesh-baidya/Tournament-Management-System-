/**
 * Returns the current date in local YYYY-MM-DD format (respecting user's local timezone)
 */
export function getLocalISODate(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the current time in local 12-hour format with AM/PM (e.g. "10:59 PM")
 */
export function getLocalTimeString(d = new Date()): string {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Formats an ISO string, timestamp, or Date into user-friendly local date (e.g. "Oct 30, 2026")
 */
export function formatLocalDate(isoOrDate?: string | Date | null): string {
  if (!isoOrDate) return 'N/A';
  try {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    if (isNaN(d.getTime())) return String(isoOrDate);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return String(isoOrDate);
  }
}

/**
 * Formats an ISO string, timestamp, or Date into local time (e.g. "10:59 PM")
 */
export function formatLocalTime(isoOrDate?: string | Date | null): string {
  if (!isoOrDate) return 'N/A';
  try {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    if (isNaN(d.getTime())) return String(isoOrDate);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return String(isoOrDate);
  }
}

/**
 * Formats an ISO string or Date into combined local date & time (e.g. "Oct 30, 2026, 10:59 PM")
 */
export function formatLocalDateTime(isoOrDate?: string | Date | null): string {
  if (!isoOrDate) return 'N/A';
  try {
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
    if (isNaN(d.getTime())) return String(isoOrDate);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return String(isoOrDate);
  }
}

export function formatDate(isoStr?: string | null): string {
  return formatLocalDateTime(isoStr);
}

export function maskSensitive(text?: string | null, visibleChars: number = 4): string {
  if (!text) return '—';
  if (text.length <= visibleChars) return text;
  return '•'.repeat(text.length - visibleChars) + text.slice(-visibleChars);
}

export function isValidDiscordSnowflake(id?: string | null): boolean {
  if (!id) return false;
  return /^\d{17,20}$/.test(id.trim());
}
