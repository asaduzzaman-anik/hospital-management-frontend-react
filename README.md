# MediCare — Hospital Management Frontend

A role-based hospital management dashboard built with React, Vite, React Router, Axios, and Tailwind CSS. It consumes the existing Django REST API and does not include a backend of its own.

The UI is branded as **MediCare**. Staff and patients work from a shared workspace with role-aware navigation, list filters, and dedicated create / detail / edit screens.

## Repositories

| Layer | Repository |
| --- | --- |
| Frontend (this project) | https://github.com/asaduzzaman-anik/hospital-management-frontend-react |
| Backend API | https://github.com/asaduzzaman-anik/Hospital-Management-API |

The Django API is the source of truth for authentication, permissions, validation, filtering, pagination, and business rules. Frontend route guards are for user experience only.

## Features

### Authentication and access

- JWT login, patient self-registration, logout, and automatic access-token refresh
- Session restore on reload from stored tokens
- Guest routes (`/login`, `/register`) redirect authenticated users to the dashboard
- Role-aware sidebar and protected routes for Admin, Doctor, Patient, and Receptionist
- Dedicated 403 (`/forbidden`) and 404 pages

Public registration always creates a **patient** account. Staff roles cannot be self-assigned.

### Dashboard and profile

- Role-aware dashboard counts from existing paginated list endpoints (`count`)
- Stat cards deep-link into filtered lists (`/appointments?status=pending`, `/bills?paid=false`)
- Quick actions that match the signed-in role (book appointment, add staff/patients, new prescription)
- Profile view at `/profile` and a dedicated edit page at `/profile/edit`
- Patients can complete or update their medical profile before booking appointments
- Doctors see their department, specialization, experience, and availability on profile

### Hospital modules

- **Departments** — admin create, edit, delete, search, and sort
- **Receptionists** — admin create and manage receptionist user accounts, including a detail view
- **Doctors** — browse with search, department, and availability filters; admin creates the user account and doctor profile together
- **Patients** — admin/receptionist create accounts with medical details; doctors only see patients linked to their appointments
- **Appointments** — book available doctors, approve / complete / cancel through dedicated API actions, and edit or delete only while status is `pending`
- **Prescriptions** — create from completed appointments with dynamic medicine rows; doctors can edit their own prescriptions
- **Medicines** — catalog search; receptionists can add medicines, while only admins can edit or delete
- **Billing** — generate a bill from a completed, unbilled appointment; bills show linked doctor and patient names; staff can mark a bill paid

### Lists, UX, and feedback

- Search, filters, and page-number pagination using backend query parameters where they exist
- Extra client-side filtering when the API does not support a query (date ranges, name search on bills, doctor-scoped patients/bills)
- Client-side sort on the current page (name, date, amount, experience, and similar)
- Loading, empty, field-validation, toast, and API error states on data pages
- Confirm-delete modals and icon-only row actions
- Responsive layout with a collapsible sidebar on mobile

## Technology stack

- React 19
- Vite 7
- React Router 7
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
git clone https://github.com/asaduzzaman-anik/hospital-management-frontend-react.git
cd hospital-management-frontend-react
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

Keep the Django server running in a second terminal.

Other scripts:

```bash
npm run build    # production build
npm run preview  # preview the production build
```

## Supported roles

| Role | How to obtain | Typical access |
| --- | --- | --- |
| Admin | `python manage.py createsuperuser` (role is set to `admin`) | Full management of departments, receptionists, doctors, patients, appointments, medicines, prescriptions, and bills |
| Receptionist | Created by an admin at `/receptionists` | Patients, appointments, medicines (create), billing |
| Doctor | Created by an admin at `/doctors` (user + doctor profile) | Own appointments, linked patients, complete visits, create/edit own prescriptions, read medicines and related bills |
| Patient | Public registration at `/register`, then complete medical profile | Browse doctors, book appointments, view own prescriptions and bills |

## Role permissions

| Module | Admin | Receptionist | Doctor | Patient |
| --- | --- | --- | --- | --- |
| Dashboard / Profile | Yes | Yes | Yes | Yes |
| Departments | Full | — | — | — |
| Receptionists | Full | — | — | — |
| Doctors | Full | Read | Read | Read |
| Patients | Full | Full | Linked patients only | Own medical profile |
| Appointments | Full | Full | Own (complete, cancel) | Own (book, edit/delete pending, cancel) |
| Prescriptions | Create + read | Read | Create + edit own | Read own |
| Medicines | Full | Create + read | Read | Read |
| Billing | Create + mark paid | Create + mark paid | Related appointment bills | Own bills |

Frontend restrictions hide actions the role should not see. The API still rejects unauthorized requests.

## Main frontend routes

