import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  subMonths,
  isWithinInterval,
  parseISO,
} from 'date-fns';

export const formatDate      = (d) => format(typeof d === 'string' ? parseISO(d) : d, 'MMM d, yyyy');
export const formatShortDate = (d) => format(typeof d === 'string' ? parseISO(d) : d, 'MMM d');
export const formatMonthYear = (d) => format(typeof d === 'string' ? parseISO(d) : d, 'MMMM yyyy');
export const formatISO       = (d) => format(typeof d === 'string' ? parseISO(d) : d, 'yyyy-MM-dd');

/** Current calendar month range */
export const getMonthRange = (monthsAgo = 0) => {
  const ref = subMonths(new Date(), monthsAgo);
  return { start: startOfMonth(ref), end: endOfMonth(ref) };
};

/** FIX #5 — Current ISO week range (Mon–Sun) */
export const getWeekRange = () => {
  const now = new Date();
  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
};

/** FIX #5 — Current calendar year range */
export const getYearRange = () => {
  const now = new Date();
  return { start: startOfYear(now), end: endOfYear(now) };
};

/**
 * FIX #5 — Returns the correct date range for a given budget period.
 * Budgets with period 'weekly' or 'yearly' were previously always using the
 * monthly range, causing incorrect spent calculations.
 */
export const getRangeForPeriod = (period) => {
  if (period === 'weekly')  return getWeekRange();
  if (period === 'yearly')  return getYearRange();
  return getMonthRange(0); // default: monthly
};

export const isInRange = (dateStr, start, end) =>
  isWithinInterval(parseISO(dateStr), { start, end });

export const getLast6MonthLabels = () =>
  Array.from({ length: 6 }, (_, i) =>
    format(subMonths(new Date(), 5 - i), 'MMM yyyy')
  );

export const groupTransactionsByMonth = (transactions) => {
  const groups = {};
  transactions.forEach((t) => {
    const key = format(parseISO(t.date), 'MMM yyyy');
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  return groups;
};
