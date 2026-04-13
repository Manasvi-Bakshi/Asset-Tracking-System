# Asset Tracking System

A modern, event-driven **Asset Management System** for enterprises, featuring real-time asset assignment, employee attendance tracking, and robust data integration. Built as a full-stack monorepo with a clean separation of backend and frontend, this project is designed for extensibility, learning, and real-world use.


##  Overview

- **Event-driven attendance engine**: Attendance is automatically created and updated based on device presence events (ENTER/EXIT).
- **Asset assignment tracking**: Assign assets to employees and view real-time status.
- **Admin & Employee dashboards**: Role-based UI for managing and viewing assets, attendance, and assignments.
- **Relational database**: Clean PostgreSQL schema with enforced relationships.
- **Separation of concerns**: Backend owns business logic; frontend is a pure data consumer.
- **Extensible architecture**: Designed for easy addition of features like device health, geofencing, and authentication.


##  How It Works

### High-Level Workflow

1. **Admin assigns assets** to employees via the dashboard.
2. **Employees check in/out** by triggering presence events (e.g., via RFID, GPS, or manual action).
3. **Backend processes events**:
    - Stores raw events in `asset_presence_events`
    - Derives daily attendance in `attendance_daily`
    - Calculates durations and status automatically
4. **Frontend dashboards** display real-time data for admins and employees.

### Data Flow

```
Frontend (React) 
   ↓
API calls (Express)
   ↓
Backend routes
   ↓
PostgreSQL (raw SQL)
```

---

## ⚙️ Setup & Installation

### Prerequisites

- **Node.js** v22+ (for backend and frontend)
- **PostgreSQL** (running locally or remotely)
- **npm** (Node package manager)

### 1. Clone the Repository

```bash
git clone (this repo)
cd Asset-Managment
```

### 2. Backend Setup

Configure your database connection in backend/.env
- DB_HOST=localhost
- DB_USER=postgres
- DB_PASSWORD=yourpassword
- DB_NAME=iris_db

```bash
cd backend
npm install
npm start
# Backend runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

### 4. Database Setup

- Ensure your PostgreSQL instance is running.
- Create the required tables as described in `DB_Setup.md`.
- Tables used: `employees`, `assets`, `asset_assignments`, `attendance_daily`, `asset_presence_events`, `locations`, `roles`, `permissions`, `role_permissions`.


##  Usage

### Example Workflow

1. **Admin logs in** and assigns assets to employees.
2. **Employee logs in** (using their EUID, e.g., `EMP001`).
3. **Employee triggers presence events** (e.g., entering/exiting office).
4. **Attendance is automatically recorded** and visible on the dashboard.


##  Future Improvements

- **Authentication & RBAC**: JWT-based login, enforce role-based access.
- **Geofencing & WLAN Validation**: GPS radius and WiFi network checks for presence.
- **Device Health Engine**: Integrate AI/ML for device health monitoring.
- **Excel Import**: Bulk upload for employees and attendance.
- **RFID Integration**: Real hardware event ingestion.
- **Production Hardening**: Input validation, error handling, and security.


**To get started:**

1. Fork the repo and clone your copy
2. Set up your environment as described above
3. Open an issue or pull request with your changes

**Let’s build something great together!**
