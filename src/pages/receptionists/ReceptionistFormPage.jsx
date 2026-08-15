import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usersApi } from '../../api/users'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { AutofillTrap, Input } from '../../components/ui/Fields'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { ROLES } from '../../utils/constants'
import { getApiError, getFieldErrors } from '../../utils/errors'

const empty = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  confirmPassword: '',
}

export function ReceptionistFormPage() {
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
    usersApi
      .getById(id)
      .then((account) => {
        if (cancelled) return
        if (account.role !== ROLES.RECEPTIONIST) {
          setFormError('This account is not a receptionist.')
          return
        }
        setValues({
          username: account.username || '',
          email: account.email || '',
          first_name: account.first_name || '',
          last_name: account.last_name || '',
          password: '',
          confirmPassword: '',
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
    if (!values.first_name.trim()) nextErrors.first_name = 'First name is required.'
    if (!values.last_name.trim()) nextErrors.last_name = 'Last name is required.'
    if (!isEdit) {
      if (!values.username.trim()) nextErrors.username = 'Username is required.'
      if (!values.password) nextErrors.password = 'Password is required.'
      else if (values.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'
      if (values.password !== values.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    }
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      if (isEdit) {
        await usersApi.update(id, {
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          email: values.email.trim(),
        })
        toast.success('Receptionist updated.')
      } else {
        await usersApi.register({
          username: values.username.trim(),
          email: values.email.trim(),
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          password: values.password,
          role: ROLES.RECEPTIONIST,
        })
        toast.success('Receptionist created.')
      }
      navigate('/receptionists')
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
        title={isEdit ? 'Edit receptionist' : 'Add receptionist'}
        breadcrumb={[{ label: 'Receptionists', to: '/receptionists' }, { label: isEdit ? 'Edit' : 'New' }]}
        description={
          isEdit
            ? 'Update the receptionist account name and email. Username cannot be changed here.'
            : 'Creates a user with the receptionist role. They can then sign in and manage patients, appointments, and billing.'
        }
      />
      <Card className="max-w-3xl p-6">
        <form className="relative space-y-4" autoComplete="off" onSubmit={handleSubmit}>
          {formError && <Alert>{formError}</Alert>}
          {!isEdit && <AutofillTrap />}
          <div className="grid gap-4 sm:grid-cols-2">
            {!isEdit && (
              <Input label="Username" name="username" required value={values.username} onChange={update} error={errors.username} disableAutofill />
            )}
            {isEdit && (
              <Input label="Username" name="username" value={values.username} disabled />
            )}
            <Input label="Email" name="email" type="email" value={values.email} onChange={update} error={errors.email} autoComplete="off" />
            <Input label="First name" name="first_name" required value={values.first_name} onChange={update} error={errors.first_name} />
            <Input label="Last name" name="last_name" required value={values.last_name} onChange={update} error={errors.last_name} />
            {!isEdit && (
              <>
                <Input label="Password" name="password" type="password" required value={values.password} onChange={update} error={errors.password} disableAutofill />
                <Input
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  required
                  value={values.confirmPassword}
                  onChange={update}
                  error={errors.confirmPassword}
                  disableAutofill
                />
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
            <Button variant="secondary" onClick={() => navigate('/receptionists')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
