"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Plus, Trash2, Save, RefreshCw, DollarSign } from "lucide-react";

interface FormField {
  name: string;
  label: string;
  enabled: boolean;
  required: boolean;
}

interface CustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  is_enabled: boolean;
  placeholder?: string;
  help_text?: string;
  sort_order: number;
}

interface FormConfig {
  business_name: { enabled: boolean; required: boolean };
  business_address: { enabled: boolean; required: boolean };
  business_phone: { enabled: boolean; required: boolean };
  business_email: { enabled: boolean; required: boolean };
  business_type: { enabled: boolean; required: boolean };
  application_fee: number;
  currency: string;
  require_payment_before_approval: boolean;
}

export default function AdminResellerFormConfigPage() {
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newField, setNewField] = useState({
    field_name: "",
    field_label: "",
    field_type: "text",
    is_required: false,
    placeholder: "",
    help_text: ""
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch("/api/admin/reseller-form-config", {
        credentials: "include"
      });
      const data = await res.json();

      if (data.success) {
        setConfig(data.config);
        setCustomFields(data.customFields || []);
      }
    } catch (error) {
      toast.error("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/reseller-form-config", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Configuration saved");
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const addCustomField = async () => {
    if (!newField.field_name || !newField.field_label) {
      toast.error("Field name and label are required");
      return;
    }

    try {
      const res = await fetch("/api/admin/reseller-form-config", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: newField })
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Custom field added");
        setNewField({
          field_name: "",
          field_label: "",
          field_type: "text",
          is_required: false,
          placeholder: "",
          help_text: ""
        });
        loadConfig();
      } else {
        toast.error(data.error || "Failed to add field");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const deleteCustomField = async (fieldId: string) => {
    if (!confirm("Are you sure you want to delete this field?")) return;

    try {
      const res = await fetch(`/api/admin/reseller-form-config/custom-fields/${fieldId}`, {
        method: "DELETE",
        credentials: "include"
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Field deleted");
        loadConfig();
      }
    } catch (error) {
      toast.error("Failed to delete field");
    }
  };

  const updateFieldToggle = (fieldName: string, type: 'enabled' | 'required', value: boolean) => {
    setConfig(prev => {
      const fieldConfig = prev[fieldName as keyof FormConfig] as { enabled: boolean; required: boolean } | undefined;
      if (!fieldConfig) return prev;
      const newConfig = { ...prev } as FormConfig;
      (newConfig[fieldName as keyof FormConfig] as { enabled: boolean; required: boolean }) = {
        ...fieldConfig,
        [type]: value
      };
      return newConfig;
    });
  };

  const defaultFields: { name: keyof FormConfig; label: string }[] = [
    { name: "business_name", label: "Business Name" },
    { name: "business_address", label: "Business Address" },
    { name: "business_phone", label: "Business Phone" },
    { name: "business_email", label: "Business Email" },
    { name: "business_type", label: "Business Type" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006994]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Reseller Form Configuration</h1>
          <p className="text-muted-foreground">Customize the reseller application form</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadConfig}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={saveConfig} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Application Fee & Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="application_fee">Application Fee</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="application_fee"
                  type="number"
                  step="0.01"
                  value={config.application_fee}
                  onChange={(e) => setConfig({ ...config, application_fee: parseFloat(e.target.value) })}
                />
                <span className="text-muted-foreground whitespace-nowrap">{config.currency}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={config.currency}
                onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                placeholder="GHS"
              />
            </div>

            <div className="flex items-end pb-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="require_payment"
                  checked={config.require_payment_before_approval}
                  onCheckedChange={(checked) => setConfig({ ...config, require_payment_before_approval: checked })}
                />
                <Label htmlFor="require_payment">Require payment before approval</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Fields */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Default Form Fields</CardTitle>
          <CardDescription>Enable/disable and set required fields</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {defaultFields.map((field) => (
              <div key={field.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="font-medium">{field.label}</span>
                  {field.name === "business_name" && (
                    <Badge variant="outline">Always Required</Badge>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`${field.name}-enabled`}
                      checked={(config[field.name] as any)?.enabled}
                      onCheckedChange={(checked) => updateFieldToggle(field.name, 'enabled', checked)}
                      disabled={field.name === "business_name"}
                    />
                    <Label htmlFor={`${field.name}-enabled`}>Enabled</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`${field.name}-required`}
                      checked={(config[field.name] as any)?.required}
                      onCheckedChange={(checked) => updateFieldToggle(field.name, 'required', checked)}
                      disabled={field.name === "business_name"}
                    />
                    <Label htmlFor={`${field.name}-required`}>Required</Label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Fields</CardTitle>
          <CardDescription>Add custom questions to the form</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add New Field */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-muted rounded-lg">
            <div>
              <Label>Field Name (internal)</Label>
              <Input
                value={newField.field_name}
                onChange={(e) => setNewField({ ...newField, field_name: e.target.value })}
                placeholder="e.g., website_url"
              />
            </div>
            <div>
              <Label>Field Label (display)</Label>
              <Input
                value={newField.field_label}
                onChange={(e) => setNewField({ ...newField, field_label: e.target.value })}
                placeholder="e.g., Website URL"
              />
            </div>
            <div>
              <Label>Field Type</Label>
              <select
                className="w-full border rounded-md p-2"
                value={newField.field_type}
                onChange={(e) => setNewField({ ...newField, field_type: e.target.value })}
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="number">Number</option>
                <option value="tel">Phone</option>
                <option value="textarea">Textarea</option>
                <option value="select">Select</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label>Placeholder</Label>
                <Input
                  value={newField.placeholder}
                  onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                  placeholder="Optional placeholder text"
                />
              </div>
              <div className="flex items-center space-x-2 pb-2">
                <input
                  type="checkbox"
                  id="new-field-required"
                  checked={newField.is_required}
                  onChange={(e) => setNewField({ ...newField, is_required: e.target.checked })}
                />
                <Label htmlFor="new-field-required">Required</Label>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Help Text</Label>
              <Input
                value={newField.help_text}
                onChange={(e) => setNewField({ ...newField, help_text: e.target.value })}
                placeholder="Optional help text displayed below the field"
              />
            </div>
            <div className="md:col-span-2">
              <Button onClick={addCustomField} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Custom Field
              </Button>
            </div>
          </div>

          {/* Existing Custom Fields */}
          <div className="space-y-3">
            {customFields.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No custom fields yet</p>
            ) : (
              customFields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{field.field_label}</span>
                    <span className="text-xs text-muted-foreground ml-2">({field.field_name})</span>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{field.field_type}</Badge>
                      {field.is_required && <Badge>Required</Badge>}
                      {!field.is_enabled && <Badge variant="secondary">Disabled</Badge>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => deleteCustomField(field.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
