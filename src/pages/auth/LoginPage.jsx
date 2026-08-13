import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../../layouts/AuthLayout'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Fields'
import { Alert } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { getApiError, getFieldErrors } from '../../utils/errors'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ username: '', password: '' })
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
    if (!values.password) nextErrors.password = 'Password is required.'
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      await login(values)
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (error) {
      setErrors(getFieldErrors(error))
      setFormError(getApiError(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your hospital account to continue."
      footer={
        <>
          New patient?{' '}
          <Link to="/register" className="font-medium text-teal-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {formError && <Alert>{formError}</Alert>}
        <Input
          label="Username"
          name="username"
          autoComplete="username"
          required
          value={values.username}
          onChange={update}
          error={errors.username}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={values.password}
          onChange={update}
          error={errors.password}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}
