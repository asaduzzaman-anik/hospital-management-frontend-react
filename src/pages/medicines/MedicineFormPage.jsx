import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { medicinesApi } from '../../api/medicines'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Fields'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiError, getFieldErrors } from '../../utils/errors'

export function MedicineFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()
  const [values, setValues] = useState({ name: '', description: '', unit: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    medicinesApi
      .get(id)
      .then((data) => {
        if (!cancelled) setValues({ name: data.name, description: data.description, unit: data.unit })
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
    if (!values.unit.trim()) nextErrors.unit = 'Unit is required.'
    if (!values.description.trim()) nextErrors.description = 'Description is required.'
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      if (isEdit) await medicinesApi.update(id, values)
      else await medicinesApi.create(values)
      toast.success(isEdit ? 'Medicine updated.' : 'Medicine created.')
      navigate('/medicines')
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
        title={isEdit ? 'Edit medicine' : 'Add medicine'}
        breadcrumb={[{ label: 'Medicines', to: '/medicines' }, { label: isEdit ? 'Edit' : 'New' }]}
      />
      <Card className="max-w-2xl p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <Alert>{formError}</Alert>}
          <Input label="Name" name="name" required value={values.name} onChange={update} error={errors.name} />
          <Input label="Unit" name="unit" required value={values.unit} onChange={update} error={errors.unit} placeholder="e.g. tablet, ml, capsule" />
          <Textarea label="Description" name="description" required value={values.description} onChange={update} error={errors.description} />
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
            <Button variant="secondary" onClick={() => navigate('/medicines')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
