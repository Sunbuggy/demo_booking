# SunBuggy Fun Rentals Booking App

Welcome to the SunBuggy Fun Rentals Booking App! This app allows customers to easily book exciting outdoor activities and rentals in Las Vegas, Nevada, while providing a comprehensive HR and Fleet Management system for staff.

## Features

### Customer Features
- **Browse and Search:** Explore a wide range of outdoor activities and rentals (ATVs, Dune Buggies, UTVs).
- **Rich Details:** View detailed descriptions, photos, and pricing information for each activity.
- **Live Booking:** Check availability and book directly from the app.
- **Customization:** Select dates, times, and participant numbers.
- ** Instant Confirmation:** Automated email confirmations and booking details.
- **Booking Management:** View past reservations and make changes.

### Staff & HR Management (New!)
- **Digital Roster:** A drag-and-drop style scheduler for managing employee shifts across multiple locations (Las Vegas, Pismo, Michigan).
- **Timeclock Integration:** View live clock-in status for employees directly on the roster.
- **Role-Based Access Control (RBAC):**
    - **Admin (Level 900+):** Full system access, including the ability to **Archive Employees** and manage sensitive settings.
    - **Manager (Level 500 - 899):** Can **create, edit, and delete shifts**, and update employee profiles (phone, avatar, department). *Cannot archive employees.*
    - **Employee (Level < 500):** View-only access to the schedule. Can use the internal **Contact Bubble** to message coworkers.
- **Audit Logging:**
    - Every change to a shift or employee profile is logged in the database.
    - **Change Log Viewer:** Managers can click the **Info Icon (ℹ️)** on any shift or profile to see a history of *who* changed it and *when*.

## Installation

To use the SunBuggy Fun Rentals Booking App, follow these steps:

1. Clone this repository to your local machine.
2. Install the required dependencies by running `npm install` (or `pnpm install`).
3. Start the app by running `npm run dev` (or `pnpm dev`).
4. Open your web browser and navigate to `http://localhost:3000`.

## Usage

### For Customers
Once the app is up and running, select your desired location (Las Vegas, Pismo, or Silver Lake) to browse activities. Use the search bar or category filters to find specific adventures.

### For Staff
Log in using your staff credentials.
- **Schedule:** Navigate to `/biz/schedule` to view the roster.
- **Profile:** Go to `/account` to view your stats, scan history, and update your personal details.

## Contributing

We welcome contributions from the community to enhance the SunBuggy Fun Rentals Booking App. If you have any suggestions, bug reports, or feature requests, please submit them through the GitHub issue tracker.

## License

This project is licensed under the [MIT License](LICENSE).