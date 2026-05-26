export interface BankDetails {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  bankCode?: string;
  ifsc?: string;
}

export interface PaymentDetails {
  upiId?: string;
  accountNo?: string;
  ifsc?: string;
  bankName?: string;
  rplId?: string;
  holderName?: string;
}

export interface WithdrawalItem {
  _id?: string;
  userId: number | string;
  orderId: string;
  amount: number;
  charge?: number;
  balanceAfter?: number;
  bankDetails?: BankDetails;
  paymentMethod?: 'UPI' | 'BANK' | 'UPAY';
  paymentDetails?: PaymentDetails;
  currency?: string;
  note?: string;
  gatewayResponse?: any;
  status: 'PENDING' | 'AUDITING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  channelName: string;
  gatewayOrderNo?: string;
  remark?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface WithdrawalResponse {
  items: WithdrawalItem[];
  total: number;
  limit: number;
  page: number;
  status?: string;
}

export interface WithdrawalLimits {
  min: number;
  max: number;
}

export interface WithdrawalConfig {
  _id?: string;
  key: string;
  perDayLimit: number;
  limits: {
    BANK: WithdrawalLimits;
    UPI: WithdrawalLimits;
    UPAY: WithdrawalLimits;
  };
}

export interface WithdrawalFilters {
  page: number;
  limit: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  orderId?: string;
}
