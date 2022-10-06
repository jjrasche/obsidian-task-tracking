export function now (): Date { return new Date() }
export function nowIso (): string { return now().toISOString() }
export const from = (time: number) => new Date(time); 
export const min  = new Date(-8640000000000000);
export const max = new Date(8640000000000000);
export const sameDay = function(date: Date, day: Date): boolean {
  return date.getDate() == day.getDate() &&
    date.getMonth() == day.getMonth() &&
    date.getFullYear() == day.getFullYear()
}
export const isToday = (date: Date): boolean => sameDay(date, new Date()); 