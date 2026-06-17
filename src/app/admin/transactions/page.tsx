"use client"

import { useEffect, useState } from "react"
import { DataTable } from "@/components/admin/DataTable"
import { ArrowLeftRight, Activity } from "lucide-react"
import { toast } from "sonner"

export default function TransactionsPage() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [lastVerification, setLastVerification] = useState<string | null>(null)

  const verifyPendingTransactions = async () => {
    try {
      setIsVerifying(true)
      const res = await fetch("/api/admin/transactions/auto-verify", {
        method: "POST",
        credentials: "include",
      })
      const json = await res.json()
      if (json.success) {
        if (json.verified > 0) {
          toast.success(`Verified ${json.verified} transactions successfully`)
        }
        if (json.failed > 0) {
          toast.error(`${json.failed} transactions failed verification`)
        }
        setLastVerification(new Date().toLocaleTimeString())
      } else {
        toast.error(json.error || "Verification failed")
      }
    } catch (err) {
      console.error("Auto-verification error:", err)
    } finally {
      setIsVerifying(false)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      verifyPendingTransactions()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className={`h-4 w-4 ${isVerifying ? "animate-pulse" : ""}`} />
          <span>Auto-verifying pending transactions every 5 seconds</span>
          {lastVerification && <span className="text-xs">Last check: {lastVerification}</span>}
        </div>
      </div>
      <DataTable
        title="Transactions"
        tableName="transactions"
        icon={<ArrowLeftRight className="h-5 w-5" />}
        columns={[
          { key: "id", label: "ID" },
          { key: "type", label: "Type", type: "badge", badgeVariants: { DEPOSIT: "default", WITHDRAWAL: "secondary", AIRTIME: "outline", DATA: "outline", REFUND: "destructive", BONUS: "default", REFERRAL: "default" }, options: [{ value: "DEPOSIT", label: "Deposit" }, { value: "WITHDRAWAL", label: "Withdrawal" }, { value: "AIRTIME", label: "Airtime" }, { value: "DATA", label: "Data" }, { value: "REFUND", label: "Refund" }, { value: "BONUS", label: "Bonus" }, { value: "REFERRAL", label: "Referral" }] },
          { key: "status", label: "Status", type: "badge", badgeVariants: { SUCCESS: "default", PENDING: "secondary", FAILED: "destructive", REVERSED: "outline" }, bulkEditable: true, options: [{ value: "SUCCESS", label: "Success" }, { value: "PENDING", label: "Pending" }, { value: "FAILED", label: "Failed" }, { value: "REVERSED", label: "Reversed" }] },
          { key: "payment_method", label: "Payment Method", type: "badge", badgeVariants: { wallet: "default", paystack: "secondary", mtn: "outline", telecel: "outline", airteltigo: "outline" }, options: [{ value: "wallet", label: "Wallet" }, { value: "paystack", label: "Paystack" }, { value: "mtn", label: "MTN MoMo" }, { value: "telecel", label: "Telecel Cash" }, { value: "airteltigo", label: "AirtelTigo" }] },
          { key: "amount", label: "Amount", type: "number" },
          { key: "currency", label: "Currency", bulkEditable: true },
          { key: "user_id", label: "User ID" },
          { key: "reference", label: "Reference" },
          { key: "created_at", label: "Created", type: "date" },
        ]}
        searchableColumns={["user_id", "reference"]}
        defaultOrderBy="created_at"
      />
    </div>
  )
}
