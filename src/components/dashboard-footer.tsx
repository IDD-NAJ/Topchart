import Link from "next/link"
import { Zap, Mail, ShieldCheck } from "lucide-react"

export function DashboardFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted/20 animate-in fade-in duration-700">
      <div className="container mx-auto px-4 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary animate-in zoom-in duration-500 delay-100">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Topchart</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Fast, reliable airtime & data top-ups for Ghanaian networks.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Quick links</p>
            <div className="flex flex-col gap-2 text-sm">
              <Link className="text-muted-foreground hover:text-foreground transition-colors" href="/dashboard">
                Dashboard
              </Link>
              <Link className="text-muted-foreground hover:text-foreground transition-colors" href="/dashboard/airtime">
                Buy airtime
              </Link>
              <Link className="text-muted-foreground hover:text-foreground transition-colors" href="/dashboard/data">
                Buy data
              </Link>
              <Link className="text-muted-foreground hover:text-foreground transition-colors" href="/dashboard/history">
                Transaction history
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Support & legal</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>support@Topchartghana.com</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <Link className="hover:text-foreground transition-colors" href="/privacy">
                Privacy
              </Link>
              <span className="text-muted-foreground/50">·</span>
              <Link className="hover:text-foreground transition-colors" href="/terms">
                Terms
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
          {year} Topchart. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

