import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, LayoutDashboard, Home, HelpCircle } from "lucide-react"

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 animate-in fade-in zoom-in duration-500">
        <Search className="w-10 h-10" />
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">404</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-4">Page Not Found</h2>
      
      <p className="text-muted-foreground max-w-md mb-8">
        The dashboard page you are looking for doesn&apos;t exist or has been moved.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild variant="default" className="gap-2 h-11 px-6 shadow-lg shadow-primary/20">
          <Link href="/dashboard">
            <LayoutDashboard className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2 h-11 px-6">
          <Link href="/dashboard/tickets">
            <HelpCircle className="w-4 h-4" />
            Contact Support
          </Link>
        </Button>
      </div>
    </div>
  )
}
