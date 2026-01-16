# 🗺️ SunBuggy Database Atlas

**Version:** 1.1 (Migration & Dual-Write Phase)  
**Status:** In-Development / Active Migration  
**Context:** Multi-Location Adventure Operations (Pismo, Vegas, Michigan)

---

## 1. Core Philosophy

### A. Universal Identity
We do not separate "Customers" from "Staff" at the database root.
* **`users` table:** The center of the universe. Stores **Identity** (Who are you?).
* **Extensions:** * If they work here → Row exists in `employee_details`.
    * If they book here → Row exists in `customers` (profile data).
    * **Fun License:** Linked directly to `users`. Anyone (Staff or Guest) can have one.

### B. The "3-Layer" Booking Architecture
To support complex group dynamics (e.g., Corporate events with 300 pax) and future API integrations (Octo, Viator), a booking is not a single row. It is a hierarchy:

1.  **The Header (Transaction):** Who pays? When is it? Status? (`bookings`)
2.  **The Manifest (Participants):** Who is physically present? (`booking_participants`)
3.  **The Assets (Fleet):** What physical machines are reserved? (`booking_resources`)

---

## 2. 🔄 Legacy Migration Strategy (The Strangler Pattern)

We are migrating Las Vegas reservations from a legacy MySQL database to Supabase without downtime. We use the **"Strangler Fig"** pattern: building the new system around the old one until the old one can be turned off.

### A. The "Bridge" Schema
We have modified the `bookings` table to strictly link new records to their legacy counterparts.

| Supabase Column | Type | Purpose |
| :--- | :--- | :--- |
| **`legacy_id`** | `INT (Unique)` | The Primary Key from the old MySQL `Reservations` table. **Critical for Sync.** |
| **`operational_metadata`** | `JSONB` | Stores the *entire* raw legacy row snapshot. Ensures no data loss during migration. |

### B. The Transformation Logic (Adapter)
Legacy reservations are "Flat" (one row per booking). The Adapter (`utils/old_db/actions.ts`) explodes them into the 3-Layer Schema:

1.  **Identity Resolution:**
    * If `email` exists in `users`, link to it.
    * If not, create a **Shadow User** (Placeholder) to satisfy Foreign Key constraints.
2.  **Resource Explosion:**
    * *Legacy:* `SB2 (Two Seaters) = 2`
    * *New:* Inserts **2 separate rows** into `booking_resources` with `type = 'BUGGY_2_SEATER'`.
3.  **Participant Explosion:**
    * *Legacy:* `ppl_count = 5`
    * *New:* Inserts **1 Renter** row + **4 Passenger** rows into `booking_participants`.

### C. The Dual-Write Protocol (Go-Live Strategy)
To ensure legacy tools (phone staff/reports) continue working while we launch the new dashboard:

1.  **Read Path:** The New Dashboard reads strictly from **Supabase**.
2.  **Sync Job:** A background process runs every 5 minutes:
    * `SELECT * FROM legacy WHERE updated_at > last_sync`
    * Upsert into Supabase using `legacy_id`.
3.  **Write Path (New Bookings):**
    * **Step 1:** Write to Supabase (The Master Record).
    * **Step 2:** Write to Legacy MySQL (The Backup).
    * **Step 3:** Update Supabase row with the returned `legacy_id`.

---

## 3. Domain Map (Target State)

### 🟡 Domain: Commerce & Bookings (The 3-Layer System)
*This is the Unified Booking Schema replacing distinct `pismo_` and `vegas_` tables.*

#### Layer 1: The Header (`bookings`)
The financial and temporal container. Represents the "Contract".

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key (Public Reference). |
| `location_id` | UUID | Links to Pismo, Vegas, or MI. |
| `customer_id` | UUID | The "Renter" or "Lead Pax" (User who pays). |
| `status` | ENUM | `CONFIRMED`, `PENDING`, `CANCELLED`, `COMPLETED`. |
| `start_at` | TIMESTAMPTZ | **UTC** Start Time. |
| `end_at` | TIMESTAMPTZ | **UTC** End Time. |
| `group_name` | TEXT | Optional (e.g., "Smith Bachelor Party"). |
| `legacy_id` | INT | **Bridge ID** to old MySQL database. |
| `operational_metadata` | JSONB | Location specifics & Legacy Snapshots. |

#### Layer 2: The Manifest (`booking_participants`)
The operational reality. Explodes 1 Booking into N People.
*Critical for:* Waivers, Check-in Kiosks, "Fun License" scans.

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `id` | UUID | PK. |
| `booking_id` | UUID | FK to Header. |
| `user_id` | UUID | Link to `users`. Nullable for "Guest of X" until check-in. |
| `role` | ENUM | `PRIMARY_RENTER`, `DRIVER`, `PASSENGER`, `MINOR`. |
| `waiver_status` | ENUM | `SIGNED`, `PENDING`. |
| `check_in_status` | ENUM | `EXPECTED`, `CHECKED_IN`, `NO_SHOW`. |
| `temp_name` | TEXT | "John Doe" (Used if User ID is not yet linked). |

#### Layer 3: The Assets (`booking_resources`)
The inventory lock.
*Critical for:* Availability calculations and Pit Boss assignments.

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `id` | UUID | PK. |
| `booking_id` | UUID | FK to Header. |
| `resource_type_id` | TEXT | What *kind* of vehicle? (e.g., 'BUGGY_4_SEATER'). |
| `assigned_vehicle_id` | UUID | Specific VIN assigned (filled by Pit Boss). |

---

### 🟢 Domain: Identity & Access

| Table | Status | Purpose |
| :--- | :--- | :--- |
| **`users`** | Core | Supabase Auth Link. Name, Email, Avatar, Fun License ID. |
| **`customer_waivers`** | Core | Links SmartWaiver IDs to `users`. |
| **`qr_history`** | Active | Logs Fun License scans at kiosks/gates. |

---

### 🟢 Domain: HR & Staffing

| Table | Status | Purpose |
| :--- | :--- | :--- |
| **`employee_details`** | Core | Sensitive info. `payroll_company`, `dialpad_number`. **Strict RLS.** |
| **`employee_schedules`** | Core | The Roster Grid data. |
| **`time_entries`** | Core | Payroll Clock In/Out. |
| **`time_off_requests`** | Core | Approval workflow for staff. |

---

### 🟢 Domain: Fleet Command

| Table | Status | Purpose |
| :--- | :--- | :--- |
| **`vehicles`** | Master | Inventory. VIN, Year, Make, Model, Status. |
| **`vehicle_inspections`** | Modern | Replaces `pretrip_*`. Uses JSONB for checklist questions. |
| **`vehicle_tag`** | High Vol | Maintenance tickets. Status: `OPEN`, `CLOSED`, `PARTS_ORDERED`. |
| **`vehicle_locations`** | High Vol | Real-time GPS history log. |

---

## 4. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "makes"
    USERS ||--o| EMPLOYEE_DETAILS : "has"
    USERS ||--o{ BOOKING_PARTICIPANTS : "is"
    
    BOOKINGS ||--|{ BOOKING_PARTICIPANTS : "contains"
    BOOKINGS ||--|{ BOOKING_RESOURCES : "reserves"
    
    VEHICLES ||--o{ BOOKING_RESOURCES : "fulfills"
    VEHICLES ||--o{ VEHICLE_INSPECTIONS : "undergoes"
    VEHICLES ||--o{ VEHICLE_TAG : "has_maintenance"
    
    LOCATIONS ||--o{ BOOKINGS : "hosts"
    LOCATIONS ||--o{ VEHICLES : "stores"