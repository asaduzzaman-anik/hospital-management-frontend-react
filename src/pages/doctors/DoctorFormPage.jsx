import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doctorsApi } from '../../api/doctors'
import { departmentsApi } from '../../api/departments'
import { usersApi } from '../../api/users'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { AutofillTrap, Input, Select } from '../../components/ui/Fields'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiError, getFieldErrors } from '../../utils/errors'

const empty = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  department: '',
  specialization: '',
  phone: '',
  experience: '',
  is_available: true,
}

export function DoctorFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const [values, setValues] = useState(empty)
  const [departments, setDepartments] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const deptList = await fetchAllPages(departmentsApi.list)
        if (!cancelled) setDepartments(deptList)
        if (isEdit) {
          const doctor = await doctorsApi.get(id)
          if (!cancelled) {
            setValues({
              username: doctor.user_detail?.username || '',
              email: doctor.user_detail?.email || '',
              first_name: doctor.user_detail?.first_name || '',
              last_name: doctor.user_detail?.last_name || '',
              password: '',
              department: doctor.department || '',
              specialization: doctor.specialization || '',
              phone: doctor.phone || '',
              experience: doctor.experience ?? '',
              is_available: doctor.is_available,
              user: doctor.user,
            })
          }
        }
      } catch (error) {
        if (!cancelled) setFormError(getApiError(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  function update(event) {
    const { name, value, type, checked } = event.target
    setValues((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
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
    if (!values.department) nextErrors.department = 'Department is required.'
    if (!values.specialization.trim()) nextErrors.specialization = 'Specialization is required.'
    if (!values.phone.trim()) nextErrors.phone = 'Phone is required.'
    if (values.experience === '' || Number(values.experience) < 0) nextErrors.experience = 'Experience is required.'
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      const doctorPayload = {
        department: Number(values.department),
        specialization: values.specialization.trim(),
        phone: values.phone.trim(),
        experience: Number(values.experience),
        is_available: Boolean(values.is_available),
      }

      if (isEdit) {
        if (values.user) {
          await usersApi.update(values.user, {
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
          })
        }
        await doctorsApi.update(id, doctorPayload)
        toast.success('Doctor updated.')
      } else {
        const createdUser = await usersApi.register({
          username: values.username.trim(),
          email: values.email.trim(),
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          password: values.password,
          role: 'doctor',
        })
        await doctorsApi.create({ ...doctorPayload, user: createdUser.id })
        toast.success('Doctor created.')
      }
      navigate('/doctors')
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
        title={isEdit ? 'Edit doctor' : 'Add doctor'}
        breadcrumb={[{ label: 'Doctors', to: '/doctors' }, { label: isEdit ? 'Edit' : 'New' }]}
        description={isEdit ? 'Update the doctor profile. Availability can be changed here.' : 'Creates a user with the doctor role, then the doctor profile.'}
      />
      <Card className="max-w-3xl p-6">
        <form className="relative space-y-4" autoComplete="off" onSubmit={handleSubmit}>
          {formError && <Alert>{formError}</Alert>}
          {!isEdit && <AutofillTrap />}
          <div className="grid gap-4 sm:grid-cols-2">
            {!isEdit && (
              <Input label="Username" name="username" required value={values.username} onChange={update} error={errors.username} disableAutofill />
            )}
            <Input label="Email" name="email" type="email" value={values.email} onChange={update} error={errors.email} autoComplete="off" />
            <Input label="First name" name="first_name" required value={values.first_name} onChange={update} error={errors.first_name} />
            <Input label="Last name" name="last_name" required value={values.last_name} onChange={update} error={errors.last_name} />
            {!isEdit && (
              <Input label="Password" name="password" type="password" required value={values.password} onChange={update} error={errors.password} disableAutofill />
            )}
            <Select label="Department" name="department" required value={values.department} onChange={update} error={errors.department}>
              <option value="">Select department</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
            <Input label="Specialization" name="specialization" required value={values.specialization} onChange={update} error={errors.specialization} />
            <Input label="Phone" name="phone" required value={values.phone} onChange={update} error={errors.phone} />
            <Input label="Experience (years)" name="experience" type="number" min="0" required value={values.experience} onChange={update} error={errors.experience} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="is_available" checked={values.is_available} onChange={update} />
            Available for appointments
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
            <Button variant="secondary" onClick={() => navigate('/doctors')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
