# LaptopHub

LaptopHub is a full-stack enterprise laptop management platform that helps organizations manage company laptops throughout their lifecycle. It combines laptop inventory, employee assignments, attendance inference, device health monitoring, and role-based access control into a single application.

Built with React, Node.js, Express, PostgreSQL, and machine learning, the project follows a layered architecture that separates the frontend, backend, and database for easier maintenance and future expansion.

---

## Features

- Laptop inventory and lifecycle management
- Employee laptop assignment tracking
- Attendance inference using laptop presence events
- Device health monitoring with machine learning
- Bulk laptop and employee onboarding through Excel
- Role-based access control (RBAC)
- Location-aware office monitoring
- Interactive dashboards for administrators and employees


## How It Works

### Workflow

1. An administrator imports employee and laptop data or assigns laptops manually.
2. Employees use their assigned laptops during the workday.
3. Laptop presence events are recorded whenever a device enters or leaves the office.
4. The backend processes these events to:
   - update laptop activity
   - infer employee attendance
   - calculate work duration
5. Device health predictions are generated and displayed alongside laptop information.
6. Dashboards provide administrators with a real-time view of laptops, attendance, assignments, and device health.

### Architecture

```text
React Frontend
        │
REST API (Express.js)
        │
Business Logic & Services
        │
Repository Layer
        │
PostgreSQL Database
        │
Machine Learning Module
```

---

## Tech Stack

### Frontend
- React

### Backend
- Node.js
- Express.js

### Database
- PostgreSQL

### Machine Learning
- Python
- Scikit-learn

---

## Getting Started

### Prerequisites

- Node.js (v22 or later)
- PostgreSQL
- npm

### Clone the Repository

```bash
git clone <repository-url>
cd LaptopHub
```

### Backend

Create a `.env` file inside the `backend` directory.

```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=iris_db
```

Install dependencies and start the server.

```bash
cd backend
npm install
npm start
```

Backend runs at:

```
http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

### Database

Create the database and tables using the SQL scripts provided in `DB_Setup.md`.

Core tables include:

- employees
- laptops (stored as `assets`)
- asset_assignments
- attendance_daily
- asset_presence_events
- device_health
- locations
- roles
- permissions
- role_permissions
