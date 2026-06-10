# 🩺 Schedula — Doctor Appointment Scheduling API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="100" alt="Nest Logo" /></a>
</p>

<p align="center">
  A backend API for scheduling doctor appointments, built incrementally as a multi-day project using <a href="https://nestjs.com">NestJS</a>, TypeORM, and PostgreSQL.
</p>

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Setup](#-project-setup)
- [Environment Variables](#-environment-variables)
- [Database & Migrations](#-database--migrations)
- [API Reference](#-api-reference)
  - [Auth](#auth)
  - [Doctor Profile (Protected)](#doctor-profile-protected)
  - [Patient Profile (Protected)](#patient-profile-protected)
  - [Doctor Discovery (Public)](#doctor-discovery-public)
- [Project Structure](#-project-structure)
- [Development Progress](#-development-progress)

---

## 🛠 Tech Stack

| Layer        | Technology                       |
| ------------ | -------------------------------- |
| Framework    | NestJS 11                        |
| Language     | TypeScript 5                     |
| Database     | PostgreSQL                       |
| ORM          | TypeORM 1.x                      |
| Auth         | Passport + JWT                   |
| Validation   | class-validator, class-transformer |
| Password     | bcryptjs                         |

---

## 🚀 Project Setup

```bash
# 1. Clone the repository
git clone https://github.com/alimehdikhan/schedula-alimehdikhan.git
cd schedula-alimehdikhan

# 2. Install dependencies
npm install

# 3. Set up environment variables (see below)

# 4. Run database migrations
npm run migration:run

# 5. Start the dev server
npm run start:dev
```

The server starts at `http://localhost:3000` by default.

---

## 🔐 Environment Variables

Create a `.env` file in the project root (or set these in your environment):

| Variable           | Default      | Description                          |
| ------------------ | ------------ | ------------------------------------ |
| `PORT`             | `3000`       | Application port                     |
| `DB_HOST`          | `localhost`  | PostgreSQL host                      |
| `DB_PORT`          | `5432`       | PostgreSQL port                      |
| `DB_USERNAME`      | `postgres`   | PostgreSQL username                  |
| `DB_PASSWORD`      | `postgres`   | PostgreSQL password                  |
| `DB_NAME`          | `schedula`   | PostgreSQL database name             |
| `JWT_SECRET`       | —            | Secret key for signing JWT tokens    |
| `DB_MIGRATIONS_RUN`| `false`      | Auto-run migrations on startup       |

---

## 🗄 Database & Migrations

Schedula uses TypeORM migrations (no `synchronize: true` in production).

```bash
# Run all pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Generate a new migration from entity changes
npm run migration:generate
```

### Migrations

| Migration | Description |
| --------- | ----------- |
| `1780916400000-CreateUsersAndProfiles` | Creates `users`, `doctor_profiles`, and `patient_profiles` tables with constraints and foreign keys |
| `1749500000000-AddDoctorAvailabilityStatus` | Adds `is_available` boolean column to `doctor_profiles` |

### Database Schema

| Table              | Key Columns |
| ------------------ | ----------- |
| `users`            | `id`, `email` (unique), `password`, `role` (DOCTOR/PATIENT), `created_at`, `updated_at` |
| `doctor_profiles`  | `id`, `user_id` (FK → users, unique), `full_name`, `specialization`, `experience`, `qualification`, `consultation_fee`, `availability`, `profile_details`, `is_available`, `created_at`, `updated_at` |
| `patient_profiles` | `id`, `user_id` (FK → users, unique), `full_name`, `age`, `gender` (MALE/FEMALE/OTHER), `contact_details`, `health_information`, `created_at`, `updated_at` |

---

## 📡 API Reference

### Auth

| Method | Endpoint       | Auth | Description |
| ------ | -------------- | ---- | ----------- |
| `POST` | `/auth/signup`  | —    | Register a new user (DOCTOR or PATIENT) |
| `POST` | `/auth/login`   | —    | Login and receive a JWT access token |

**POST `/auth/signup`**
```json
{
  "email": "doctor@example.com",
  "password": "securePassword123",
  "role": "DOCTOR"
}
```

**POST `/auth/login`**
```json
{
  "email": "doctor@example.com",
  "password": "securePassword123"
}
```
Returns: `{ "access_token": "eyJhbG..." }`

---

### Doctor Profile (Protected)

> 🔒 Requires JWT + `DOCTOR` role

| Method  | Endpoint          | Description |
| ------- | ----------------- | ----------- |
| `POST`  | `/doctor/profile`  | Create doctor profile |
| `GET`   | `/doctor/profile`  | Get own profile |
| `PATCH` | `/doctor/profile`  | Update own profile |

**POST `/doctor/profile`**
```json
{
  "fullName": "Dr. Ali Khan",
  "specialization": "Cardiology",
  "experience": 10,
  "qualification": "MBBS, MD Cardiology",
  "consultationFee": 1500.00,
  "availability": "Mon-Fri 9AM-5PM",
  "profileDetails": "Specializing in interventional cardiology with 10+ years of experience."
}
```

---

### Patient Profile (Protected)

> 🔒 Requires JWT + `PATIENT` role

| Method  | Endpoint           | Description |
| ------- | ------------------ | ----------- |
| `POST`  | `/patient/profile`  | Create patient profile |
| `GET`   | `/patient/profile`  | Get own profile |
| `PATCH` | `/patient/profile`  | Update own profile |

**POST `/patient/profile`**
```json
{
  "fullName": "John Doe",
  "age": 30,
  "gender": "MALE",
  "contactDetails": "+92-300-1234567",
  "healthInformation": "No known allergies"
}
```

---

### Doctor Discovery (Public)

> 🌐 No authentication required — allows patients to browse doctors before signing up

| Method | Endpoint        | Description |
| ------ | --------------- | ----------- |
| `GET`  | `/doctors`       | List all doctors with filters + pagination |
| `GET`  | `/doctors/:id`   | Get doctor details by ID |

**Query parameters for `GET /doctors`:**

| Param            | Type    | Default | Description |
| ---------------- | ------- | ------- | ----------- |
| `name`           | string  | —       | Partial name search (case-insensitive) |
| `specialization` | string  | —       | Partial specialization filter (case-insensitive) |
| `available`      | boolean | —       | Filter by availability (`true`/`false`) |
| `page`           | integer | `1`     | Page number |
| `limit`          | integer | `10`    | Items per page |

**Example requests:**
```
GET /doctors?specialization=cardio&page=1&limit=5
GET /doctors?name=ali&available=true
GET /doctors/3
```

**Response shape for `GET /doctors`:**
```json
{
  "data": [ ... ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

**Edge cases handled:**
- Invalid/negative `page` or `limit` → `400 Bad Request`
- Non-integer doctor ID → `400 Bad Request`
- Doctor ID not found → `404 Not Found`
- No results → `200` with empty `data` array and `total: 0`
- Missing query params → defaults applied (`page=1`, `limit=10`)

---

## 📂 Project Structure

```
src/
├── app.module.ts                         # Root module
├── app.controller.ts                     # Health check / root controller
├── app.service.ts                        # Root service
├── main.ts                               # Bootstrap with ValidationPipe
├── data-source.ts                        # TypeORM CLI data source config
│
├── auth/
│   ├── auth.module.ts                    # Auth module
│   ├── auth.controller.ts               # POST /auth/signup, POST /auth/login
│   ├── auth.service.ts                   # Signup/login logic, JWT issuance
│   ├── jwt.strategy.ts                   # Passport JWT strategy
│   ├── roles.decorator.ts               # @Roles() decorator
│   ├── roles.guard.ts                    # RolesGuard
│   └── dto/
│       ├── signup.dto.ts
│       └── login.dto.ts
│
├── users/
│   ├── users.module.ts                   # Users module
│   ├── users.service.ts                  # User CRUD operations
│   └── user.entity.ts                    # UserEntity + UserRole enum
│
├── doctor/
│   ├── doctor.module.ts                  # Doctor module
│   ├── doctor.controller.ts              # DoctorController (protected) + DoctorDiscoveryController (public)
│   ├── doctor.service.ts                 # Profile CRUD + findAll/findById
│   ├── doctor-profile.entity.ts          # DoctorProfileEntity
│   └── dto/
│       ├── create-doctor-profile.dto.ts
│       ├── update-doctor-profile.dto.ts
│       ├── query-doctors.dto.ts          # Query filters + pagination
│       └── doctor-list-item.dto.ts       # List response shape
│
├── patient/
│   ├── patient.module.ts                 # Patient module
│   ├── patient.controller.ts             # Profile CRUD (protected, PATIENT role)
│   ├── patient.service.ts                # Profile CRUD operations
│   ├── patient-profile.entity.ts         # PatientProfileEntity
│   └── dto/
│       ├── create-patient-profile.dto.ts
│       └── update-patient-profile.dto.ts
│
└── migrations/
    ├── 1780916400000-CreateUsersAndProfiles.ts
    └── 1749500000000-AddDoctorAvailabilityStatus.ts
```

---

## 📅 Development Progress

### Day 1 — Project Setup & Database Design
- Initialized NestJS project with TypeScript
- Configured PostgreSQL + TypeORM (no `synchronize`)
- Designed ER schema for `users`, `doctor_profiles`, and `patient_profiles`
- Created initial migration with constraints and foreign keys

### Day 2 — Authentication
- Implemented user registration (`POST /auth/signup`) with bcrypt password hashing
- Implemented login (`POST /auth/login`) with JWT token issuance
- Created Passport JWT strategy for route protection
- Added role-based access control with `@Roles()` decorator and `RolesGuard`
- Input validation via `class-validator` with global `ValidationPipe`

### Day 3 — Profile Onboarding
- Doctor profile CRUD (`POST/GET/PATCH /doctor/profile`) — JWT + DOCTOR role required
- Patient profile CRUD (`POST/GET/PATCH /patient/profile`) — JWT + PATIENT role required
- One-to-one relationship between users and profiles
- Duplicate profile prevention (409 Conflict)
- Partial updates via PATCH

### Day 4 — Doctor Discovery
- Public doctor listing with pagination (`GET /doctors`)
- Search by name (partial, case-insensitive)
- Filter by specialization (partial, case-insensitive)
- Filter by availability (`?available=true/false`)
- Doctor detail by ID (`GET /doctors/:id`)
- Added `is_available` boolean column via migration
- Split controller: `DoctorDiscoveryController` (public) + `DoctorController` (protected)

---

## 📜 Scripts

```bash
npm run start          # Start the app
npm run start:dev      # Start in watch mode
npm run start:prod     # Start production build
npm run build          # Compile TypeScript
npm run lint           # Lint and auto-fix
npm run test           # Run unit tests
npm run test:e2e       # Run e2e tests
npm run test:cov       # Test coverage
npm run migration:run  # Run pending migrations
npm run migration:revert # Revert last migration
npm run migration:generate # Generate migration from entity changes
```

---

## 📄 License

This project is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
