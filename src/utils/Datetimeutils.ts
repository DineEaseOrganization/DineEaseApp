// src/utils/dateTimeUtils.ts

const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const getDateParts = (date: Date) => ({
  day: date.getDate(),
  monthShort: MONTHS_SHORT[date.getMonth()],
  monthLong: MONTHS_LONG[date.getMonth()],
  weekdayShort: WEEKDAYS_SHORT[date.getDay()],
  weekdayLong: WEEKDAYS_LONG[date.getDay()],
  year: date.getFullYear(),
});

export const formatDateDayMonth = (date: Date): string => {
  const { day, monthShort } = getDateParts(date);
  return `${day} ${monthShort}`;
};

export const formatDateDayMonthYear = (date: Date): string => {
  const { day, monthShort, year } = getDateParts(date);
  return `${day} ${monthShort} ${year}`;
};

export const formatDateDayMonthYearLong = (date: Date): string => {
  const { day, monthLong, year } = getDateParts(date);
  return `${day} ${monthLong} ${year}`;
};

export const formatDateWeekdayShortDayMonth = (date: Date): string => {
  const { weekdayShort, day, monthShort } = getDateParts(date);
  return `${weekdayShort}, ${day} ${monthShort}`;
};

export const formatDateWeekdayShortDayMonthYear = (date: Date): string => {
  const { weekdayShort, day, monthShort, year } = getDateParts(date);
  return `${weekdayShort}, ${day} ${monthShort} ${year}`;
};

export const formatDateWeekdayLongDayMonthYear = (date: Date): string => {
  const { weekdayLong, day, monthLong, year } = getDateParts(date);
  return `${weekdayLong}, ${day} ${monthLong} ${year}`;
};

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

    const dateStr = isTomorrow ? 'Tomorrow' : formatDateDayMonth(selectedDate);
    return `${partySize} • ${dateStr} • ${selectedTime}`;
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
    return formatDateWeekdayShortDayMonth(date);
  }
};
