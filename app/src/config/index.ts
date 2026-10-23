import { Platform } from 'react-native';

/**
 * MiniLedger Configuration
 * 
 * NOTE FOR TESTING:
 * - Android Emulator: 10.0.2.2 points to host machine's localhost (default)
 * - iOS Simulator: localhost (default)
 * - Physical Phone via Expo Go: Change to your computer's local Wi-Fi IP (e.g., 'http://192.168.1.100:4000')
 */

// If you want to force a specific IP or ngrok/tunnel URL, set it here:
const MANUAL_OVERRIDE_URL: string | null = null;

const getDefaultBaseUrl = (): string => {
  if (MANUAL_OVERRIDE_URL) {
    return MANUAL_OVERRIDE_URL;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }

  return 'http://localhost:4000';
};

export const API_BASE_URL = getDefaultBaseUrl();

/**
 * Formats a relative static receipt URL to a complete downloadable URL
 */
export const getFullReceiptUrl = (relativeUrl: string | null): string | null => {
  if (!relativeUrl) return null;
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  return `${API_BASE_URL}${relativeUrl}`;
};
