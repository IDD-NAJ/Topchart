import React from "react"
import { cn } from "@/lib/utils"

interface AdminPageShellProps {
  title: string
  description?: string
  icon?: React.ElementType
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function AdminPageShell({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className,
}: AdminPageShellProps) {
  return (
    <div className={cn("flex flex-col gap-6 p-4 sm:p-6", className)}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon && (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl mt-0.5"
              style={{ backgroundColor: "var(--marketing-accent,#F38F20)" }}
            >
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">{title}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: React.ReactNode
  sub?: string
  icon?: React.ElementType
  accent?: boolean
}

export function StatCard({ label, value, sub, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className={cn("mt-1 text-3xl font-black tracking-tight", accent && "text-[color:var(--marketing-accent,#F38F20)]")}>
            {value}
          </p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  )
}

export function AdminTableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {children}
    </div>
  )
}

export function AdminTableHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      {children}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon?: React.ElementType
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {Icon && <Icon className="h-10 w-10 text-muted-foreground/30" />}
      <div>
        <p className="font-semibold text-muted-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground/70">{description}</p>}
      </div>
    </div>
  )
}
