# PostgreSQL Database Design & Setup Guide

**Version:** v3.0
**Database:** PostgreSQL
**Project:** IRIS
**Purpose:** Enterprise Asset Tracking, Attendance Inference & Device Health Monitoring

---

# Overview

IRIS uses PostgreSQL as the primary relational datastore for:

* Enterprise asset lifecycle management
* Employee-device assignment tracking
* Attendance inference through asset presence events
* Device health monitoring
* Role-based access control (RBAC)
* Location-aware office monitoring

The schema is designed with:

* UUID-based primary keys
* Referential integrity enforcement
* Partial indexing for business rules
* Audit-friendly timestamp tracking
* Cascading cleanup for dependent records
* Optimized lookup indexes for event processing

---

# Database Setup

```sql
-- Create database
CREATE DATABASE iris_db;

-- Connect to database
\c iris_db

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

# Enum Types

## Asset Status

```sql
CREATE TYPE asset_status AS ENUM (
  'AVAILABLE',
  'DEPLOYED',
  'MAINTENANCE'
);
```

## Assignment Status

```sql
CREATE TYPE assignment_status AS ENUM (
  'ACTIVE',
  'RETURNED'
);
```

## Presence Event Type

```sql
CREATE TYPE presence_event_type AS ENUM (
  'ENTER',
  'EXIT'
);
```

---

# Core Tables

## Locations

Stores office and geofenced location metadata.

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  location_name VARCHAR(100) NOT NULL,
  office_name VARCHAR(100),

  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),

  radius_meters INT,

  last_known_network VARCHAR(100),

  is_office BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Constraints & Indexes

```sql
-- Allow only one primary office location
CREATE UNIQUE INDEX one_office_location
ON locations(is_office)
WHERE is_office = true;
```

---

## Roles

Defines RBAC role hierarchy.

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  role_name VARCHAR(50) UNIQUE NOT NULL,

  approval_level INT DEFAULT 0
);
```

---

## Permissions

Stores granular RBAC permissions.

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  permission_name VARCHAR(50) UNIQUE NOT NULL
);
```

---

## Role Permissions

Many-to-many mapping between roles and permissions.

```sql
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,

  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,

  PRIMARY KEY (role_id, permission_id)
);
```

---

## Employees

Stores employee profile and organizational metadata.

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

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Assets

Stores enterprise hardware inventory.

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

## Asset Assignments

Tracks device allocation history between employees and assets.

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

### Constraints & Indexes

```sql
-- Ensure only one active assignment exists per asset
CREATE UNIQUE INDEX one_active_assignment_per_asset
ON asset_assignments(asset_id)
WHERE status = 'ACTIVE';
```

---

## Asset Presence Events

Stores real-time asset entry/exit events for attendance inference.

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

### Performance Index

```sql
CREATE INDEX idx_presence_asset_time
ON asset_presence_events(asset_id, event_time DESC);
```

---

## Attendance Daily

Stores computed daily attendance summaries.

```sql
CREATE TABLE attendance_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  employee_id UUID NOT NULL REFERENCES employees(id),

  attendance_date DATE NOT NULL,

  first_entry_time TIMESTAMPTZ,
  last_entry_time TIMESTAMPTZ,
  last_exit_time TIMESTAMPTZ,

  total_duration_minutes INT,

  status VARCHAR(20),

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(employee_id, attendance_date)
);
```

### Attendance Constraints

```sql
ALTER TABLE attendance_daily
ADD CONSTRAINT attendance_status_check
CHECK (
  status IN (
    'PRESENT',
    'ABSENT',
    'HALF_DAY',
    'LEAVE'
  )
);
```

---

## Device Health

Stores AI/ML inferred hardware health predictions for enterprise assets.

```sql
CREATE TABLE device_health (
  asset_id UUID PRIMARY KEY
    REFERENCES assets(id) ON DELETE CASCADE,

  predicted_label TEXT NOT NULL,

  status VARCHAR(20) NOT NULL,

  cpu_label VARCHAR(20) NOT NULL,

  battery INT NOT NULL,

  last_updated TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT device_health_battery_check
    CHECK (battery >= 0 AND battery <= 100)
);
```

### Performance Index

```sql
CREATE INDEX idx_device_health_status
ON device_health(status);
```

---

# Current System States

## Asset Status Values

```text
AVAILABLE
DEPLOYED
MAINTENANCE
```

## Attendance Status Values

```text
PRESENT
ABSENT
HALF_DAY
LEAVE
```

## Device Health Status Values

Observed values currently in use:

```text
CRITICAL
```

## Device Prediction Labels

Observed prediction labels:

```text
Disk_Failure
Overheating
```

---

# Seed Data

## Permissions

```sql
INSERT INTO permissions(permission_name) VALUES
('VIEW_ASSETS'),
('ASSIGN_ASSETS'),
('UPDATE_ASSETS'),
('DELETE_ASSETS'),
('VIEW_REPORTS');
```

## Roles

```sql
INSERT INTO roles(role_name, approval_level) VALUES
('ADMIN', 10),
('IT_MANAGER', 7),
('EMPLOYEE', 1);
```

---

# Referential Relationships

| Source Table          | Foreign Key   | Target Table |
| --------------------- | ------------- | ------------ |
| employees             | location_id   | locations    |
| assets                | location_id   | locations    |
| asset_assignments     | asset_id      | assets       |
| asset_assignments     | employee_id   | employees    |
| asset_presence_events | asset_id      | assets       |
| asset_presence_events | location_id   | locations    |
| attendance_daily      | employee_id   | employees    |
| device_health         | asset_id      | assets       |
| role_permissions      | role_id       | roles        |
| role_permissions      | permission_id | permissions  |

---

# Verification

## List Tables

```sql
\dt
```

Expected tables:

```text
asset_assignments
asset_presence_events
assets
attendance_daily
device_health
employees
locations
permissions
role_permissions
roles
```

---

# Design Notes

* UUIDs are used for distributed-safe identifier generation.
* Partial indexes enforce business constraints efficiently.
* Cascading deletes maintain referential consistency.
* Presence events are append-only for auditability.
* Attendance records are derived summaries, not raw event logs.
* `device_health` maintains a 1:1 relationship with assets.
* Geofencing support is implemented through latitude, longitude, and radius metadata.
* RBAC is normalized using a many-to-many permission model.
