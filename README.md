# Hospital Management System — React Frontend

A role-based hospital management dashboard built with React, Vite, React Router, Axios, and Tailwind CSS. It consumes the existing Django REST API and does not include a backend of its own.

## Backend repository

This frontend is designed for:

**https://github.com/asaduzzaman-anik/Hospital-Management-API**

The Django API is the source of truth for authentication, permissions, validation, filtering, pagination, and business rules. Frontend route guards are for user experience only.

## Features

- JWT login, patient self-registration, logout, and automatic token refresh
- Role-aware navigation and protected routes for Admin, Doctor, Patient, and Receptionist
- Dashboard counts derived from existing paginated list endpoints (`count`)
- Department, doctor, patient, appointment, prescription, medicine, and billing modules
- Search, filters, and page-number pagination using the backend query parameters
- Appointment state changes through dedicated API actions: approve, complete, cancel
- Billing payment through `PATCH /bills/{id}/mark_as_paid/`
- Prescription creation with dynamic medicine rows, limited to completed appointments
- Loading, empty, validation, and API error states on every data page
- Responsive layout with a collapsible sidebar on mobile

## Technology stack

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS 4
- JavaScript / JSX

## Prerequisites

- Node.js 18 or later
- npm
- Python 3.12+ for the backend
- The Hospital Management API running locally on port 8000

## Environment configuration

Copy the example env file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Required variable:

```env
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

Do not hardcode the API URL in application code. All requests go through the Axios client in `src/api/client.js`.

## How to run the backend

From the backend repository:

```bash
git clone https://github.com/asaduzzaman-anik/Hospital-Management-API.git
cd Hospital-Management-API
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the backend root:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Then:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/api/v1/`.

### Backend compatibility notes

The frontend requires two small backend updates that already exist in the local API project:

1. **CORS** via `django-cors-headers`, allowing the Vite origin `http://localhost:5173`.
2. **Patient self-profile**: authenticated patients may create and update their own `/api/v1/patients/` record so they can complete registration and book appointments.

If you clone a backend copy that does not include those changes yet, the browser will block API calls and patients will not be able to finish their medical profile.

## How to run the frontend

```bash
git clone <this-frontend-repository-url>
cd <frontend-folder>
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

Keep the Django server running in a second terminal.

## Supported roles

| Role | How to obtain | Typical access |
| --- | --- | --- |
| Admin | `python manage.py createsuperuser` (role is set to `admin`) | Full management of departments, staff records, appointments, medicines, prescriptions, and bills |
| Receptionist | Created by an admin from Doctors/Patients staff flows or Django admin / users API | Doctors, patients, appointments, medicines, billing |
| Doctor | Created by Admin/Receptionist (user + doctor profile) | Own appointments, complete visits, create prescriptions, read medicines/patients |
| Patient | Public registration at `/register`, then complete medical profile | Browse doctors, book appointments, view own prescriptions and bills |

Public registration always creates a **patient** account. Staff roles cannot be self-assigned in the UI.

## Main frontend modules

| Module | Routes |
| --- | --- |
| Auth | `/login`, `/register` |
| Dashboard | `/dashboard` |
| Profile | `/profile` |
| Departments | `/departments` (admin) |
| Doctors | `/doctors` |
| Patients | `/patients` |
| Appointments | `/appointments` |
| Prescriptions | `/prescriptions` |
| Medicines | `/medicines` |
| Billing | `/bills` |

## Project structure

```
src/
  api/           Axios client and resource services
  components/    Reusable UI
  layouts/       Auth and dashboard shells
  pages/         Route-level screens
  routes/        Router and role guards
  context/       Auth and toast state
  hooks/
  utils/
```

## Authentication behavior

1. `POST /api/v1/auth/login/` returns `{ access, refresh }`.
2. The access token is decoded only to read SimpleJWT `user_id`.
3. The app then loads `GET /api/v1/users/{id}/` for `role`, name, and email.
4. Axios attaches `Authorization: Bearer <access_token>`.
5. A 401 triggers `POST /api/v1/auth/refresh/`. If refresh fails, tokens are cleared and the user is returned to `/login`.

## API / backend reference

Base URL: `/api/v1/`

| Resource | Notes |
| --- | --- |
| `POST /auth/login/` | `{ username, password }` |
| `POST /auth/refresh/` | `{ refresh }` |
| `/users/` | Public `POST` for registration |
| `/departments/` | Admin write |
| `/doctors/` | Filter: `department`, `is_available`. Search: name, specialization, department name. `GET /doctors/available/` returns an unpaginated list |
| `/patients/` | Search: name, phone, blood group. Patients may create/update their own profile |
| `/appointments/` | Filter: `doctor`, `patient`, `appointment_date`, `status`. Actions: `approve`, `complete`, `cancel` |
| `/prescriptions/` | Nested `medicines` on create. Completed appointment required |
| `/medicines/` | Search: `name`, `description` |
| `/bills/` | Filter: `patient`, `paid`. Action: `mark_as_paid` |

Pagination is DRF `PageNumberPagination` with page size 10:

```json
{ "count": 0, "next": null, "previous": null, "results": [] }
```

## Demo workflow

1. Start the backend, create a superuser, and log in as admin.
2. Create at least one department, one doctor, one medicine, and optionally a receptionist workflow.
3. Register a patient, complete the medical profile, and book an available doctor.
4. Approve the appointment as admin/receptionist, complete it as the doctor, then create a prescription.
5. Generate a bill as admin/receptionist and mark it paid.

## License

Created as an academic frontend assignment. The backend remains a separate repository.
