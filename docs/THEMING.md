# SunBuggy Theming & Semantic CSS Guide

**Version:** 1.0  
**Context:** Frontend Architecture (Next.js / Tailwind CSS / Shadcn UI)  
**Goal:** To ensure our application looks perfect in Light Mode, Dark Mode, and any future themes (High Contrast, Seasonal, etc.) without rewriting code.

---

## 1. The Core Philosophy (The "Why")

In the past, we styled things by saying **what color they are**.
* *Old Way:* "Make this button Blue." (`bg-blue-600`)
* *Old Way:* "Make this text Dark Gray." (`text-zinc-900`)

**The Problem:**
If "Dark Gray" text is on a "White" background, it looks great. But if the user switches to **Dark Mode**, the background becomes dark, and your "Dark Gray" text becomes invisible!

**The New Way (Semantic Styling):**
We style things by saying **what they are used for**.
* *New Way:* "Make this button the **Primary Brand Color**." (`bg-primary`)
* *New Way:* "Make this text the **Standard Text Color**." (`text-foreground`)

**The Magic:**
* In **Light Mode**, `text-foreground` automatically turns **Black**.
* In **Dark Mode**, `text-foreground` automatically turns **White**.
* You write the code **once**, and it works everywhere.

---

## 2. How It Works (The 3-Layer Cake)

We use a 3-layer system to make this magic happen. You usually only work in Layer 3, but understanding the whole system helps.

### Layer 1: The Definition (`app/globals.css`)
This is the **ONLY** place where actual colors (Hex codes, RGB values) live. We map "Semantic Variables" (like `--background`) to actual numbers.

```css
@layer base {
  /* ☀️ LIGHT MODE DEFAULTS */
  :root {
    --background: 0 0% 100%;       /* White */
    --foreground: 240 10% 3.9%;    /* Black Text */
    --card: 0 0% 100%;             /* White Cards */
    --border: 240 5.9% 90%;        /* Light Gray Borders */
    --primary: 240 5.9% 10%;       /* Dark Brand Color */
    --destructive: 0 84.2% 60.2%;  /* Red for Errors */
  }

  /* 🌙 DARK MODE OVERRIDES */
  /* When the class "dark" is added to the HTML tag, these values swap! */
  .dark {
    --background: 240 10% 3.9%;    /* Dark Gray Background */
    --foreground: 0 0% 98%;        /* White Text */
    --card: 240 10% 3.9%;          /* Dark Gray Cards */
    --border: 240 3.7% 15.9%;      /* Darker Gray Borders */
    --primary: 0 0% 98%;           /* White Brand Color */
    --destructive: 0 62.8% 30.6%;  /* Darker Red for Errors */
  }
}