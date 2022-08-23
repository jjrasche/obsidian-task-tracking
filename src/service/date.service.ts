export function now (): Date { return new Date() }
export function nowIso (): string { return now().toISOString() }
export const from = (time: number) => new Date(time); 
export const min  = new Date(-8640000000000000);
export const max = new Date(8640000000000000);
export const isToday = function(date: Date): boolean {
    const today = new Date()
    return date.getDate() == today.getDate() &&
      date.getMonth() == today.getMonth() &&
      date.getFullYear() == today.getFullYear()
  }