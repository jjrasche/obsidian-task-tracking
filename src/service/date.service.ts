export function now (): Date { return new Date() }
export const from = (time: number) => new Date(time); 
export const min  = new Date(-8640000000000000);
export const max = new Date(8640000000000000);
