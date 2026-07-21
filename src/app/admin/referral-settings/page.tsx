export const dynamic = "force-dynamic";
export const revalidate = 0;

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

export default function ReferralSettingsPage() {
  const [rewardAmount, setRewardAmount] = useState("5.00")
  const [minInvites, setMinInvites] = useState("10")
  const [minDeposit, setMinDeposit] = useState("20.00")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/referral-settings")
      const data = await res.json()
      if (data.success) {
        setRewardAmount(data.data.rewardAmount.toString())
        setMinInvites(data.data.minInvites.toString())
        setMinDeposit(data.data.minDeposit.toString())
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
      toast.error("Failed to load referral settings")
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/referral-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardAmount: parseFloat(rewardAmount),
          minInvites: parseInt(minInvites),
          minDeposit: parseFloat(minDeposit),
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Referral settings updated successfully")
      } else {
        toast.error(data.error || "Failed to update settings")
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast.error("Failed to update referral settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Referral Settings</h1>
        <p className="text-muted-foreground">Configure referral reward amounts and withdrawal requirements</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Referral Reward Configuration</CardTitle>
          <CardDescription>
            Set the reward amount for successful referrals and minimum invites required for withdrawal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="rewardAmount">Reward Amount (GH₵)</Label>
            <Input
              id="rewardAmount"
              type="number"
              step="0.01"
              min="0"
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              placeholder="5.00"
            />
            <p className="text-sm text-muted-foreground">
              Amount credited to referrer when a referred user makes their first qualifying deposit (minimum GH₵10)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minInvites">Minimum Invites for Withdrawal</Label>
            <Input
              id="minInvites"
              type="number"
              min="1"
              value={minInvites}
              onChange={(e) => setMinInvites(e.target.value)}
              placeholder="10"
            />
            <p className="text-sm text-muted-foreground">
              Number of qualified referrals required before referral rewards can be withdrawn
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minDeposit">Minimum Deposit Requirement (GH₵)</Label>
            <Input
              id="minDeposit"
              type="number"
              step="0.01"
              min="0"
              value={minDeposit}
              onChange={(e) => setMinDeposit(e.target.value)}
              placeholder="20.00"
            />
            <p className="text-sm text-muted-foreground">
              Amount the referred user must deposit in a single transaction to become qualified
            </p>
          </div>

          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
