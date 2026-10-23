import apiClient from './client';

export interface Loan {
  id: number;
  userId: number;
  friendName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'repaid';
  repaidAt: string | null;
  receiptUrl: string | null;
  createdAt: string;
  isOverdue: boolean;
}

export interface LoanSummary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
}

export interface CreateLoanPayload {
  friendName: string;
  amount: number;
  dueDate: string;
}

/**
 * Fetch all loans for current user (newest first)
 */
export const getLoansApi = async (): Promise<Loan[]> => {
  const response = await apiClient.get<Loan[]>('/loans');
  return response.data;
};

/**
 * Fetch financial summary (total lent, repaid, overdue)
 */
export const getLoanSummaryApi = async (): Promise<LoanSummary> => {
  const response = await apiClient.get<LoanSummary>('/loans/summary');
  return response.data;
};

/**
 * Record a new money loan
 */
export const createLoanApi = async (payload: CreateLoanPayload): Promise<Loan> => {
  const response = await apiClient.post<Loan>('/loans', payload);
  return response.data;
};

/**
 * Mark a loan as repaid
 */
export const repayLoanApi = async (id: number): Promise<Loan> => {
  const response = await apiClient.patch<Loan>(`/loans/${id}/repay`);
  return response.data;
};

/**
 * Upload an image receipt for a loan
 */
export const uploadReceiptApi = async (id: number, imageUri: string): Promise<Loan> => {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'receipt.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  // React Native FormData format
  formData.append('receipt', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  const response = await apiClient.post<Loan>(`/loans/${id}/receipt`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
