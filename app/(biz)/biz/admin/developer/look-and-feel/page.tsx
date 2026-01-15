// app/(biz)/admin/developer/look-and-feel/page.tsx
"use client"

import React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function LookAndFeelPage() {
  const { theme, setTheme } = useTheme()

  return (
    // ADDED: A subtle gradient background so we can TEST the glass effect
    <div className="min-h-screen p-8 space-y-10 transition-colors duration-300 bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-300 dark:from-zinc-900 dark:via-zinc-950 dark:to-black">
      
      {/* HEADER SECTION (Now using Glass) */}
      <div className="glass rounded-xl p-6 flex flex-col md:flex-row justify-between items-center sticky top-4 z-50">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary drop-shadow-sm">SunBuggy Design System</h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Active Theme: <span className="font-mono text-primary uppercase">{theme}</span>
          </p>
        </div>

        {/* THEME CONTROLLER */}
        <div className="flex gap-2 p-1 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg backdrop-blur-sm">
          <Button size="sm" variant={theme === 'light' ? 'default' : 'ghost'} onClick={() => setTheme('light')}>
            ☀️ Office
          </Button>
          <Button size="sm" variant={theme === 'dark' ? 'default' : 'ghost'} onClick={() => setTheme('dark')}>
            🌙 Night
          </Button>
          <Button 
            size="sm"
            variant={theme === 'high-contrast' ? 'default' : 'ghost'} 
            onClick={() => setTheme('high-contrast')}
            className={theme === 'high-contrast' ? "border-2 border-white" : ""}
          >
            👓 Outdoor
          </Button>
        </div>
      </div>

      {/* SECTION 1: GLASSMORPHISM & DEPTH (NEW) */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-l-4 border-primary pl-3">1. Glassmorphism & Depth</h2>
        <p className="text-sm text-muted-foreground">
          The <code>.glass</code> class applies standard SunBuggy translucency. 
          <br/><strong>Note:</strong> In "Outdoor" mode, glass effects are disabled for contrast safety.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          {/* Visual Test Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-blue-500/20 rounded-xl -z-10 blur-xl" />

          {/* Standard Glass Card */}
          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="text-2xl">🧊</span> Standard Glass Panel
            </h3>
            <p className="text-sm opacity-90">
              This panel uses the <code>.glass</code> utility. Notice how you can faintly see the gradient blobs behind it. 
              The border is subtle white (in dark mode) or semi-transparent grey (in light mode).
            </p>
            <div className="flex gap-2">
              <Button size="sm">Action</Button>
              <Button size="sm" variant="secondary">Cancel</Button>
            </div>
          </div>

          {/* Nested Glass (Depth Test) */}
          <div className="glass rounded-xl p-6 flex flex-col items-center justify-center space-y-4">
             <h3 className="font-bold text-lg">Nested Depth</h3>
             <div className="glass p-4 rounded-lg w-full text-center border-2 border-white/20">
                Layer 2 (Floating)
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: BUTTONS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-l-4 border-primary pl-3">2. Interactive Elements</h2>
        
        <div className="glass rounded-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <ComponentShowcase 
            name="Primary" 
            usage='<Button>Save</Button>'
            description="Main Call-to-Action."
          >
            <Button>Confirm Booking</Button>
          </ComponentShowcase>

          <ComponentShowcase 
            name="Secondary" 
            usage='<Button variant="secondary">'
            description="Alternative actions."
          >
            <Button variant="secondary">View Details</Button>
          </ComponentShowcase>

          <ComponentShowcase 
            name="Destructive" 
            usage='<Button variant="destructive">'
            description="High risk actions."
          >
            <Button variant="destructive">Delete</Button>
          </ComponentShowcase>

          <ComponentShowcase 
            name="Outline" 
            usage='<Button variant="outline">'
            description="Low priority or filters."
          >
            <Button variant="outline">Filter Results</Button>
          </ComponentShowcase>
        </div>
      </section>

      {/* SECTION 3: BADGES */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-l-4 border-primary pl-3">3. Status Indicators</h2>
        
        <div className="glass rounded-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <ComponentShowcase 
            name="Success" 
            usage='bg-green-600'
            description="Vehicle Ready"
          >
            <Badge className="bg-green-600 text-white">Active</Badge>
          </ComponentShowcase>

          <ComponentShowcase 
            name="Warning" 
            usage='bg-yellow-500'
            description="Maintenance Due"
          >
            <Badge className="bg-yellow-500 text-black hover:bg-yellow-400">Maintenance</Badge>
          </ComponentShowcase>

          <ComponentShowcase 
            name="Critical" 
            usage='variant="destructive"'
            description="Out of Service"
          >
            <Badge variant="destructive">Offline</Badge>
          </ComponentShowcase>
        </div>
      </section>

    </div>
  )
}

// Helper Component
function ComponentShowcase({ 
  name, 
  usage, 
  description, 
  children 
}: { 
  name: string, 
  usage: string, 
  description: string, 
  children: React.ReactNode 
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center p-4 border border-zinc-200/50 dark:border-white/10 bg-white/40 dark:bg-black/20 rounded-lg backdrop-blur-sm">
        {children}
      </div>
      <div>
        <h3 className="font-bold text-sm">{name}</h3>
        <code className="text-[10px] bg-zinc-900 text-zinc-100 px-1 py-0.5 rounded block w-fit mt-1">
          {usage}
        </code>
      </div>
    </div>
  )
}