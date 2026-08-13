import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../layouts/AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Fields'
import { Alert } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { getApiError, getFieldErrors } from '../../utils/errors'

export function RegisterPage() {
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!values.username.trim()) nextErrors.username = 'Username is required.'
    if (!values.first_name.trim()) nextErrors.first_name = 'First name is required.'
    if (!values.last_name.trim()) nextErrors.last_name = 'Last name is required.'
    if (!values.password) nextErrors.password = 'Password is required.'
    else if (values.password.length < 6) nextErrors.password = 'Password must be at least 6 characters.'
    if (values.password !== values.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.'
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      await register({
        username: values.username.trim(),
        email: values.email.trim(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        password: values.password,
      })
      toast.success('Account created. Complete your patient profile to book appointments.')
      navigate('/profile')
    } catch (error) {
      setErrors(getFieldErrors(error))
      setFormError(getApiError(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Patient registration"
      subtitle="Self-registration is available for patients only. Staff accounts are created by an administrator."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-teal-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {formError && <Alert>{formError}</Alert>}
        <Input label="Username" name="username" required value={values.username} onChange={update} error={errors.username} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First name" name="first_name" required value={values.first_name} onChange={update} error={errors.first_name} />
          <Input label="Last name" name="last_name" required value={values.last_name} onChange={update} error={errors.last_name} />
        </div>
        <Input label="Email" name="email" type="email" value={values.email} onChange={update} error={errors.email} />
        <Input label="Password" name="password" type="password" required value={values.password} onChange={update} error={errors.password} />
        <Input
          label="Confirm password"
          name="confirmPassword"
          type="password"
          required
          value={values.confirmPassword}
          onChange={update}
          error={errors.confirmPassword}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create patient account'}
        </Button>
      </form>
    </AuthLayout>
  )
}
