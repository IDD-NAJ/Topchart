import { z } from "zod";

// Common validation schemas
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address")
  .trim()
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^0[2-5][0-9]\d{7}$/, "Invalid Ghana phone number (format: 024XXXXXXX)");

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .trim();

export const idSchema = z
  .string()
  .min(1, "ID is required")
  .uuid("Invalid ID format");

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  first_name: nameSchema,
  last_name: nameSchema,
  phone: phoneSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordSchema,
  confirm_password: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

// Reseller application schemas
export const resellerApplySchema = z.object({
  business_name: z.string().min(2, "Business name is required").max(200).trim(),
  business_address: z.string().min(5, "Business address is required").max(500).trim().optional(),
  business_phone: phoneSchema.optional(),
  business_email: emailSchema.optional(),
  business_type: z.enum(["individual", "company", "llc", "partnership"]).optional(),
  accepted_terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
});

export const resellerApplicationUpdateSchema = z.object({
  application_id: idSchema,
  status: z.enum(["approved", "rejected"]),
  rejection_reason: z.string().max(500).optional(),
  confirm_payment: z.boolean().optional(),
});

// Payment schemas
export const paymentInitializeSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(1000000, "Amount too large"),
  application_id: idSchema,
  metadata: z.record(z.any()).optional(),
});

export const walletPaymentSchema = z.object({
  application_id: idSchema,
  amount: z.number().positive("Amount must be positive").max(1000000, "Amount too large"),
});

// Purchase schemas
export const airtimePurchaseSchema = z.object({
  type: z.literal("airtime"),
  network: z.enum(["mtn", "vodafone", "airteltigo"]),
  phone: phoneSchema,
  amount: z.number().positive("Amount must be positive").max(1000, "Maximum amount is GHS 1000"),
});

export const dataPurchaseSchema = z.object({
  type: z.literal("data"),
  network: z.enum(["mtn", "vodafone", "airteltigo"]),
  phone: phoneSchema,
  bundle_id: z.string().min(1, "Bundle ID is required"),
  bundle_price: z.number().positive("Price must be positive"),
});

export const resultCheckerPurchaseSchema = z.object({
  type: z.literal("result_checker"),
  exam_type: z.enum(["WAEC", "BECE", "WASSCE"]),
  quantity: z.number().int().positive("Quantity must be positive").max(50, "Maximum 50 cards per purchase"),
});

export const purchaseSchema = z.discriminatedUnion("type", [
  airtimePurchaseSchema,
  dataPurchaseSchema,
  resultCheckerPurchaseSchema,
]);

// Marketing schemas
export const createReferralLinkSchema = z.object({
  landing_page: z.string().url().default("/register"),
  utm_source: z.string().max(50).optional(),
  utm_medium: z.string().max(50).optional(),
});

// Inventory schemas
export const markSoldSchema = z.object({
  inventory_id: idSchema,
  sold_to: phoneSchema.optional(),
});

// Admin schemas
export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const adminUserUpdateSchema = z.object({
  id: idSchema,
  email: emailSchema.optional(),
  first_name: nameSchema.optional(),
  last_name: nameSchema.optional(),
  phone: phoneSchema.optional(),
  role: z.enum(["USER", "ADMIN", "RESELLER"]).optional(),
  status: z.enum(["active", "suspended", "blocked"]).optional(),
});

export const resellerTierUpdateSchema = z.object({
  id: idSchema,
  name: z.string().min(2).max(100),
  min_sales_amount: z.number().nonnegative(),
  commission_rate: z.number().min(0).max(100),
  discount_rate: z.number().min(0).max(100),
  perks: z.array(z.string()).optional(),
});

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }
  
  return {
    success: false,
    errors: result.error,
  };
}

// Helper to format Zod errors for API responses
export function formatZodError(error: z.ZodError): {
  field: string;
  message: string;
}[] {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}
