// Utilidades de tiempo (todo en UTC)
export const toDate = (v: string | number | Date) => new Date(v);
export const nowUtc = () => new Date(); // Node maneja Date en epoch UTC
export const minutes = (n: number) => n * 60 * 1000;
export const hours = (n: number) => n * 60 * 60 * 1000;
export const days = (n: number) => n * 24 * 60 * 60 * 1000;
