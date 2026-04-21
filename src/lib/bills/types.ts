export type BillCategory = 'electricity' | 'tv' | 'internet' | 'water';
export type BillStatus = 'success' | 'pending' | 'failed';
export type BillProvider = 'vtpass' | 'datamart';

export interface BillService {
  id: string;
  name: string;
  category: BillCategory;
  provider: BillProvider;
  icon?: string;
  color?: string;
  minAmount: number;
  maxAmount: number;
  accountLabel: string;
  accountPlaceholder?: string;
  variations?: BillVariation[];
}

export interface BillVariation {
  code: string;
  name: string;
  amount: number;
}

export interface BillValidationResult {
  valid: boolean;
  customerName?: string;
  customerAddress?: string;
  dueAmount?: number;
  dueDate?: string;
  message?: string;
}

export interface BillPaymentRequest {
  serviceId: string;
  accountNumber: string;
  amount: number;
  variationCode?: string;
  phoneNumber: string;
  reference?: string;
}

export interface BillPaymentResult {
  status: BillStatus;
  provider: BillProvider;
  service: string;
  customerName?: string;
  amount: number;
  reference: string;
  transactionId?: string;
  message: string;
  raw: unknown;
}

export interface BillProviderInterface {
  readonly name: BillProvider;
  isAvailable(): Promise<boolean>;
  getServices(category?: BillCategory): Promise<BillService[]>;
  validateAccount(serviceId: string, accountNumber: string): Promise<BillValidationResult>;
  pay(request: BillPaymentRequest): Promise<BillPaymentResult>;
  checkStatus(reference: string): Promise<BillPaymentResult>;
}

export interface BillTransactionRecord {
  id: string;
  userId: string;
  provider: BillProvider;
  serviceId: string;
  serviceName: string;
  category: BillCategory;
  accountNumber: string;
  customerName?: string;
  amount: number;
  fee: number;
  totalAmount: number;
  reference: string;
  providerReference?: string;
  status: BillStatus;
  rawResponse?: unknown;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ProviderConfig {
  id: BillProvider;
  enabled: boolean;
  priority: number;
  markupPercent: number;
  dailyLimit?: number;
  updatedAt: Date;
}
