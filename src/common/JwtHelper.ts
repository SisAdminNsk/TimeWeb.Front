/**
 * Декодирует JWT токен и извлекает UserId из payload
 * @param token - JWT токен
 * @returns UserId или null если токен невалиден
 */
export const getIdFromJwt = (token: string): string => {

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const decoded = atob(padded);
    const payloadObj = JSON.parse(decoded);

    return payloadObj.UserId;
};