import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { billsApi } from '../../api/bills'
import { patientsApi } from '../../api/patients'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Fields'
import { Alert, Card, Spinner } from '../../components/ui/Feedback'
import { useToast } from '../../context/ToastContext'
import { getApiError, getFieldErrors } from '../../utils/errors'
import { patientName } from '../../utils/format'

export function BillFormPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [values, setValues] = useState({ patient: '', amount: '' })
  const [patients, setPatients] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchAllPages(patientsApi.list)
      .then((list) => {
        if (!cancelled) setPatients(list)
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
  }, [])

  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!values.patient) nextErrors.patient = 'Patient is required.'
    if (!values.amount || Number(values.amount) <= 0) nextErrors.amount = 'Amount must be greater than zero.'
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      await billsApi.create({
        patient: Number(values.patient),
        amount: values.amount,
      })
      toast.success('Bill generated.')
      navigate('/bills')
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
        title="Generate bill"
        breadcrumb={[{ label: 'Billing', to: '/bills' }, { label: 'New' }]}
        description="The backend requires amount to be greater than zero. New bills start as unpaid."
      />
      <Card className="max-w-xl p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && <Alert>{formError}</Alert>}
          <Select label="Patient" name="patient" required value={values.patient} onChange={update} error={errors.patient}>
            <option value="">Select patient</option>
            {patients.map((item) => (
              <option key={item.id} value={item.id}>{patientName(item)}</option>
            ))}
          </Select>
          <Input label="Amount" name="amount" type="number" min="0.01" step="0.01" required value={values.amount} onChange={update} error={errors.amount} />
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Generate bill'}</Button>
            <Button variant="secondary" onClick={() => navigate('/bills')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
