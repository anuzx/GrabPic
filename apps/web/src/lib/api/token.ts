export const setToken = (t: string) => localStorage.setItem('token', t);

export const getToken = (): string | null => localStorage.getItem('token');

export const clearToken = () => localStorage.removeItem('token');
