export const toDateOnly = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
// use toDateOnly(dueDate) / toDateOnly(endDate)
