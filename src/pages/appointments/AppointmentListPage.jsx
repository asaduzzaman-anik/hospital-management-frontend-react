import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { appointmentsApi } from '../../api/appointments'
import { doctorsApi } from '../../api/doctors'
import { patientsApi } from '../../api/patients'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Fields'
import { Table, Pagination } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Alert, EmptyState, Spinner } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { APPOINTMENT_STATUSES, STAFF_ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'
import { doctorName, formatDateTime, patientName } from '../../utils/format'

export function AppointmentListPage() {
  const { user } = useAuth()
  const canBook = user.role === 'patient' || STAFF_ROLES.includes(user.role)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ doctor: '', patient: '', status: '', appointment_date: '' })
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAllPages(doctorsApi.list).then(setDoctors).catch(() => setDoctors([]))
    if (STAFF_ROLES.includes(user.role) || user.role === 'doctor') {
      fetchAllPages(patientsApi.list).then(setPatients).catch(() => setPatients([]))
    }
  }, [user.role])

  async function load(nextPage = page) {
    setLoading(true)
    setError('')
    try {
      const params = { page: nextPage }
      if (filters.doctor) params.doctor = filters.doctor
      if (filters.patient) params.patient = filters.patient
      if (filters.status) params.status = filters.status
      if (filters.appointment_date) params.appointment_date = filters.appointment_date
      setData(await appointmentsApi.list(params))
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  return (
    <div>
      <PageHeader
        title="Appointments"
        breadcrumb={[{ label: 'Appointments' }]}
        description="Status filters use the backend query params. Date filtering is an exact DateTime match."
        actions={
          canBook && (
            <Link to="/appointments/new">
              <Button>Book appointment</Button>
            </Link>
          )
        }
      />
      <form
        className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault()
          setPage(1)
          load(1)
        }}
      >
        <Select value={filters.doctor} onChange={(e) => setFilters((c) => ({ ...c, doctor: e.target.value }))}>
          <option value="">All doctors</option>
          {doctors.map((item) => (
            <option key={item.id} value={item.id}>{doctorName(item)}</option>
          ))}
        </Select>
        {(STAFF_ROLES.includes(user.role) || user.role === 'doctor') && (
          <Select value={filters.patient} onChange={(e) => setFilters((c) => ({ ...c, patient: e.target.value }))}>
            <option value="">All patients</option>
            {patients.map((item) => (
              <option key={item.id} value={item.id}>{patientName(item)}</option>
            ))}
          </Select>
        )}
        <Select value={filters.status} onChange={(e) => setFilters((c) => ({ ...c, status: e.target.value }))}>
          <option value="">All statuses</option>
          {APPOINTMENT_STATUSES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </Select>
        <Input
          type="datetime-local"
          value={filters.appointment_date}
          onChange={(e) => setFilters((c) => ({ ...c, appointment_date: e.target.value }))}
        />
        <Button type="submit">Filter</Button>
      </form>
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : data.results.length === 0 ? (
        <EmptyState title="No appointments found." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'patient', header: 'Patient', render: (row) => patientName(row.patient_detail) },
              { key: 'doctor', header: 'Doctor', render: (row) => doctorName(row.doctor_detail) },
              { key: 'appointment_date', header: 'Date', render: (row) => formatDateTime(row.appointment_date) },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <Badge tone={row.status}>{row.status}</Badge>,
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <Link to={`/appointments/${row.id}`} className="text-sm font-medium text-teal-700 hover:underline">
                    View
                  </Link>
                ),
              },
            ]}
            rows={data.results}
          />
          <Pagination page={page} count={data.count} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
