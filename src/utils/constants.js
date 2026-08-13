export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  RECEPTIONIST: 'receptionist',
}

export const ALL_ROLES = Object.values(ROLES)

export const STAFF_ROLES = [ROLES.ADMIN, ROLES.RECEPTIONIST]

export const APPOINTMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const GENDERS = ['Male', 'Female', 'Other']

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export const PAGE_SIZE = 10

export const ROLE_LABELS = {
  admin: 'Admin',
  doctor: 'Doctor',
  patient: 'Patient',
  receptionist: 'Receptionist',
}
