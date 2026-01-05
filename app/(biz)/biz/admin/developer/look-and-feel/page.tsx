// app/(biz)/admin/developer/look-and-feel/page.tsx
"use client"

/**
 * SUNBUGGY LIVING STYLE GUIDE
 * ===========================
 * Purpose: A developer-facing playground to test UI component consistency
 * across different themes (Light, Dark, High-Contrast/Outdoor).
 * * Access Level: 950 (DEV) ONLY 
 */

import React from "react"
import { useTheme } from "next-themes" // Using the provider we discussed
import { Button } from "@/components/ui/button" // Reusing standard components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function LookAndFeelPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="p-8 space-y-10 min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SunBuggy UI Design System</h1>
          <p className="text-muted-foreground mt-2">
            Standardized component reference. Current Theme: <span className="font-mono font-bold text-primary">{theme}</span>
          </p>
        </div>

        {/* THEME CONTROLLER - Live Testing Tool */}
        <div className="flex gap-2 p-2 bg-secondary/20 rounded-lg">
          <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>
            ☀️ Office (Light)
          </Button>
          <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>
            🌙 Night (Dark)
          </Button>
          <Button 
            variant={theme === 'high-contrast' ? 'default' : 'outline'} 
            onClick={() => setTheme('high-contrast')}
            className="border-2 border-primary"
          >
            👓 Field (High Contrast)
          </Button>
        </div>
      </div>

      {/* SECTION 1: ACTION BUTTONS (The Muscle) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-l-4 border-primary pl-3">1. Interactive Elements (Buttons)</h2>
        <p className="text-sm text-muted-foreground">Used for submitting forms, navigation, and critical actions.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <ComponentShowcase 
            name="Primary Action" 
            usage='<Button>Save</Button>'
            description="Main Call-to-Action. Use for 'Submit', 'Book Now'."
          >
            <Button>Confirm Booking</Button>
          </ComponentShowcase>

          <ComponentShowcase 
            name="Secondary Action" 
            usage='<Button variant="secondary">'
            description="Alternative actions. 'Cancel', 'Go Back'."
          >
            <Button variant="secondary">View Details</Button>
          </ComponentShowcase>

          <ComponentShowcase 
            name="Destructive Action" 
            usage='<Button variant="destructive">'
            description="High risk. 'Delete User', 'Cancel Reservation'."
          >
            <Button variant="destructive">Remove Fleet Vehicle</Button>
          </ComponentShowcase>

          <ComponentShowcase 
            name="Outline / Ghost" 
            usage='<Button variant="outline">'
            description="Low priority or filters."
          >
            <Button variant="outline">Filter: 2-Seaters</Button>
          </ComponentShowcase>
        </div>
      </section>

      {/* SECTION 2: STATUS INDICATORS (The Information) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-l-4 border-primary pl-3">2. Status Badges</h2>
        <p className="text-sm text-muted-foreground">Critical for the Roster and Fleet Status. Must be readable in sunlight.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <ComponentShowcase 
            name="Success / Active" 
            usage='<Badge variant="success">'
            description="Vehicle Ready / Shift Confirmed"
          >
            <Badge className="bg-green-600 hover:bg-green-700 text-white">Active</Badge>
          </ComponentShowcase>

          <ComponentShowcase 
            name="Warning / Pending" 
            usage='<Badge variant="warning">'
            description="Maintenance Due / Shift Request"
          >
            <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Maintenance Required</Badge>
          </ComponentShowcase>

          <ComponentShowcase 
            name="Error / Offline" 
            usage='<Badge variant="destructive">'
            description="Vehicle Broken / Shift Missed"
          >
            <Badge variant="destructive">Out of Service</Badge>
          </ComponentShowcase>
        </div>
      </section>

      {/* SECTION 3: CARDS & CONTAINERS */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-l-4 border-primary pl-3">3. Structural Cards</h2>
        <p className="text-sm text-muted-foreground">Used for Roster Shifts and Vehicle Profiles.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Standard Card</CardTitle>
            </CardHeader>
            <CardContent>
              This is the default container for content. It handles background contrast automatically.
            </CardContent>
          </Card>

          <Card className="border-2 border-primary/50 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary">Highlighted Card</CardTitle>
            </CardHeader>
            <CardContent>
              Use this style for "Active Selection" or "Current User".
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  )
}

// Helper Component to render the "Spec Card" for developers
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
    <div className="border rounded-lg p-4 flex flex-col gap-3 bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-center p-6 border-b border-dashed bg-background/50 rounded">
        {children}
      </div>
      <div>
        <h3 className="font-bold text-sm">{name}</h3>
        <code className="text-xs bg-muted px-1 py-0.5 rounded text-primary block mt-1 w-fit">
          {usage}
        </code>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}