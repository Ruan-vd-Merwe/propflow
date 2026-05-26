import type { IdVerification, Gender, CitizenType } from './types'

/**
 * Validate a South African ID number (13 digits).
 *
 * Format: YYMMDDSSSSCAZ
 *  YY     = birth year (last 2 digits)
 *  MM     = birth month
 *  DD     = birth day
 *  SSSS   = sequence number (0000–4999 = female, 5000–9999 = male)
 *  C      = citizenship (0 = SA citizen, 1 = permanent resident)
 *  A      = historical/race digit (ignored)
 *  Z      = Luhn checksum digit
 */
export function validateSAId(raw: string): IdVerification {
  const id = raw.replace(/\s/g, '')
  const errors: string[] = []

  if (!/^\d{13}$/.test(id)) {
    return {
      valid: false,
      checksumValid: false,
      dob: null,
      gender: null,
      citizenType: null,
      ageInYears: null,
      errors: ['ID number must be exactly 13 digits'],
    }
  }

  // ── Parse components ────────────────────────────────────────────────────────
  const yy       = id.substring(0, 2)
  const mm       = id.substring(2, 4)
  const dd       = id.substring(4, 6)
  const seq      = parseInt(id.substring(6, 10), 10)
  const cDigit   = id.charAt(10)   // citizenship digit
  // id.charAt(11) is the historical race digit — ignored
  // id.charAt(12) is the Luhn check digit

  // Determine century: if YY > current 2-digit year → born in 1900s
  const currentYY = new Date().getFullYear() % 100
  const fullYear  = parseInt(yy, 10) > currentYY ? 1900 + parseInt(yy, 10) : 2000 + parseInt(yy, 10)

  const monthNum = parseInt(mm, 10)
  const dayNum   = parseInt(dd, 10)

  if (monthNum < 1 || monthNum > 12) errors.push('Invalid month in ID number')
  if (dayNum   < 1 || dayNum   > 31) errors.push('Invalid day in ID number')

  // Build DOB string and age
  let dob: string | null = null
  let ageInYears: number | null = null

  if (errors.length === 0) {
    dob = `${fullYear}-${mm}-${dd}`

    const dobDate = new Date(fullYear, monthNum - 1, dayNum)
    // Guard against invalid dates like Feb 30
    if (
      dobDate.getFullYear() !== fullYear ||
      dobDate.getMonth()    !== monthNum - 1 ||
      dobDate.getDate()     !== dayNum
    ) {
      errors.push('ID number contains an invalid calendar date')
      dob = null
    } else {
      const today = new Date()
      let age = today.getFullYear() - dobDate.getFullYear()
      const mDiff = today.getMonth() - dobDate.getMonth()
      if (mDiff < 0 || (mDiff === 0 && today.getDate() < dobDate.getDate())) age--
      ageInYears = age

      if (age < 18)  errors.push('Applicant appears to be under 18')
      if (age > 120) errors.push('ID number implies an age over 120 — likely invalid')
    }
  }

  // ── Gender from sequence number ─────────────────────────────────────────────
  const gender: Gender = seq >= 5000 ? 'male' : 'female'

  // ── Citizenship ─────────────────────────────────────────────────────────────
  const citizenType: CitizenType = cDigit === '0' ? 'citizen' : 'permanent_resident'

  // ── Luhn checksum ───────────────────────────────────────────────────────────
  const checksumValid = luhnCheck(id)
  if (!checksumValid) errors.push('ID number fails Luhn checksum validation')

  return {
    valid: errors.length === 0,
    checksumValid,
    dob,
    gender,
    citizenType,
    ageInYears,
    errors,
  }
}

/**
 * Standard Luhn algorithm.
 * Returns true if the number's check digit is correct.
 */
export function luhnCheck(numStr: string): boolean {
  const digits = numStr.split('').map(Number)
  const check  = digits.pop()!
  let sum      = 0
  let double   = true   // start doubling from the rightmost digit before check

  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits[i]
    if (double) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum   += n
    double = !double
  }

  return (10 - (sum % 10)) % 10 === check
}

/**
 * Quick helper: extract Date of Birth from a raw SA ID string.
 * Returns null if the string is too short or clearly invalid.
 */
export function extractDobFromId(raw: string): Date | null {
  const id = raw.replace(/\s/g, '')
  if (id.length < 6 || !/^\d+$/.test(id)) return null

  const yy = parseInt(id.substring(0, 2), 10)
  const mm = parseInt(id.substring(2, 4), 10) - 1  // 0-indexed
  const dd = parseInt(id.substring(4, 6), 10)
  const currentYY = new Date().getFullYear() % 100
  const year = yy > currentYY ? 1900 + yy : 2000 + yy

  const d = new Date(year, mm, dd)
  if (d.getMonth() !== mm || d.getDate() !== dd) return null
  return d
}
