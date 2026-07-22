"use client"

import { useState } from "react"
import useSWR from "swr"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/dashboard/page-header"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Repeat2,
  Wifi,
  Trash2,
  ToggleLeft,
  ToggleRight,
  CalendarClock,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/networks"

interface ScheduledPurchase {
  id: string
  network: string
  phone_number: string
  plan_id: string
  plan_name: string
  amount: number
  frequency: "daily" | "weekly" | "monthly"
  next_run_at: string
  is_active: boolean
  last_run_at: string | null
  run_count: number
  created_at: string
}

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" })
    .then((r) => r.json())
    .then((r) => {
      if (!r.success) throw new Error(r.error || "Failed to load")
      return r.data as ScheduledPurchase[]
    })

const NETWORKS = ["MTN", "AT", "Telecel", "AT Big Time"]
const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
]

export default function ScheduledPurchasesPage() {
  const { toast } = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [form, setForm] = useState({
    network: "MTN",
    phone_number: "",
    plan_id: "",
    plan_name: "",
    amount: "",
    frequency: "weekly" as "daily" | "weekly" | "monthly",
  })

  const { data: purchases = [], isLoading, isValidating, mutate, error } = useSWR<ScheduledPurchase[]>(
    "/api/scheduled-purchases",
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 10_000 }
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.phone_number || !form.plan_name || !form.amount) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" })
      return
    }
    const amt = parseFloat(form.amount)
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid amount.", variant: "destructive" })
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch("/api/scheduled-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, plan_id: form.plan_id || form.plan_name.toLowerCase().replace(/\s+/g, "-"), amount: amt }),
        credentials: "include",
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Scheduled!", description: `${form.plan_name} will auto-purchase ${form.frequency}.` })
        setShowCreate(false)
        setForm({ network: "MTN", phone_number: "", plan_id: "", plan_name: "", amount: "", frequency: "weekly" })
        mutate()
      } else {
        toast({ title: "Error", description: result.error || "Failed to create schedule.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await fetch("/api/scheduled-purchases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !current }),
        credentials: "include",
      })
      mutate()
      toast({ title: !current ? "Activated" : "Paused", description: `Schedule ${!current ? "resumed" : "paused"} successfully.` })
    } catch {
      toast({ title: "Error", description: "Failed to update schedule.", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await fetch("/api/scheduled-purchases", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget }),
        credentials: "include",
      })
      mutate()
      toast({ title: "Deleted", description: "Scheduled purchase removed." })
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" })
    } finally {
      setDeleteTarget(null)
    }
  }

  const freqLabel = (f: string) => FREQUENCIES.find((x) => x.value === f)?.label ?? f

  const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
  const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } } }

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Recurring Purchases"
        description="Automate data bundle purchases on a schedule — funded from your wallet"
        backHref="/dashboard"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => mutate()}
              disabled={isValidating}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-lg px-2.5 py-2 hover:bg-muted disabled:opacity-40"
              aria-label="Refresh"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isValidating && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Button size="sm" className="gap-2 h-9" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              New Schedule
            </Button>
          </div>
        }
      />

      {/* How it works info strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
      >
        <CalendarClock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">How recurring purchases work</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            At your chosen interval, Topchart automatically purchases the specified data bundle and deducts the amount from your wallet. Ensure your wallet has sufficient balance before each run.
          </p>
        </div>
      </motion.div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error.message || "Failed to load schedules."}</p>
          <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isValidating}>
            <RefreshCw className={cn("h-3.5 w-3.5 mr-2", isValidating && "animate-spin")} />
            Retry
          </Button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-lg skeleton shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 skeleton" />
                <div className="h-2.5 w-28 skeleton" />
              </div>
              <div className="h-6 w-16 skeleton rounded-full" />
            </div>
          ))}
        </div>
      ) : purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-4">
            <Repeat2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No recurring purchases yet</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mb-5">
            Set up automatic data bundle purchases that run on a daily, weekly, or monthly schedule.
          </p>
          <Button size="sm" className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Create your first schedule
          </Button>
        </div>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
          <AnimatePresence>
            {purchases.map((p) => (
              <motion.div key={p.id} variants={item} className="flex items-center gap-4 p-4">
                {/* Icon */}
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                  p.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <Wifi className="h-5 w-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{p.plan_name}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                      {p.network}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.phone_number} &middot; {freqLabel(p.frequency)} &middot; {formatCurrency(p.amount)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Next run: {new Date(p.next_run_at).toLocaleDateString("en-GH", { month: "short", day: "numeric", year: "numeric" })}
                    {p.run_count > 0 && ` · Ran ${p.run_count}×`}
                  </p>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "text-[10px] font-semibold rounded-full px-2 py-0.5",
                    p.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  )}>
                    {p.is_active ? "Active" : "Paused"}
                  </span>
                  <button
                    onClick={() => handleToggle(p.id, p.is_active)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    aria-label={p.is_active ? "Pause schedule" : "Resume schedule"}
                  >
                    {p.is_active ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    aria-label="Delete schedule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">New Recurring Purchase</DialogTitle>
            <DialogDescription className="text-xs">
              Configure a data bundle to purchase automatically on a schedule.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="network" className="text-xs font-medium text-muted-foreground">Network</Label>
                <select
                  id="network"
                  value={form.network}
                  onChange={(e) => setForm({ ...form, network: e.target.value })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {NETWORKS.map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="frequency" className="text-xs font-medium text-muted-foreground">Frequency</Label>
                <select
                  id="frequency"
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value as "daily" | "weekly" | "monthly" })}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">Phone Number</Label>
              <Input
                id="phone"
                value={form.phone_number}
                onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                placeholder="024 000 0000"
                required
                className="h-10 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan_name" className="text-xs font-medium text-muted-foreground">Data Plan Name</Label>
              <Input
                id="plan_name"
                value={form.plan_name}
                onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                placeholder="e.g. MTN 5GB Monthly"
                required
                className="h-10 bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-xs font-medium text-muted-foreground">Amount (GHS)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                required
                className="h-10 bg-background"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 gap-2" disabled={isSaving}>
                {isSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</> : <><Plus className="h-3.5 w-3.5" />Create Schedule</>}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This recurring purchase will be permanently removed and will no longer run.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
