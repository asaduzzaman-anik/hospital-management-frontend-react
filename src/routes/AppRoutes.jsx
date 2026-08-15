import { Navigate, Route, Routes } from 'react-router-dom'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { GuestRoute, ProtectedRoute, RoleRoute } from './ProtectedRoute'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { ProfilePage } from '../pages/profile/ProfilePage'
import { ProfileEditPage } from '../pages/profile/ProfileEditPage'
import { DepartmentListPage } from '../pages/departments/DepartmentListPage'
import { DepartmentFormPage } from '../pages/departments/DepartmentFormPage'
import { ReceptionistListPage } from '../pages/receptionists/ReceptionistListPage'
import { ReceptionistFormPage } from '../pages/receptionists/ReceptionistFormPage'
import { DoctorListPage } from '../pages/doctors/DoctorListPage'
import { DoctorDetailPage } from '../pages/doctors/DoctorDetailPage'
import { DoctorFormPage } from '../pages/doctors/DoctorFormPage'
import { PatientListPage } from '../pages/patients/PatientListPage'
import { PatientDetailPage } from '../pages/patients/PatientDetailPage'
import { PatientFormPage } from '../pages/patients/PatientFormPage'
import { AppointmentListPage } from '../pages/appointments/AppointmentListPage'
import { AppointmentDetailPage } from '../pages/appointments/AppointmentDetailPage'
import { AppointmentFormPage } from '../pages/appointments/AppointmentFormPage'
import { PrescriptionListPage } from '../pages/prescriptions/PrescriptionListPage'
import { PrescriptionDetailPage } from '../pages/prescriptions/PrescriptionDetailPage'
import { PrescriptionFormPage } from '../pages/prescriptions/PrescriptionFormPage'
import { MedicineListPage } from '../pages/medicines/MedicineListPage'
import { MedicineDetailPage } from '../pages/medicines/MedicineDetailPage'
import { MedicineFormPage } from '../pages/medicines/MedicineFormPage'
import { BillListPage } from '../pages/bills/BillListPage'
import { BillDetailPage } from '../pages/bills/BillDetailPage'
import { BillFormPage } from '../pages/bills/BillFormPage'
import { ForbiddenPage } from '../pages/errors/ForbiddenPage'
import { NotFoundPage } from '../pages/errors/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />

          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="/departments" element={<DepartmentListPage />} />
            <Route path="/departments/new" element={<DepartmentFormPage />} />
            <Route path="/departments/:id/edit" element={<DepartmentFormPage />} />
            <Route path="/receptionists" element={<ReceptionistListPage />} />
            <Route path="/receptionists/new" element={<ReceptionistFormPage />} />
            <Route path="/receptionists/:id/edit" element={<ReceptionistFormPage />} />
          </Route>

          <Route path="/doctors" element={<DoctorListPage />} />
          <Route element={<RoleRoute roles={['admin', 'receptionist']} />}>
            <Route path="/doctors/new" element={<DoctorFormPage />} />
            <Route path="/doctors/:id/edit" element={<DoctorFormPage />} />
          </Route>
          <Route path="/doctors/:id" element={<DoctorDetailPage />} />

          <Route element={<RoleRoute roles={['admin', 'receptionist']} />}>
            <Route path="/patients/new" element={<PatientFormPage />} />
            <Route path="/patients/:id/edit" element={<PatientFormPage />} />
          </Route>
          <Route element={<RoleRoute roles={['admin', 'receptionist', 'doctor']} />}>
            <Route path="/patients" element={<PatientListPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
          </Route>

          <Route path="/appointments" element={<AppointmentListPage />} />
          <Route element={<RoleRoute roles={['admin', 'receptionist', 'patient']} />}>
            <Route path="/appointments/new" element={<AppointmentFormPage />} />
            <Route path="/appointments/:id/edit" element={<AppointmentFormPage />} />
          </Route>
          <Route path="/appointments/:id" element={<AppointmentDetailPage />} />

          <Route path="/prescriptions" element={<PrescriptionListPage />} />
          <Route element={<RoleRoute roles={['admin', 'doctor']} />}>
            <Route path="/prescriptions/new" element={<PrescriptionFormPage />} />
          </Route>
          <Route element={<RoleRoute roles={['doctor']} />}>
            <Route path="/prescriptions/:id/edit" element={<PrescriptionFormPage />} />
          </Route>
          <Route path="/prescriptions/:id" element={<PrescriptionDetailPage />} />

          <Route path="/medicines" element={<MedicineListPage />} />
          <Route element={<RoleRoute roles={['admin', 'receptionist']} />}>
            <Route path="/medicines/new" element={<MedicineFormPage />} />
          </Route>
          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="/medicines/:id/edit" element={<MedicineFormPage />} />
          </Route>
          <Route path="/medicines/:id" element={<MedicineDetailPage />} />

          <Route path="/bills" element={<BillListPage />} />
          <Route element={<RoleRoute roles={['admin', 'receptionist']} />}>
            <Route path="/bills/new" element={<BillFormPage />} />
          </Route>
          <Route path="/bills/:id" element={<BillDetailPage />} />

          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
