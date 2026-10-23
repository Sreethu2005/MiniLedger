/**
 * Generate a random 6-digit numeric OTP code (100000 - 999999)
 */
export const generateOtpCode = (): string => {
  const code = Math.floor(100000 + Math.random() * 900000);
  return code.toString();
};
