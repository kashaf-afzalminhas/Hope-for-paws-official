/**
 * Format a pet age + unit for display across adoption cards, details, and admin tables.
 * @param {number|string} age
 * @param {'days'|'months'|'years'|string} [ageUnit='years']
 */
export function formatPetAge(age, ageUnit = 'years') {
  if (age == null || age === '') return '';
  const n = Number(age);
  if (Number.isNaN(n)) return String(age);

  const unit = normalizeAgeUnit(ageUnit);
  if (unit === 'days') {
    return `${n} ${n === 1 ? 'day' : 'days'}`;
  }
  if (unit === 'months') {
    return `${n} ${n === 1 ? 'month' : 'months'}`;
  }
  return `${n} ${n === 1 ? 'year' : 'years'}`;
}

export const AGE_UNIT_OPTIONS = [
  { value: 'days', label: 'Days' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
];

export function normalizeAgeUnit(value) {
  if (value === 'days' || value === 'months' || value === 'years') return value;
  // Legacy "age" unit (and anything unknown) displays/saves as years
  return 'years';
}
