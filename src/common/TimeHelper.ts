/**
 * Конвертирует время из красноярского часового пояса (UTC+7) в UTC
 * @param dateString - Дата в формате "YYYY-MM-DD"
 * @param timeString - Время в формате "HH:mm"
 * @returns ISO 8601 строка с UTC временем (с суффиксом Z)
 */
export const convertKrasnoyarskToUTC = (dateString: string, timeString: string): string => {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  // Красноярск UTC+7, поэтому вычитаем 7 часов
  const utcHours = hours - 7;
  
  // Если часы стали отрицательными, это означает предыдущий день
  if (utcHours < 0) {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    const adjustedHours = 24 + utcHours;
    const datePart = date.toISOString().split('T')[0];
    return `${datePart}T${String(adjustedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}Z`;
  }
  
  // Если часы >= 24, это означает следующий день
  if (utcHours >= 24) {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    const adjustedHours = utcHours - 24;
    const datePart = date.toISOString().split('T')[0];
    return `${datePart}T${String(adjustedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}Z`;
  }
  
  return `${dateString}T${String(utcHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}Z`;
};
