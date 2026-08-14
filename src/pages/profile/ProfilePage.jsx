import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Alert, Card } from '../../components/ui/Feedback'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../context/AuthContext'
import { doctorName, fullName } from '../../utils/format'
import { ROLE_LABELS } from '../../utils/constants'

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{children == null || children === '' ? '—' : children}</dd>
    </div>
  )
}

export function ProfilePage() {
  const { user, patientProfile, doctorProfile } = useAuth()
  const needsMedicalProfile = user.role === 'patient' && !patientProfile

  return (
    <div>
      <PageHeader
        title="Profile"
        breadcrumb={[{ label: 'Profile' }]}
        description="Account details are stored on the user record. Role-specific details come from the related profile APIs."
        actions={
          <Link to="/profile/edit">
            <Button>{needsMedicalProfile ? 'Complete profile' : 'Edit'}</Button>
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Account</h2>
            <Badge tone={user.role}>{ROLE_LABELS[user.role]}</Badge>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <Field label="Full name">{fullName(user)}</Field>
            <Field label="Username">{user.username}</Field>
            <Field label="Email">{user.email}</Field>
            <Field label="Role">{ROLE_LABELS[user.role]}</Field>
          </dl>
        </Card>

        {user.role === 'patient' && (
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Medical profile</h2>
            {patientProfile ? (
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <Field label="Age">{patientProfile.age}</Field>
                <Field label="Gender">{patientProfile.gender}</Field>
                <Field label="Blood group">
                  <Badge tone={patientProfile.blood_group}>{patientProfile.blood_group}</Badge>
                </Field>
                <Field label="Phone">{patientProfile.phone}</Field>
                <Field className="sm:col-span-2" label="Address">{patientProfile.address}</Field>
              </dl>
            ) : (
              <Alert>
                Your medical profile is incomplete. Complete it before booking appointments.
              </Alert>
            )}
          </Card>
        )}

        {user.role === 'doctor' && (
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Doctor profile</h2>
            {doctorProfile ? (
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <Field label="Name">{doctorName(doctorProfile)}</Field>
                <Field label="Department">{doctorProfile.department_detail?.name}</Field>
                <Field label="Specialization">{doctorProfile.specialization}</Field>
                <Field label="Experience">{doctorProfile.experience} years</Field>
                <Field label="Phone">{doctorProfile.phone}</Field>
                <Field label="Availability">
                  <Badge tone={doctorProfile.is_available ? 'available' : 'unavailable'}>
                    {doctorProfile.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </Field>
              </dl>
            ) : (
              <Alert>
                No doctor profile is linked to this account yet. Ask an administrator or receptionist to create it.
              </Alert>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
