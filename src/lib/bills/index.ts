// Unified Bill Payment System - Public API
export type {
  BillCategory,
  BillStatus,
  BillProvider,
  BillService,
  BillVariation,
  BillValidationResult,
  BillPaymentRequest,
  BillPaymentResult,
  BillProviderInterface,
  BillTransactionRecord,
  ProviderConfig,
} from "./types";

export { billService } from "./service";
export { vtpassProvider, VtpassProvider } from "./providers/vtpass";
export { datamartBillProvider, DatamartBillProvider } from "./providers/datamart";
