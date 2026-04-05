"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Store, ArrowLeft, Loader2, CreditCard, CheckCircle, AlertCircle, Circle, Check, WifiOff, RefreshCw, RotateCcw, CloudCheck } from "lucide-react";

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
  const { captureError } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [networkError, setNetworkError] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
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
    
    // Check for cached form data
    if (hasCachedData()) {
      const cachedData = loadFormData<Record<string, string>>();
      if (cachedData && Object.keys(cachedData).length > 0) {
        setShowRestoreDialog(true);
      }
    }
  }, []);

  const loadFormConfig = async () => {
    try {
      setNetworkError(false);
      const res = await secureFetch("/api/reseller/form-config", {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();

      if (data.success) {
        setConfig(data.config);
        setCustomFields(data.customFields || []);
        
        const customInitialData: Record<string, string> = {};
        data.customFields?.forEach((field: CustomField) => {
          customInitialData[field.field_name] = "";
        });
        setFormData(prev => ({ ...prev, ...customInitialData }));
      } else {
        throw new Error(data.error || "Failed to load form configuration");
      }
    } catch (error) {
      console.error("Failed to load form config:", error);
      setNetworkError(true);
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          toast.error("Network error. Please check your connection and try again.");
        } else {
          toast.error(error.message || "Failed to load form configuration");
        }
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setConfigLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    let step = 1;
    
    // Check which step has errors to determine current step
    if (config.business_name.enabled && config.business_name.required && !formData.business_name.trim()) {
      step = Math.max(step, 1);
    }
    
    if (config.business_phone.enabled && formData.business_phone) {
      const phoneRegex = /^0[2-9]\d{8}$/;
      if (!phoneRegex.test(formData.business_phone.replace(/\s/g, ""))) {
        step = Math.max(step, 2);
      }
    }
    
    if (config.business_email.enabled && formData.business_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.business_email)) {
        step = Math.max(step, 2);
      }
    }
    
    setCurrentStep(step);

    // Validate business name
    if (config.business_name.enabled && config.business_name.required && !formData.business_name.trim()) {
      newErrors.business_name = "Business name is required";
    }

    // Validate business email format
    if (config.business_email.enabled && formData.business_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.business_email)) {
        newErrors.business_email = "Please enter a valid email address";
      }
    }

    // Validate business phone format (Ghana)
    if (config.business_phone.enabled && formData.business_phone) {
      const phoneRegex = /^0[2-9]\d{8}$/;
      if (!phoneRegex.test(formData.business_phone.replace(/\s/g, ""))) {
        newErrors.business_phone = "Please enter a valid Ghana phone number (e.g., 024XXXXXXX)";
      }
    }

    // Validate custom fields
    customFields.forEach((field) => {
      if (field.is_required && !formData[field.field_name]?.trim()) {
        newErrors[field.field_name] = `${field.field_label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmSubmit = async () => {
    if (!acceptedTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setShowConfirmDialog(false);
    setLoading(true);
    setNetworkError(false);

    try {
      // Step 1: Create the application
      const applyRes = await secureFetch("/api/reseller/apply", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, accepted_terms: true })
      });

      if (!applyRes.ok) {
        throw new Error(`HTTP ${applyRes.status}: ${applyRes.statusText}`);
      }

      const applyData = await applyRes.json();

      if (!applyData.success) {
        throw new Error(applyData.error || "Failed to submit application");
      }

      // Step 2: Initialize Paystack payment
      if (config.require_payment_before_approval && config.application_fee > 0) {
        toast.info("Initializing payment...");
        
        const paymentRes = await secureFetch("/api/reseller/payment/initialize", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: config.application_fee,
            application_id: applyData.application.id,
            metadata: {
              business_name: formData.business_name,
              business_type: formData.business_type
            }
          })
        });

        if (!paymentRes.ok) {
          throw new Error(`HTTP ${paymentRes.status}: ${paymentRes.statusText}`);
        }

        const paymentData = await paymentRes.json();

        if (paymentData.success && paymentData.data?.authorization_url) {
          // Redirect to Paystack checkout
          window.location.href = paymentData.data.authorization_url;
        } else {
          throw new Error(paymentData.error || "Failed to initialize payment");
        }
      } else {
        // No payment required, go directly to reseller dashboard
        toast.success("Application submitted successfully!");
        clearCache(); // Clear cache after successful submission
        window.location.href = "/dashboard/reseller";
      }
    } catch (error) {
      console.error("Application submission error:", error);
      setNetworkError(true);
      
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

  if (networkError) {
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
          <CardContent className="p-8 text-center">
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <WifiOff className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
            <p className="text-muted-foreground mb-6">
              We're having trouble connecting to our servers. Please check your internet connection and try again.
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
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
                <CloudCheck className="h-3 w-3" aria-hidden="true" />
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
              <div className="flex items-center space-x-2">
                {currentStep >= 1 ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={`text-sm font-medium ${currentStep >= 1 ? "text-green-600" : "text-muted-foreground"}`}>
                  Business Details
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {currentStep >= 2 ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={`text-sm font-medium ${currentStep >= 2 ? "text-green-600" : "text-muted-foreground"}`}>
                  Contact Info
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {currentStep >= 3 ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className={`text-sm font-medium ${currentStep >= 3 ? "text-green-600" : "text-muted-foreground"}`}>
                  Review & Submit
                </span>
              </div>
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
                className="bg-gradient-to-r from-[#006994] to-[#722F37] h-2 rounded-full transition-all duration-300"
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
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Business Information</h3>
              {renderField("business_name", "Business Name", "text", "Your business name")}
              {renderField("business_address", "Business Address", "text", "Your business address")}
            </div>

            {/* Step 2: Contact Information */}
            {(config.business_phone?.enabled || config.business_email?.enabled || config.business_type?.enabled) && (
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
              </div>
            )}

            {/* Additional Information */}
            {customFields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Additional Information</h3>
                {customFields.map(renderCustomField)}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 sm:h-11 text-sm sm:text-xs"
              disabled={loading}
              aria-disabled={loading}
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
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#006994]" />
              Confirm Application
            </DialogTitle>
            <DialogDescription>
              Please review your application details before submitting.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business Name:</span>
                <span className="font-medium">{formData.business_name}</span>
              </div>
              {config.business_address.enabled && formData.business_address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-medium">{formData.business_address}</span>
                </div>
              )}
              {config.business_phone.enabled && formData.business_phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{formData.business_phone}</span>
                </div>
              )}
              {config.business_type.enabled && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{formData.business_type}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Application Fee:</span>
                  <span>{config.currency} {config.application_fee?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-2">
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

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmSubmit}
              disabled={!acceptedTerms || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay & Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