| Module | Routes |
| --- | --- |
| Auth | `/login`, `/register` |
| Dashboard | `/dashboard` |
| Profile | `/profile`, `/profile/edit` |
| Departments | `/departments`, `/departments/new`, `/departments/:id/edit` |
| Receptionists | `/receptionists`, `/receptionists/new`, `/receptionists/:id`, `/receptionists/:id/edit` |
| Doctors | `/doctors`, `/doctors/new`, `/doctors/:id`, `/doctors/:id/edit` |
| Patients | `/patients`, `/patients/new`, `/patients/:id`, `/patients/:id/edit` |
| Appointments | `/appointments`, `/appointments/new`, `/appointments/:id`, `/appointments/:id/edit` |
| Prescriptions | `/prescriptions`, `/prescriptions/new`, `/prescriptions/:id`, `/prescriptions/:id/edit` |
| Medicines | `/medicines`, `/medicines/new`, `/medicines/:id`, `/medicines/:id/edit` |
| Billing | `/bills`, `/bills/new`, `/bills/:id` |

## Appointment and billing workflow

1. A patient (or staff) books an available doctor. The appointment starts as `pending`.
2. Admin or receptionist **approves** it.
3. The assigned doctor (or admin) **completes** the visit.
4. Doctor or admin creates a **prescription** for that completed appointment (one prescription per appointment).
5. Admin or receptionist generates a **bill** for a completed, unbilled appointment and can **mark it paid**.

Pending appointments can be edited or deleted. Approved or pending appointments can be cancelled. Past dates cannot be booked from the form.

## List filters

| Page | Search / filters |
| --- | --- |
| Departments | Name or description |
| Receptionists | Name, username, email |
| Doctors | Name / specialization, department, availability |
| Patients | Name, phone, blood group |
| Appointments | Doctor, patient (staff), status, date range |
| Prescriptions | Patient, doctor, diagnosis |
| Medicines | Name, description |
| Billing | Patient or doctor name, paid / unpaid, created date range |

Dashboard cards pass `status` and `paid` through the URL so the matching list opens already filtered.

## Project structure

```
src/
  api/           Axios client, token refresh, and resource services
  components/    Shared UI (table, filters, forms, badges, toasts, icons)
  context/       Auth session and toast notifications
  hooks/
  layouts/       Auth split-screen and MediCare dashboard shell
  pages/         Route-level screens grouped by module
  routes/        Router, guest / auth / role guards
  utils/         JWT decode, formatting, constants, error helpers
```

## Authentication behavior

1. `POST /api/v1/auth/login/` returns `{ access, refresh }`.
2. The access token is decoded only to read SimpleJWT `user_id`.
3. The app then loads `GET /api/v1/users/{id}/` for `role`, name, and email.
4. Patient and doctor sessions also load the related profile record.
5. Axios attaches `Authorization: Bearer <access_token>`.
6. A 401 triggers `POST /api/v1/auth/refresh/`. Concurrent 401s share one refresh request. If refresh fails, tokens are cleared and the user is returned to `/login`.

## API / backend reference

Base URL: `/api/v1/`

| Resource | Notes |
| --- | --- |
| `POST /auth/login/` | `{ username, password }` |
| `POST /auth/refresh/` | `{ refresh }` |
| `/users/` | Public `POST` for registration. Admin uses this to create receptionist and staff accounts |
| `/departments/` | Admin write |
| `/doctors/` | Filter: `department`, `is_available`. Search: name, specialization, department name. `GET /doctors/available/` returns doctors that can be booked |
| `/patients/` | Search: name, phone, blood group. Patients may create/update their own profile |
| `/appointments/` | Filter: `doctor`, `patient`, `appointment_date`, `status`. Actions: `approve`, `complete`, `cancel` |
| `/prescriptions/` | Nested `medicines` on create. Completed appointment required |
| `/medicines/` | Search: `name`, `description` |
| `/bills/` | Filter: `patient`, `paid`. Action: `mark_as_paid`. Frontend also displays linked doctor and patient |

Pagination is DRF `PageNumberPagination` with page size 10:

```json
{ "count": 0, "next": null, "previous": null, "results": [] }
```

## Demo workflow

1. Start the backend, create a superuser, and log in as admin.
2. Create at least one department, one doctor, one medicine, and optionally a receptionist from `/receptionists`.
3. Register a patient, complete the medical profile at `/profile/edit`, and book an available doctor.
4. Approve the appointment as admin/receptionist, complete it as the doctor, then create a prescription.
5. Generate a bill as admin/receptionist and mark it paid.

## Developer

**Md Asaduzzaman Anik**

Full Stack Developer

## License

Created as an academic frontend assignment. The backend remains a separate repository.
