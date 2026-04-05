import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, LayoutDashboard, Home } from "lucide-react"

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-[#006994]/10 flex items-center justify-center text-[#006994] mb-6">
        <Search className="w-10 h-10" />
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">404</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-4">Resource Not Found</h2>
      
      <p className="text-muted-foreground max-w-md mb-8">
        The administrative resource or page you are looking for does not exist or you do not have permission to view it.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild variant="default" className="gap-2">
          <Link href="/admin">
            <LayoutDashboard className="w-4 h-4" />
            Admin Dashboard
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/">
            <Home className="w-4 h-4" />
            Main Website
          </Link>
        </Button>
      </div>
    </div>
  )
}
