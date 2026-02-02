export const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfWeek(date) {
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(date.getDate() - day);
  return startOfDay(start);
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

export function getCalendarWeeks(endDate, totalDays = 365) {
  const end = startOfDay(endDate);
  const start = addDays(end, -(totalDays - 1));
  const calendarStart = startOfWeek(start);
  const weeks = [];
  let current = calendarStart;
  let week = [];

  while (current <= end) {
    week.push(current);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
    current = addDays(current, 1);
  }

  if (week.length) {
    while (week.length < 7) {
      week.push(current);
      current = addDays(current, 1);
    }
    weeks.push(week);
  }

  return weeks;
}

export function getMonthLabels(weeks) {
  const labels = [];
  let lastMonth = null;

  weeks.forEach((week) => {
    const month = week[0].getMonth();
    if (month !== lastMonth) {
      labels.push({ month, label: `${month + 1}月` });
      lastMonth = month;
    } else {
      labels.push({ month, label: '' });
    }
  });

  return labels;
}
