import apiClient from './client';

export interface User {
  id: number;
  phone: string;
  createdAt: string;
}

export interface VerifyOtpResponse {
  token: string;
  user: User;
}

/**
 * Request a 6-digit OTP code sent via mock SMS
 */
export const requestOtpApi = async (phone: string): Promise<{ message: string; phone: string }> => {
  const response = await apiClient.post<{ message: string; phone: string }>('/auth/request-otp', {
    phone,
  });
  return response.data;
};

/**
 * Verify OTP code and receive JWT authentication token
 */
export const verifyOtpApi = async (phone: string, otp: string): Promise<VerifyOtpResponse> => {
  const response = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', {
    phone,
    otp,
  });
  return response.data;
};
