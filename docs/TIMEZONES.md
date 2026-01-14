
# 🌍 Timezone Architecture & Migration Plan

## Overview
Currently, the application handles timezones by manually appending "Z" strings or hardcoding `America/Los_Angeles` in individual components. This approach is brittle (prone to "drift") and will break when the Michigan location opens in April.

**The Goal:** Centralize all date/time logic into a single utility library (`lib/time-utils.ts`) that handles conversions between **Browser Local Time**, **Location Specific Time**, and **Database UTC**.

## 1. Prerequisites
We rely on `date-fns-tz` to handle the heavy lifting of IANA timezones (e.g., handling Daylight Savings Time changes automatically).

```bash
npm install date-fns-tz

```

## 2. The Core Utility (`lib/time-utils.ts`)

This file becomes the **Single Source of Truth**. It must support dynamic timezones so we can pass "America/Detroit" for Michigan users in the future.

```typescript
// lib/time-utils.ts
import { format, toDate } from 'date-fns-tz';
import { parseISO } from 'date-fns';

// DEFAULT CONFIG (Fallback)
const DEFAULT_ZONE = 'America/Los_Angeles';

/**
 * 1. UI INPUT -> DATABASE (ISO UTC)
 * Takes a raw local string from <input type="datetime-local"> (e.g., "2026-04-14T08:00")
 * and converts it to a UTC ISO string based on the target location's timezone.
 * * @param localTimeStr - Value from HTML input
 * @param timeZone - Target location zone (e.g. 'America/Detroit')
 */
export function toUTC(localTimeStr: string, timeZone: string = DEFAULT_ZONE): string | null {
  if (!localTimeStr) return null;
  // Create a date object acting as if the time belongs to that zone, then grab ISO
  const zonedDate = toDate(localTimeStr, { timeZone });
  return zonedDate.toISOString();
}

/**
 * 2. DATABASE (ISO UTC) -> UI INPUT
 * Takes a UTC string from DB and formats it for <input type="datetime-local">
 * so the user sees the time relative to the specific location.
 */
export function toInputString(isoString: string | null, timeZone: string = DEFAULT_ZONE): string {
  if (!isoString) return '';
  return format(parseISO(isoString), "yyyy-MM-dd'T'HH:mm", { timeZone });
}

/**
 * 3. DISPLAY FORMATTING
 * Standardizes how we print dates across the app (Grids, PDFs, etc).
 */
export function formatLocationTime(
  isoString: string | null, 
  fmt: string = 'MMM d, h:mm a', 
  timeZone: string = DEFAULT_ZONE
): string {
  if (!isoString) return '--';
  try {
    return format(parseISO(isoString), fmt, { timeZone });
  } catch (err) {
    return 'Invalid Date';
  }
}

```

## 3. Implementation To-Do List

### Phase A: Setup & Centralization

* [ ] **Install Package**: Run `npm install date-fns-tz`.
* [ ] **Create Utility**: Create `lib/time-utils.ts` with the code above.
* [ ] **Global Replacement**: Search project for `new Date(str + 'Z')` or hardcoded `toLocaleTimeString` calls and replace them with `formatLocationTime()`.

### Phase B: Refactor Input Components (The Fix)

Update the Dialogs to stop doing manual math and use the utility.

* [ ] **`AddEntryDialog`**:
* Import `toUTC` from utils.
* Remove hidden `<input>` fields.
* On Submit: Call `toUTC(localStart, 'America/Los_Angeles')` before sending to Server Action.


* [ ] **`EditEntryDialog`**:
* Import `toInputString` (for default values) and `toUTC` (for saving).
* Use `toInputString(entry.start_time)` to set the initial state of the input.
* On Save: Convert back using `toUTC`.



### Phase C: Refactor Display Components

* [ ] **`TimesheetGrid`**: Replace the local `formatTime` helper with `formatLocationTime(date, 'h:mm a')`.
* [ ] **`CorrectionQueue`**: Replace `formatVegasTime` with `formatLocationTime`.
* [ ] **`ConflictResolver`**: Ensure the comparison modal uses `formatLocationTime` so the "Conflict" times match the "Request" times.

### Phase D: Michigan Expansion (April)

Once the code is modular, enabling Michigan is simple:

1. **Database**: Ensure the `locations` or `users` table has a `timezone` column (e.g., 'America/Detroit').
2. **Context**: Pass the current location's timezone prop into the Dashboard.
3. **Dynamic Wiring**:
```tsx
// Example usage in Dashboard
<AddEntryDialog 
   timeZone={currentUser.location.timezone} // e.g. 'America/Detroit'
   onSuccess={fetchData} 
/>

```



## 4. Maintenance Guidelines

* **Never** use `new Date()` for display logic on the server (it uses Server System Time, usually UTC).
* **Never** assume the user's browser is in the correct timezone (Admin in Vegas might be editing a Michigan timecard). Always force the timezone via the utility functions.
* **Always** store dates in Postgres as `TIMESTAMPTZ` (UTC).

```

```