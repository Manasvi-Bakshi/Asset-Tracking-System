# PostgreSQL Database Design & Setup Guide

**Version:** v2.1
**Author:** Manasvi Bakshi
**Database:** PostgreSQL
**Purpose:** Asset & Attendance Tracking



## Overview

This document defines the PostgreSQL schema for IRIS.

System capabilities:

* Asset tracking
* Assignment history tracking
* Attendance inference via asset presence
* Role-based access control (RBAC)

Designed for production with auditability and relational best practices.




## Database Setup

```bash
# Create database
CREATE DATABASE iris_db;

# Connect
\c iris_db

# Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```



## Enum Types

```sql
CREATE TYPE asset_status AS ENUM (
  'AVAILABLE',
  'DEPLOYED',
  'MAINTENANCE'
);

CREATE TYPE assignment_status AS ENUM (
  'ACTIVE',
  'RETURNED'
);

CREATE TYPE presence_event_type AS ENUM (
  'ENTER',
  'EXIT'
);
```


## Table Definitions

### Locations

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_office BOOLEAN NOT NULL DEFAULT false,
  location_name VARCHAR(100) NOT NULL,
  office_name VARCHAR(100),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  last_known_network VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Roles

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name VARCHAR(50) UNIQUE NOT NULL,
  approval_level INT DEFAULT 0
);
```

---

### Permissions

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permission_name VARCHAR(50) UNIQUE NOT NULL
);
```

---

### Role Permissions

```sql
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);
```

---

### Employees

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  euid VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  email VARCHAR(100) UNIQUE NOT NULL,
  department VARCHAR(50),
  designation VARCHAR(50),
  location_id UUID REFERENCES locations(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Assets

```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_code VARCHAR(20) UNIQUE NOT NULL,
  asset_type VARCHAR(30),
  company VARCHAR(50),
  model VARCHAR(50),
  serial_number VARCHAR(50) UNIQUE,
  asset_tag VARCHAR(50),
  purchase_date DATE,
  warranty_expiry_date DATE,
  status asset_status DEFAULT 'AVAILABLE',
  location_id UUID REFERENCES locations(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Asset Assignments

```sql
CREATE TABLE asset_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  assignment_date DATE NOT NULL,
  expected_return_date DATE,
  actual_return_date DATE,
  status assignment_status DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

```sql
-- Ensure only one active assignment per asset
CREATE UNIQUE INDEX one_active_assignment_per_asset
ON asset_assignments(asset_id)
WHERE status = 'ACTIVE';
```

---

### Asset Presence Events

```sql
CREATE TABLE asset_presence_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),
  event_type presence_event_type NOT NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  source VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

```sql
-- Optimize latest event lookup
CREATE INDEX idx_presence_asset_time
ON asset_presence_events (asset_id, event_time DESC);
```

---

### Attendance Daily

```sql
CREATE TABLE attendance_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id),
  attendance_date DATE NOT NULL,
  first_entry_time TIMESTAMPTZ,
  last_entry_time TIMESTAMPTZ,
  last_exit_time TIMESTAMPTZ,
  total_duration_minutes INT,
  status VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (employee_id, attendance_date)
);
```

```sql
-- Enforce valid attendance states
ALTER TABLE attendance_daily
ADD CONSTRAINT attendance_status_check
CHECK (status IN (
  'PRESENT',
  'ABSENT',
  'HALF_DAY',
  'LEAVE'
));
```

---

## Seed Data

```sql
INSERT INTO permissions (permission_name) VALUES
('VIEW_ASSETS'),
('ASSIGN_ASSETS'),
('UPDATE_ASSETS'),
('DELETE_ASSETS'),
('VIEW_REPORTS');

INSERT INTO roles (role_name, approval_level) VALUES
('ADMIN', 10),
('IT_MANAGER', 7),
('EMPLOYEE', 1);
```

---

## Verification

```bash
\dt
```

Expected tables:

* asset_assignments
* asset_presence_events
* assets
* attendance_daily
* employees
* locations
* permissions
* role_permissions
* roles


