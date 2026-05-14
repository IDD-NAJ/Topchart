import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, Search, LifeBuoy } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10 selection:text-primary">
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden pt-28 pb-20 px-4">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(45%_40%_at_50%_50%,rgba(var(--primary-rgb),0.05)_0%,transparent_100%)] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-full max-h-[600px] bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_20%,transparent_100%)] pointer-events-none" />

        <div className="relative z-10 max-w-2xl w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 text-primary mb-8 animate-in fade-in zoom-in duration-500">
            <Search className="w-10 h-10" />
          </div>

          <h1 className="text-8xl font-black tracking-tighter text-foreground/10 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none">
            404
          </h1>

          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-6">
            Page Not Found
          </h2>
          
          <p className="text-lg text-muted-foreground mb-12 max-w-md mx-auto leading-relaxed">
            The page you are looking for Last Namesn&apos;t exist or has been moved to another URL.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-12 px-8 font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-8 font-semibold bg-background/50 backdrop-blur-sm transition-all active:scale-95"
            >
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Link>
            </Button>
          </div>

          <div className="mt-16 pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <LifeBuoy className="w-4 h-4 text-primary" />
              Need help? <Link href="/about#contact" className="text-primary hover:underline font-medium">Contact Support</Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
