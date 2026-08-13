import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { departmentsApi } from '../../api/departments'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Fields'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiError, getFieldErrors } from '../../utils/errors'

export function DepartmentFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const [values, setValues] = useState({ name: '', description: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    departmentsApi
      .get(id)
      .then((data) => {
        if (!cancelled) setValues({ name: data.name, description: data.description })
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
    if (!values.name.trim()) nextErrors.name = 'Name is required.'
    if (!values.description.trim()) nextErrors.description = 'Description is required.'
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      if (isEdit) await departmentsApi.update(id, values)
      else await departmentsApi.create(values)
      toast.success(isEdit ? 'Department updated.' : 'Department created.')
      navigate('/departments')
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
        title={isEdit ? 'Edit department' : 'Add department'}
        breadcrumb={[{ label: 'Departments', to: '/departments' }, { label: isEdit ? 'Edit' : 'New' }]}
      />
      <Card className="max-w-2xl p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <Alert>{formError}</Alert>}
          <Input label="Name" name="name" required value={values.name} onChange={update} error={errors.name} />
          <Textarea label="Description" name="description" required value={values.description} onChange={update} error={errors.description} />
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
            <Button variant="secondary" onClick={() => navigate('/departments')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
