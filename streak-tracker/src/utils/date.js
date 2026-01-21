// Get "YYYY-MM-DD" in local time to ensure accurate streak tracking
export const getLocalDate = (date = new Date()) => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

// Check if two dates are the same calendar day (local time)
export const isSameDay = (d1, d2) => {
  return getLocalDate(d1) === getLocalDate(d2);
};

// Get yesterday's date string "YYYY-MM-DD"
export const getYesterdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return getLocalDate(date);
};
