// src/utils/dateTimeUtils.ts

/**
 * Formats party size, date, and time into a display string
 * Examples:
 * - "2 • Now" (today, ASAP)
 * - "4 • 19:00" (today, specific time)
 * - "2 • Tomorrow 18:30"
 * - "6 • Jan 15 20:00"
 */
export const formatPartyDateTime = (
  partySize: number,
  selectedDate: Date,
  selectedTime: string
): string => {
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  if (isToday && selectedTime === 'ASAP') {
    return `${partySize} • Now`;
  } else if (isToday) {
    return `${partySize} • ${selectedTime}`;
  } else {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = selectedDate.toDateString() === tomorrow.toDateString();

    const dateStr = isTomorrow
      ? 'Tomorrow'
      : selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${partySize} • ${dateStr} ${selectedTime}`;
  }
};

/**
 * Formats a date to display format
 * Examples:
 * - "Today"
 * - "Tomorrow"
 * - "Wed, Dec 25"
 */
export const formatDateDisplay = (date: Date): string => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
};