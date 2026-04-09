"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ErrorBoundary, useErrorHandler } from "@/components/error-boundary";
import { secureFetch } from "@/lib/csrf";
import { saveFormData, loadFormData, clearFormData, hasCachedData } from "@/lib/form-cache";
import { useFormCache } from "@/hooks/use-form-cache";
import { Store, ArrowLeft, ArrowRight, Loader2, CreditCard, CheckCircle, AlertCircle, Circle, Check, RotateCcw, CloudUpload, Wallet } from "lucide-react";

interface FormField {
  enabled: boolean;
  required: boolean;
}

interface FormConfig {
  business_name: FormField;
  business_address: FormField;
  business_phone: FormField;
  business_email: FormField;
  business_type: FormField;
  application_fee: number;
  currency: string;
  require_payment_before_approval?: boolean;
}

interface CustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  placeholder?: string;
  help_text?: string;
  field_options?: string[];
}

interface ValidationErrors {
  [key: string]: string;
}

function ResellerApplyContent() {
  const router = useRouter();
  const { captureError } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "wallet">("paystack");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [config, setConfig] = useState<FormConfig>({
    business_name: { enabled: true, required: true },
    business_address: { enabled: true, required: false },
    business_phone: { enabled: true, required: false },
    business_email: { enabled: true, required: false },
    business_type: { enabled: true, required: false },
    application_fee: 100.00,
    currency: "GHS",
    require_payment_before_approval: true
  });
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({
    business_name: "",
    business_address: "",
    business_phone: "",
    business_email: "",
    business_type: "individual"
  });

  const { save: saveToCache, load: loadFromCache, clear: clearCache, hasCache } = useFormCache(formData);

  const autoSave = useCallback((data: Record<string, string>) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus("saving");
    autoSaveTimer.current = setTimeout(() => {
      saveToCache(data);
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 1200);
  }, [saveToCache]);

  useEffect(() => {
    loadFormConfig();
    loadWalletBalance();
    
    // Initialize CSRF token
    const { getCSRFToken } = require("@/lib/csrf");
    getCSRFToken();
    
    // Check for cached form data
    if (hasCachedData()) {
      const cachedData = loadFormData<Record<string, string>>();
      if (cachedData && Object.keys(cachedData).length > 0) {
        setShowRestoreDialog(true);
      }
    }
  }, []);

  const loadWalletBalance = async () => {
    try {
      const res = await fetch("/api/wallet", {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.data?.balance || 0);
      }
    } catch (error) {
      console.error("Failed to load wallet balance:", error);
    }
  };

  const loadFormConfig = async () => {
    try {
      const res = await fetch("/api/reseller/form-config", {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setCustomFields(data.customFields || []);
        const customInitialData: Record<string, string> = {};
        data.customFields?.forEach((field: CustomField) => {
          customInitialData[field.field_name] = "";
        });
        setFormData(prev => ({ ...prev, ...customInitialData }));
      }
    } catch (error) {
      console.error("Failed to load form config:", error);
      toast.warning("Using default form configuration.");
    } finally {
      setConfigLoading(false);
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (config.business_name.enabled && config.business_name.required && !formData.business_name.trim()) {
      newErrors.business_name = "Business name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (config.business_phone.enabled && formData.business_phone) {
      const phoneRegex = /^0[2-9]\d{8}$/;
      if (!phoneRegex.test(formData.business_phone.replace(/\s/g, ""))) {
        newErrors.business_phone = "Please enter a valid Ghana phone number (e.g., 024XXXXXXX)";
      }
    }
    if (config.business_email.enabled && formData.business_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.business_email)) {
        newErrors.business_email = "Please enter a valid email address";
      }
    }
    customFields.forEach((field) => {
      if (field.is_required && !formData[field.field_name]?.trim()) {
        newErrors[field.field_name] = `${field.field_label} is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) { setCurrentStep(2); setErrors({}); }
    } else if (currentStep === 2) {
      if (validateStep2()) { setCurrentStep(3); setErrors({}); }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) { setCurrentStep(currentStep - 1); setErrors({}); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await confirmSubmit();
  };

  const confirmSubmit = async () => {
    if (!acceptedTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create the application
      const applyRes = await secureFetch("/api/reseller/apply", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, accepted_terms: true })
      });

      if (!applyRes.ok) {
        // Handle 409 Conflict - user already has pending application or is already a reseller
        if (applyRes.status === 409) {
          const conflictData = await applyRes.json().catch(() => ({ error: "Application already exists", application: null }));
          const errorMsg = conflictData.error || "You already have an application";
          
          // Redirect based on status
          if (errorMsg.includes("already a reseller")) {
            toast.info("You are already a reseller!");
            window.location.href = "/dashboard/reseller";
            return;
          } else if (conflictData.application && conflictData.application.payment_status !== "paid") {
            // Application exists but not paid - handle payment inline
            const application = conflictData.application;
            console.log("[DEBUG] Application already exists, processing payment inline, application_id:", application.id);
            
            if (config.require_payment_before_approval && config.application_fee > 0) {
              if (paymentMethod === "wallet") {
                // Wallet payment
                console.log("[DEBUG] Processing wallet payment for existing application");
                const walletRes = await secureFetch("/api/reseller/payment/wallet", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    application_id: application.id,
                    amount: config.application_fee
                  })
                });
                if (!walletRes.ok) {
                  const walletError = await walletRes.json().catch(() => ({}));
                  throw new Error(walletError.error || `Wallet payment failed (HTTP ${walletRes.status})`);
                }
                
                const walletData = await walletRes.json();
                
                if (walletData.success) {
                  toast.success("Payment successful! Your application has been approved.");
                  router.push("/dashboard/reseller/status");
                } else {
                  throw new Error(walletData.error || "Wallet payment failed");
                }
              } else {
                // Paystack payment
                console.log("[DEBUG] Initializing Paystack payment for existing application");
                const paystackRes = await secureFetch("/api/reseller/payment/initialize", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    application_id: application.id,
                    amount: config.application_fee,
                    payment_method: "paystack"
                  })
                });
                if (!paystackRes.ok) {
                  const paystackError = await paystackRes.json().catch(() => ({}));
                  throw new Error(paystackError.error || `Failed to initialize payment (HTTP ${paystackRes.status})`);
                }
                
                const paystackData = await paystackRes.json();
                
                const authorizationUrl = paystackData.authorization_url || paystackData.data?.authorization_url;
                
                if (paystackData.success && authorizationUrl) {
                  toast.success("Redirecting to payment...");
                  window.location.href = authorizationUrl;
                } else {
                  throw new Error(paystackData.error || "Failed to initialize payment");
                }
              }
            } else {
              // No payment required - redirect to status page
              toast.info(errorMsg);
              router.push("/dashboard/reseller/status");
            }
          } else {
            // Application exists and paid - redirect to status page
            toast.info(errorMsg);
            router.push("/dashboard/reseller/status");
          }
          return;
        }
        throw new Error(`HTTP ${applyRes.status}: ${applyRes.statusText}`);
      }

      const applyData = await applyRes.json();

      if (!applyData.success) {
        throw new Error(applyData.error || "Failed to submit application");
      }

      // Step 3: Handle payment based on selected method
      if (config.require_payment_before_approval && config.application_fee > 0) {
        if (paymentMethod === "wallet") {
          // Wallet payment
          const walletRes = await secureFetch("/api/reseller/payment/wallet", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              application_id: applyData.application.id,
              amount: config.application_fee
            })
          });
          if (!walletRes.ok) {
            const walletError = await walletRes.json().catch(() => ({}));
            throw new Error(walletError.error || `Wallet payment failed (HTTP ${walletRes.status})`);
          }
          
          const walletData = await walletRes.json();
          
          if (walletData.success) {
            toast.success("Payment successful! Your application has been approved.");
            router.push("/dashboard/reseller/status");
          } else {
            throw new Error(walletData.error || "Wallet payment failed");
          }
        } else {
          // Paystack payment
          const paystackRes = await secureFetch("/api/reseller/payment/initialize", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              application_id: applyData.application.id,
              amount: config.application_fee,
              payment_method: "paystack"
            })
          });
          if (!paystackRes.ok) {
            const paystackError = await paystackRes.json().catch(() => ({}));
            throw new Error(paystackError.error || `Failed to initialize payment (HTTP ${paystackRes.status})`);
          }
          
          const paystackData = await paystackRes.json();
          
          const authorizationUrl = paystackData.authorization_url || paystackData.data?.authorization_url;
          
          if (paystackData.success && authorizationUrl) {
            toast.success("Application submitted! Redirecting to payment...");
            window.location.href = authorizationUrl;
          } else {
            throw new Error(paystackData.error || "Failed to initialize payment");
          }
        }
      } else {
        // No payment required - redirect to status page
        toast.success("Application submitted successfully!");
        router.push("/dashboard/reseller/status");
      }
    } catch (error) {
      console.error("Application submission error:", error);
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          toast.error("Network error. Please check your connection and try again.");
        } else {
          toast.error(error.message || "Failed to submit application");
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
      setLoading(false);
    }
  };

  const renderField = (fieldName: string, label: string, type: string = "text", placeholder?: string) => {
    const fieldConfig = config[fieldName as keyof FormConfig] as FormField | undefined;
    if (!fieldConfig?.enabled) return null;
    const errorId = `${fieldName}-error`;
    const hasError = !!errors[fieldName];

    return (
      <div className="space-y-2">
        <Label htmlFor={fieldName}>
          {label}
          {fieldConfig.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </Label>
        <Input
          id={fieldName}
          type={type}
          value={formData[fieldName] || ""}
          onChange={(e) => {
            const newData = { ...formData, [fieldName]: e.target.value };
            setFormData(newData);
            autoSave(newData);
            if (errors[fieldName]) setErrors({ ...errors, [fieldName]: "" });
          }}
          placeholder={placeholder}
          required={fieldConfig.required}
          aria-required={fieldConfig.required}
          aria-invalid={hasError}
          aria-describedby={hasError ? errorId : undefined}
          className={hasError ? "border-red-500" : ""}
        />
        {hasError && (
          <p id={errorId} role="alert" className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {errors[fieldName]}
          </p>
        )}
      </div>
    );
  };

  const renderCustomField = (field: CustomField) => {
    const helpId = `${field.field_name}-help`;
    const errorId = `${field.field_name}-error`;
    const hasError = !!errors[field.field_name];
    const describedBy = [hasError ? errorId : "", field.help_text ? helpId : ""].filter(Boolean).join(" ") || undefined;
    return (
      <div className="space-y-2" key={field.id}>
        <Label htmlFor={field.field_name}>
          {field.field_label}
          {field.is_required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </Label>
        {field.field_type === "textarea" ? (
          <textarea
            id={field.field_name}
            value={formData[field.field_name] || ""}
            onChange={(e) => {
              const newData = { ...formData, [field.field_name]: e.target.value };
              setFormData(newData);
              autoSave(newData);
            }}
            placeholder={field.placeholder}
            required={field.is_required}
            aria-required={field.is_required}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            className="w-full border rounded-md p-2 min-h-[100px]"
          />
        ) : field.field_type === "select" ? (
          <select
            id={field.field_name}
            value={formData[field.field_name] || ""}
            onChange={(e) => {
              const newData = { ...formData, [field.field_name]: e.target.value };
              setFormData(newData);
              autoSave(newData);
            }}
            required={field.is_required}
            aria-required={field.is_required}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            className="w-full border rounded-md p-2"
          >
            <option value="">Select...</option>
            {field.field_options?.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <Input
            id={field.field_name}
            type={field.field_type}
            value={formData[field.field_name] || ""}
            onChange={(e) => {
              const newData = { ...formData, [field.field_name]: e.target.value };
              setFormData(newData);
              autoSave(newData);
            }}
            placeholder={field.placeholder}
            required={field.is_required}
            aria-required={field.is_required}
            aria-invalid={hasError}
            aria-describedby={describedBy}
          />
        )}
        {hasError && (
          <p id={errorId} role="alert" className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {errors[field.field_name]}
          </p>
        )}
        {field.help_text && (
          <p id={helpId} className="text-xs text-muted-foreground">{field.help_text}</p>
        )}
      </div>
    );
  };

  if (configLoading) {
    return (
      <div className="container mx-auto py-6 px-4 sm:py-8 sm:px-6 max-w-2xl">
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-muted rounded animate-pulse" />
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          
          {/* Form Fields Skeleton */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-28 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                <div className="h-10 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
          
          {/* Submit Button Skeleton */}
          <div className="h-12 w-full bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:py-8 sm:px-6 max-w-2xl">
      <Button 
        variant="ghost" 
        className="mb-4 sm:mb-6"
        onClick={() => window.location.href = "/dashboard"}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Store className="h-6 w-6 text-[#006994]" />
            <CardTitle>Become a Reseller</CardTitle>
          </div>
          <CardDescription>
            Fill in your business details to apply for a reseller account.
            Application fee: {config.currency} {config.application_fee?.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Auto-save status */}
          <div aria-live="polite" aria-atomic="true" className="flex justify-end mb-2 h-5">
            {autoSaveStatus === "saving" && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                Saving draft...
              </span>
            )}
            {autoSaveStatus === "saved" && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CloudUpload className="h-3 w-3" aria-hidden="true" />
                Draft saved
              </span>
            )}
          </div>

          {/* Progress Indicator */}
          <div
            className="mb-6 sm:mb-8"
            role="group"
            aria-label="Application progress"
          >
            <div className="flex items-center justify-between mb-4">
              {(["Business Details", "Contact Info", "Review & Submit"] as const).map((label, index) => {
                const isCompleted = index < currentStep - 1;
                const isCurrent = index === currentStep - 1;
                return (
                  <div key={label} className="flex items-center space-x-2">
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : isCurrent ? (
                      <div className="h-5 w-5 rounded-full border-2 border-[#006994] flex items-center justify-center shrink-0">
                        <div className="h-2 w-2 rounded-full bg-[#006994]" />
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className={`text-sm font-medium ${
                      isCompleted ? "text-green-600" : isCurrent ? "text-[#006994]" : "text-muted-foreground"
                    }`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div
              className="w-full bg-muted rounded-full h-2"
              role="progressbar"
              aria-valuenow={currentStep}
              aria-valuemin={1}
              aria-valuemax={3}
              aria-label={`Step ${currentStep} of 3`}
            >
              <div 
                className="bg-[#006994] h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>
          </div>
          
          <form
            onSubmit={handleSubmit}
            className="space-y-4 sm:space-y-6"
            aria-label="Reseller application form"
            noValidate
          >
            {/* Step 1: Business Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Business Information</h3>
                {renderField("business_name", "Business Name", "text", "Your business name")}
                {renderField("business_address", "Business Address", "text", "Your business address")}
              </div>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Contact Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {config.business_phone?.enabled && (
                    <div className="space-y-2">
                      <Label htmlFor="business_phone">
                        Business Phone
                        {config.business_phone.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id="business_phone"
                        type="tel"
                        value={formData.business_phone || ""}
                        onChange={(e) => {
                          const newData = { ...formData, business_phone: e.target.value };
                          setFormData(newData);
                          autoSave(newData);
                          if (errors.business_phone) setErrors({ ...errors, business_phone: "" });
                        }}
                        placeholder="024XXXXXXX"
                        required={config.business_phone.required}
                        aria-required={config.business_phone.required}
                        aria-invalid={!!errors.business_phone}
                        aria-describedby={errors.business_phone ? "business_phone-error" : undefined}
                        className={errors.business_phone ? "border-red-500" : ""}
                      />
                      {errors.business_phone && (
                        <p id="business_phone-error" role="alert" className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" aria-hidden="true" />
                          {errors.business_phone}
                        </p>
                      )}
                    </div>
                  )}
                  {config.business_email?.enabled && (
                    <div className="space-y-2">
                      <Label htmlFor="business_email">
                        Business Email
                        {config.business_email.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      <Input
                        id="business_email"
                        type="email"
                        value={formData.business_email || ""}
                        onChange={(e) => {
                          const newData = { ...formData, business_email: e.target.value };
                          setFormData(newData);
                          autoSave(newData);
                          if (errors.business_email) setErrors({ ...errors, business_email: "" });
                        }}
                        placeholder="business@example.com"
                        required={config.business_email.required}
                        aria-required={config.business_email.required}
                        aria-invalid={!!errors.business_email}
                        aria-describedby={errors.business_email ? "business_email-error" : undefined}
                        className={errors.business_email ? "border-red-500" : ""}
                      />
                      {errors.business_email && (
                        <p id="business_email-error" role="alert" className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" aria-hidden="true" />
                          {errors.business_email}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {config.business_type?.enabled && (
                  <div className="space-y-2">
                    <Label htmlFor="business_type">
                      Business Type
                      {config.business_type.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <select
                      id="business_type"
                      value={formData.business_type || "individual"}
                      onChange={(e) => {
                        const newData = { ...formData, business_type: e.target.value };
                        setFormData(newData);
                        autoSave(newData);
                      }}
                      required={config.business_type.required}
                      aria-required={config.business_type.required}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="individual">Individual</option>
                      <option value="shop">Shop</option>
                      <option value="company">Company</option>
                    </select>
                  </div>
                )}
                {customFields.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <h3 className="text-lg font-semibold text-foreground">Additional Information</h3>
                    {customFields.map(renderCustomField)}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Review Your Application</h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-1">
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <span className="text-sm text-muted-foreground">Business Name</span>
                    <span className="text-sm font-semibold text-slate-900">{formData.business_name || "—"}</span>
                  </div>
                  {config.business_address?.enabled && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="text-sm text-muted-foreground">Business Address</span>
                      <span className="text-sm font-semibold text-slate-900">{formData.business_address || "—"}</span>
                    </div>
                  )}
                  {config.business_phone?.enabled && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="text-sm text-muted-foreground">Business Phone</span>
                      <span className="text-sm font-semibold text-slate-900">{formData.business_phone || "—"}</span>
                    </div>
                  )}
                  {config.business_email?.enabled && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="text-sm text-muted-foreground">Business Email</span>
                      <span className="text-sm font-semibold text-slate-900">{formData.business_email || "—"}</span>
                    </div>
                  )}
                  {config.business_type?.enabled && (
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                      <span className="text-sm text-muted-foreground">Business Type</span>
                      <span className="text-sm font-semibold text-slate-900 capitalize">{formData.business_type || "—"}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-sm font-bold text-slate-800">Application Fee</span>
                    <span className="text-sm font-bold text-[#006994]">{config.currency} {config.application_fee?.toFixed(2)}</span>
                  </div>
                </div>

                {config.require_payment_before_approval && config.application_fee > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-foreground">Select Payment Method</h4>
                    
                    <Button
                      type="button"
                      variant={paymentMethod === "paystack" ? "default" : "outline"}
                      className={`w-full h-auto py-4 justify-between ${paymentMethod === "paystack" ? "bg-[#006994] text-white hover:bg-[#00567A]" : ""}`}
                      onClick={() => setPaymentMethod("paystack")}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${paymentMethod === "paystack" ? "bg-white/20" : "bg-blue-100"}`}>
                          <CreditCard className={`h-5 w-5 ${paymentMethod === "paystack" ? "text-white" : "text-blue-600"}`} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Pay with Card/Bank</p>
                          <p className="text-xs text-muted-foreground">Secure payment via Paystack</p>
                        </div>
                      </div>
                      {paymentMethod === "paystack" && <CheckCircle className="h-5 w-5" />}
                    </Button>

                    <Button
                      type="button"
                      variant={paymentMethod === "wallet" ? "default" : "outline"}
                      className={`w-full h-auto py-4 justify-between ${paymentMethod === "wallet" ? "bg-[#006994] text-white hover:bg-[#00567A]" : ""}`}
                      onClick={() => setPaymentMethod("wallet")}
                      disabled={walletBalance < config.application_fee}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${paymentMethod === "wallet" ? "bg-white/20" : "bg-green-100"}`}>
                          <Wallet className={`h-5 w-5 ${paymentMethod === "wallet" ? "text-white" : "text-green-600"}`} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Pay with Wallet</p>
                          <p className="text-xs text-muted-foreground">
                            Balance: {config.currency} {walletBalance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {walletBalance < config.application_fee ? (
                        <span className="text-xs text-red-600">Insufficient</span>
                      ) : paymentMethod === "wallet" ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : null}
                    </Button>
                    {walletBalance < config.application_fee && (
                      <p className="text-xs text-red-600">
                        Wallet balance is insufficient.{" "}
                        <Link href="/dashboard/wallet" className="underline">
                          Fund wallet
                        </Link>
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                    I agree to the{" "}
                    <a href="/terms" target="_blank" className="text-[#006994] hover:underline">
                      Terms and Conditions
                    </a>{" "}
                    and understand that my application will be reviewed after payment confirmation.
                  </Label>
                </div>
              </div>
            )}

            {/* Step Navigation */}
            <div className="flex items-center justify-between pt-2">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="bg-[#006994] text-white hover:bg-[#00567A] flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-[#006994] text-white hover:bg-[#00567A] h-11"
                  disabled={loading || !acceptedTerms}
                  aria-disabled={loading || !acceptedTerms}
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Submit Application ({config.currency} {config.application_fee?.toFixed(2)})
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Restore Draft Dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-[#006994]" />
              Restore Draft?
            </DialogTitle>
            <DialogDescription>
              We found a partially completed application. Would you like to restore it?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              clearCache();
              setShowRestoreDialog(false);
            }}>
              Start Fresh
            </Button>
            <Button onClick={() => {
              const cachedData = loadFromCache();
              if (cachedData) {
                setFormData(prev => ({ ...prev, ...cachedData }));
              }
              setShowRestoreDialog(false);
              toast.success("Draft restored successfully!");
            }}>
              Restore Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ResellerApplyPage() {
  return (
    <ErrorBoundary>
      <ResellerApplyContent />
    </ErrorBoundary>
  );
}
