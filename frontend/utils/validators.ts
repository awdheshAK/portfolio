export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  return /^[+]?[\d\s-]{7,15}$/.test(value.trim());
}

export function isValidPostalCode(value: string): boolean {
  return /^\d{4,10}$/.test(value.trim());
}

export interface PasswordStrength {
  valid: boolean;
  message?: string;
}

export function checkPasswordStrength(value: string): PasswordStrength {
  if (value.length < 8) return { valid: false, message: "Password must be at least 8 characters." };
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return { valid: false, message: "Password must contain both letters and numbers." };
  }
  return { valid: true };
}
