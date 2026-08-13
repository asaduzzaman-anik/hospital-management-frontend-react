import { useState } from 'react'
import { patientsApi } from '../../api/patients'
import { usersApi } from '../../api/users'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Fields'
import { Alert, Card } from '../../components/ui/Feedback'
import { Badge } from '../../components/ui/Badge'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getApiError, getFieldErrors } from '../../utils/errors'
import { doctorName } from '../../utils/format'
import { BLOOD_GROUPS, GENDERS, ROLE_LABELS } from '../../utils/constants'

export function ProfilePage() {
  const { user, patientProfile, doctorProfile, refreshProfiles, setPatientProfile } = useAuth()
  const toast = useToast()
  const [account, setAccount] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
  })
  const [patient, setPatient] = useState({
    age: patientProfile?.age || '',
    gender: patientProfile?.gender || '',
    blood_group: patientProfile?.blood_group || '',
    phone: patientProfile?.phone || '',
    address: patientProfile?.address || '',
  })
  const [accountErrors, setAccountErrors] = useState({})
  const [patientErrors, setPatientErrors] = useState({})
  const [accountError, setAccountError] = useState('')
  const [patientError, setPatientError] = useState('')
  const [savingAccount, setSavingAccount] = useState(false)
  const [savingPatient, setSavingPatient] = useState(false)

  function updateAccount(event) {
    setAccount((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function updatePatient(event) {
    setPatient((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function saveAccount(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!account.first_name.trim()) nextErrors.first_name = 'First name is required.'
    if (!account.last_name.trim()) nextErrors.last_name = 'Last name is required.'
    setAccountErrors(nextErrors)
    setAccountError('')
    if (Object.keys(nextErrors).length) return
    setSavingAccount(true)
    try {
      await usersApi.update(user.id, account)
      toast.success('Account details saved.')
    } catch (error) {
      setAccountErrors(getFieldErrors(error))
      setAccountError(getApiError(error))
    } finally {
      setSavingAccount(false)
    }
  }

  async function savePatient(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!patient.age) nextErrors.age = 'Age is required.'
    if (!patient.gender) nextErrors.gender = 'Gender is required.'
    if (!patient.blood_group) nextErrors.blood_group = 'Blood group is required.'
    if (!patient.phone.trim()) nextErrors.phone = 'Phone is required.'
    if (!patient.address.trim()) nextErrors.address = 'Address is required.'
    setPatientErrors(nextErrors)
    setPatientError('')
    if (Object.keys(nextErrors).length) return

    setSavingPatient(true)
    try {
      const payload = {
        age: Number(patient.age),
        gender: patient.gender,
        blood_group: patient.blood_group,
        phone: patient.phone.trim(),
        address: patient.address.trim(),
        user: user.id,
      }
      const saved = patientProfile
        ? await patientsApi.update(patientProfile.id, payload)
        : await patientsApi.create(payload)
      setPatientProfile(saved)
      await refreshProfiles()
      toast.success(patientProfile ? 'Medical profile updated.' : 'Medical profile created.')
    } catch (error) {
      setPatientErrors(getFieldErrors(error))
      setPatientError(getApiError(error))
    } finally {
      setSavingPatient(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Profile"
        breadcrumb={[{ label: 'Profile' }]}
        description="Account details are stored on the user record. Patient medical details use the patients API."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Account</h2>
            <Badge tone={user.role}>{ROLE_LABELS[user.role]}</Badge>
          </div>
          <form className="space-y-4" onSubmit={saveAccount}>
            {accountError && <Alert>{accountError}</Alert>}
            <Input label="Username" value={user.username} disabled />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" name="first_name" required value={account.first_name} onChange={updateAccount} error={accountErrors.first_name} />
              <Input label="Last name" name="last_name" required value={account.last_name} onChange={updateAccount} error={accountErrors.last_name} />
            </div>
            <Input label="Email" name="email" type="email" value={account.email} onChange={updateAccount} error={accountErrors.email} />
            <Button type="submit" disabled={savingAccount}>
              {savingAccount ? 'Saving...' : 'Save account'}
            </Button>
          </form>
        </Card>

        {user.role === 'patient' && (
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-slate-900">
              {patientProfile ? 'Medical profile' : 'Complete medical profile'}
            </h2>
            <form className="space-y-4" onSubmit={savePatient}>
              {patientError && <Alert>{patientError}</Alert>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Age" name="age" type="number" min="0" required value={patient.age} onChange={updatePatient} error={patientErrors.age} />
                <Select label="Gender" name="gender" required value={patient.gender} onChange={updatePatient} error={patientErrors.gender}>
                  <option value="">Select gender</option>
                  {GENDERS.map((gender) => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </Select>
                <Select label="Blood group" name="blood_group" required value={patient.blood_group} onChange={updatePatient} error={patientErrors.blood_group}>
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </Select>
                <Input label="Phone" name="phone" required value={patient.phone} onChange={updatePatient} error={patientErrors.phone} />
              </div>
              <Textarea label="Address" name="address" required value={patient.address} onChange={updatePatient} error={patientErrors.address} />
              <Button type="submit" disabled={savingPatient}>
                {savingPatient ? 'Saving...' : patientProfile ? 'Update profile' : 'Create profile'}
              </Button>
            </form>
          </Card>
        )}

        {user.role === 'doctor' && (
          <Card className="p-5">
            <h2 className="mb-4 font-semibold text-slate-900">Doctor profile</h2>
            {doctorProfile ? (
              <dl className="grid gap-3 text-sm">
                <div><dt className="text-slate-500">Name</dt><dd className="font-medium">{doctorName(doctorProfile)}</dd></div>
                <div><dt className="text-slate-500">Department</dt><dd className="font-medium">{doctorProfile.department_detail?.name || '—'}</dd></div>
                <div><dt className="text-slate-500">Specialization</dt><dd className="font-medium">{doctorProfile.specialization}</dd></div>
                <div><dt className="text-slate-500">Experience</dt><dd className="font-medium">{doctorProfile.experience} years</dd></div>
                <div><dt className="text-slate-500">Phone</dt><dd className="font-medium">{doctorProfile.phone}</dd></div>
                <div>
                  <dt className="text-slate-500">Availability</dt>
                  <dd className="mt-1">
                    <Badge tone={doctorProfile.is_available ? 'available' : 'unavailable'}>
                      {doctorProfile.is_available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </dd>
                </div>
              </dl>
            ) : (
              <Alert>No doctor profile is linked to this account yet. Ask an administrator or receptionist to create it.</Alert>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
