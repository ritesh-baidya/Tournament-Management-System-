export function formatDate(isoStr?: string | null): string {
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoStr;
  }
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
