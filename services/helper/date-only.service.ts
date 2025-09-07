export const toDateOnly = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// use toDateOnly(dueDate) / toDateOnly(endDate)

export const isBefore = (a: string | Date, b: string | Date) => {
  const x = new Date(a);
  x.setHours(0, 0, 0, 0);
  const y = new Date(b);
  y.setHours(0, 0, 0, 0);
  return x.getTime() < y.getTime();
}

export const isAfter = (a: string | Date, b: string | Date) => {
  const x = new Date(a);
  x.setHours(0, 0, 0, 0);
  const y = new Date(b);
  y.setHours(0, 0, 0, 0);
  return x.getTime() > y.getTime();
}
