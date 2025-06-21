import { Button } from "@/components/ui/button"
import { ArrowRight, Bot } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container z-10 flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2">
          <Bot className="h-7 w-7 text-accent" />
          <span className="font-heading text-xl font-bold text-white">Med-X</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/about" className="text-sm text-muted-foreground hover:text-white transition-colors">
            About
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <div className="relative container text-center">
          <div className="absolute -top-48 -left-48 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-glow -z-10"></div>
          <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-glow animation-delay-400 -z-10"></div>
          <h1 className="font-heading text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
            Direct Your AI Agent
          </h1>
          <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground md:text-xl">
            Go beyond simple generation. Deploy an autonomous AI agent to research, write, and optimize content with
            strategic precision.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="bg-accent text-black font-bold hover:bg-accent/90 accent-glow">
              <Link href="/generate">
                Launch Control Deck <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
