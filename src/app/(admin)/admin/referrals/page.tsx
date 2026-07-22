"use client"

import React, { useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import { adminFetcher, adminMutate, formatCurrency, formatDate } from "@/lib/admin-fetcher"
import { AdminPageShell, AdminTableShell, AdminTableHeader, EmptyState, StatCard } from "@/components/admin/AdminPageShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Gift, RefreshCw, Search, Settings, Users, TrendingUp } from "lucide-react"

interface Referral {
  id: string
  referrer_id: string
  referrer_email?: string
  referred_id?: string
  referred_email?: string
  referral_code?: string
  status?: string
  reward_amount?: number
  reward_paid?: boolean
  created_at: string
}

interface ReferralSettings {
  referral_reward_amount?: number
  min_referrals_required?: number
  min_deposit_amount?: number
}

interface ReferralsResponse {
  success: boolean
  referrals?: Referral[]
  data?: Referral[]
  total?: number
}

interface SettingsResponse {
  success: boolean
  settings?: ReferralSettings
  data?: ReferralSettings
}

export default function AdminReferralsPage() {
  const [search, setSearch] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsForm, setSettingsForm] = useState<ReferralSettings>({})
  const [saving, setSaving] = useState(false)

  const { data, error, isLoading, mutate } = useSWR<ReferralsResponse>("/api/admin/referral-settings", adminFetcher)
  const { data: settingsData, mutate: mutateSettings } = useSWR<SettingsResponse>("/api/admin/referral-settings", adminFetcher)

  const referrals = data?.referrals || data?.data || []
  const settings = settingsData?.settings || settingsData?.data

  const filtered = referrals.filter(
    (r) =>
      !search ||
      r.referrer_email?.toLowerCase().includes(search.toLowerCase()) ||
      r.referred_email?.toLowerCase().includes(search.toLowerCase()) ||
      r.referral_code?.toLowerCase().includes(search.toLowerCase())
  )

  const paidCount = referrals.filter((r) => r.reward_paid).length
  const totalRewards = referrals.filter((r) => r.reward_paid).reduce((s, r) => s + Number(r.reward_amount ?? 0), 0)

  const openSettings = () => {
    setSettingsForm({
      referral_reward_amount: settings?.referral_reward_amount ?? 5,
      min_referrals_required: settings?.min_referrals_required ?? 1,
      min_deposit_amount: settings?.min_deposit_amount ?? 10,
    })
    setSettingsOpen(true)
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const res = await adminMutate("/api/admin/referral-settings", "POST", settingsForm)
      if (res.success) {
        toast.success("Settings saved")
        setSettingsOpen(false)
        mutateSettings()
      } else {
        toast.error(res.error || "Failed")
      }
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  return (
    <AdminPageShell
      title="Referrals"
      description="Manage referral program settings and track referral activity."
      icon={Gift}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openSettings}>
            <Settings className="w-4 h-4 mr-1.5" />Settings
          </Button>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-1.5" />Refresh
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Referrals" value={data?.total ?? referrals.length} icon={Users} />
        <StatCard label="Rewards Paid" value={paidCount} icon={Gift} accent />
        <StatCard label="Total Paid Out" value={formatCurrency(totalRewards)} icon={TrendingUp} />
      </div>

      {settings && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Current Program Settings</p>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Reward Amount</p>
              <p className="font-bold text-lg mt-0.5" style={{ color: "var(--marketing-accent,#F38F20)" }}>
                {formatCurrency(settings.referral_reward_amount ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Min Referrals Required</p>
              <p className="font-bold text-lg mt-0.5">{settings.min_referrals_required ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Min Deposit Required</p>
              <p className="font-bold text-lg mt-0.5">{formatCurrency(settings.min_deposit_amount ?? 0)}</p>
            </div>
          </div>
        </div>
      )}

      <AdminTableShell>
        <AdminTableHeader>
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search referrals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" />
          </div>
          <p className="text-sm text-muted-foreground shrink-0">{filtered.length} referral{filtered.length !== 1 ? "s" : ""}</p>
        </AdminTableHeader>

        {isLoading ? (
          <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : error ? (
          <EmptyState icon={Gift} title="Failed to load referrals" description={error.message} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Gift} title="No referrals yet" description="Referral activity will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Referred</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Reward</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">{r.referrer_email || r.referrer_id?.slice(0, 12) + "..."}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.referred_email || "—"}</TableCell>
                    <TableCell>
                      {r.referral_code && <Badge variant="outline" className="font-mono text-[10px]">{r.referral_code}</Badge>}
                    </TableCell>
                    <TableCell>
                      {r.status && <Badge variant={r.status === "completed" ? "default" : "secondary"} className="text-[10px] capitalize">{r.status}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{r.reward_amount != null ? formatCurrency(Number(r.reward_amount)) : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.reward_paid ? "default" : "secondary"} className="text-[10px]">
                        {r.reward_paid ? "Paid" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </AdminTableShell>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" style={{ color: "var(--marketing-accent,#F38F20)" }} />
              Referral Program Settings
            </DialogTitle>
            <DialogDescription>Configure how the referral program rewards users.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Reward Amount (GH₵)</Label>
              <Input
                type="number"
                step="0.01"
                value={settingsForm.referral_reward_amount ?? ""}
                onChange={(e) => setSettingsForm((f) => ({ ...f, referral_reward_amount: parseFloat(e.target.value) }))}
                placeholder="5.00"
              />
              <p className="text-xs text-muted-foreground">Amount credited to referrer per successful referral</p>
            </div>
            <div className="space-y-1.5">
              <Label>Minimum Referrals Required</Label>
              <Input
                type="number"
                min="1"
                value={settingsForm.min_referrals_required ?? ""}
                onChange={(e) => setSettingsForm((f) => ({ ...f, min_referrals_required: parseInt(e.target.value) }))}
                placeholder="1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Minimum Deposit Amount (GH₵)</Label>
              <Input
                type="number"
                step="0.01"
                value={settingsForm.min_deposit_amount ?? ""}
                onChange={(e) => setSettingsForm((f) => ({ ...f, min_deposit_amount: parseFloat(e.target.value) }))}
                placeholder="10.00"
              />
              <p className="text-xs text-muted-foreground">Referred user must deposit at least this amount</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSettings} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  )
}
