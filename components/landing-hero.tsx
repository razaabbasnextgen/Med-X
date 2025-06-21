"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, Cpu, FileText } from "lucide-react"
import Link from "next/link"

export function LandingHero() {
  return (
    <section className="relative w-full h-[calc(100vh-3.5rem)] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 animated-gradient-bg z-0"></div>
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50 z-0"></div> {/* Subtle overlay */}
      <div className="relative z-10 container px-4 md:px-6 text-center">
        <h1 className="font-heading text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl text-white drop-shadow-lg">
          Med-X
        </h1>
        <p className="mx-auto mt-4 max-w-[700px] text-gray-200 md:text-xl drop-shadow-sm">
          Revolutionizing Content Creation with AI. Generate insightful blogs effortlessly.
        </p>

        {/* Placeholder for 3D illustration */}
        <div className="my-12 flex justify-center items-center">
          <div className="w-64 h-64 md:w-80 md:h-80 bg-primary/30 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-secondary/50 animate-pulse-subtle">
            <FileText size={64} className="text-white/70" />
            <Cpu
              size={48}
              className="text-white/70 absolute opacity-50 animate-spin [animation-duration:10s]"
              style={{ top: "20%", left: "20%" }}
            />
            <ArrowRight size={32} className="text-white/70 absolute opacity-50" style={{ top: "45%", left: "45%" }} />
            <BarChart3
              size={40}
              className="text-white/70 absolute opacity-50"
              style={{ bottom: "25%", right: "25%" }}
            />
            <p className="absolute text-xs text-white/50 bottom-5">AI Document Transformation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-8">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg text-white">
            <h3 className="text-3xl font-bold">10,000+</h3>
            <p className="text-sm text-gray-300">Blogs Generated</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-lg text-white">
            <h3 className="text-3xl font-bold">500+</h3>
            <p className="text-sm text-gray-300">Happy Users</p>
          </div>
        </div>

        <Link href="/dashboard">
          <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold">
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  )
}
