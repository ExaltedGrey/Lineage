/**
 * Biblical Chronology Year Utilities
 *
 * Negative years represent B.C.E. (e.g., -4026 => 4026 B.C.E.)
 * Positive years represent C.E. (e.g., 29 => 29 C.E.)
 * IMPORTANT: There is NO year 0 between 1 B.C.E. (-1) and 1 C.E. (+1).
 *
 * We map calendar years to a continuous integer serial timeline:
 *   -4026 -> -4025
 *   -2    -> -1
 *   -1    -> 0
 *   +1    -> 1
 *   +29   -> 29
 * So span(from, to) = yearToSerial(to) - yearToSerial(from) is exact across the B.C.E./C.E. boundary!
 * Example: 455 B.C.E. (-455 -> -454) to 29 C.E. (+29 -> +29): 29 - (-454) = 483 years (69 prophetic weeks)!
 */

export function yearToSerial(year) {
  if (year == null) return null;
  return year < 0 ? year + 1 : year;
}

export function serialToYear(serial) {
  if (serial == null) return null;
  return serial <= 0 ? serial - 1 : serial;
}

export function formatYear(year) {
  if (year == null) return '';
  if (year < 0) return `${Math.abs(year)} B.C.E.`;
  return `${year} C.E.`;
}

export function formatYearShort(year) {
  if (year == null) return '';
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

export function formatDateRange(birthYear, deathYear, lifespan) {
  if (birthYear == null && deathYear == null) return null;
  const start = birthYear != null ? formatYear(birthYear) : '?';
  const end = deathYear != null ? formatYear(deathYear) : '?';
  const spanStr = lifespan != null ? ` · ${lifespan} yrs` : '';
  return `${start} – ${end}${spanStr}`;
}

export function yearsBetween(startYear, endYear) {
  if (startYear == null || endYear == null) return 0;
  return yearToSerial(endYear) - yearToSerial(startYear);
}

export function ageInYear(birthYear, targetYear) {
  if (birthYear == null || targetYear == null) return null;
  return yearToSerial(targetYear) - yearToSerial(birthYear);
}

export function isAliveInYear(birthYear, deathYear, targetYear) {
  if (birthYear == null || deathYear == null || targetYear == null) return false;
  const t = yearToSerial(targetYear);
  return t >= yearToSerial(birthYear) && t <= yearToSerial(deathYear);
}

export function overlapYears(personA, personB) {
  if (
    personA.birthYear == null ||
    personA.deathYear == null ||
    personB.birthYear == null ||
    personB.deathYear == null
  ) {
    return 0;
  }
  const start = Math.max(yearToSerial(personA.birthYear), yearToSerial(personB.birthYear));
  const end = Math.min(yearToSerial(personA.deathYear), yearToSerial(personB.deathYear));
  return Math.max(0, end - start);
}
