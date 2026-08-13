import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { patientsApi } from '../../api/patients'
import { usersApi } from '../../api/users'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Fields'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { BLOOD_GROUPS, GENDERS } from '../../utils/constants'
import { getApiError, getFieldErrors } from '../../utils/errors'

const empty = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  age: '',
  gender: '',
  blood_group: '',
  phone: '',
  address: '',
}

export function PatientFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    patientsApi
      .get(id)
      .then((patient) => {
        if (cancelled) return
        setValues({
          username: patient.user_detail?.username || '',
          email: patient.user_detail?.email || '',
          first_name: patient.user_detail?.first_name || '',
          last_name: patient.user_detail?.last_name || '',
          password: '',
          age: patient.age ?? '',
          gender: patient.gender || '',
          blood_group: patient.blood_group || '',
          phone: patient.phone || '',
          address: patient.address || '',
          user: patient.user,
        })
      })
      .catch((error) => {
        if (!cancelled) setFormError(getApiError(error))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!isEdit) {
      if (!values.username.trim()) nextErrors.username = 'Username is required.'
      if (!values.first_name.trim()) nextErrors.first_name = 'First name is required.'
      if (!values.last_name.trim()) nextErrors.last_name = 'Last name is required.'
      if (!values.password) nextErrors.password = 'Password is required.'
      else if (values.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'
    }
    if (!values.age) nextErrors.age = 'Age is required.'
    if (!values.gender) nextErrors.gender = 'Gender is required.'
    if (!values.blood_group) nextErrors.blood_group = 'Blood group is required.'
    if (!values.phone.trim()) nextErrors.phone = 'Phone is required.'
    if (!values.address.trim()) nextErrors.address = 'Address is required.'
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      const profile = {
        age: Number(values.age),
        gender: values.gender,
        blood_group: values.blood_group,
        phone: values.phone.trim(),
        address: values.address.trim(),
      }
      if (isEdit) {
        if (values.user) {
          await usersApi.update(values.user, {
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
          })
        }
        await patientsApi.update(id, profile)
        toast.success('Patient updated.')
      } else {
        const createdUser = await usersApi.register({
          username: values.username.trim(),
          email: values.email.trim(),
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          password: values.password,
          role: 'patient',
        })
        await patientsApi.create({ ...profile, user: createdUser.id })
        toast.success('Patient created.')
      }
      navigate('/patients')
    } catch (error) {
      setErrors(getFieldErrors(error))
      setFormError(getApiError(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit patient' : 'Add patient'}
        breadcrumb={[{ label: 'Patients', to: '/patients' }, { label: isEdit ? 'Edit' : 'New' }]}
        description={isEdit ? 'Update the patient profile.' : 'Creates a user with the patient role, then the patient profile.'}
      />
      <Card className="max-w-3xl p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <Alert>{formError}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            {!isEdit && <Input label="Username" name="username" required value={values.username} onChange={update} error={errors.username} />}
            <Input label="Email" name="email" type="email" value={values.email} onChange={update} error={errors.email} />
            <Input label="First name" name="first_name" required value={values.first_name} onChange={update} error={errors.first_name} />
            <Input label="Last name" name="last_name" required value={values.last_name} onChange={update} error={errors.last_name} />
            {!isEdit && <Input label="Password" name="password" type="password" required value={values.password} onChange={update} error={errors.password} />}
            <Input label="Age" name="age" type="number" min="0" required value={values.age} onChange={update} error={errors.age} />
            <Select label="Gender" name="gender" required value={values.gender} onChange={update} error={errors.gender}>
              <option value="">Select gender</option>
              {GENDERS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
            </Select>
            <Select label="Blood group" name="blood_group" required value={values.blood_group} onChange={update} error={errors.blood_group}>
              <option value="">Select blood group</option>
              {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
            </Select>
            <Input label="Phone" name="phone" required value={values.phone} onChange={update} error={errors.phone} />
          </div>
          <Textarea label="Address" name="address" required value={values.address} onChange={update} error={errors.address} />
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
            <Button variant="secondary" onClick={() => navigate('/patients')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
