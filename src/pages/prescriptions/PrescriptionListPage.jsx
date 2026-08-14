import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { prescriptionsApi } from '../../api/prescriptions'
import { appointmentsApi } from '../../api/appointments'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Table, Pagination } from '../../components/ui/Table'
import { Alert, EmptyState, Spinner } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { PAGE_SIZE } from '../../utils/constants'
import { getApiError } from '../../utils/errors'
import { doctorName, formatDateTime, patientName } from '../../utils/format'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'patient_asc', label: 'Patient (A-Z)' },
  { value: 'doctor_asc', label: 'Doctor (A-Z)' },
]

const AVATAR_TONES = [
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
  'bg-indigo-100 text-indigo-700',
]

function appointmentId(row) {
  if (row.appointment && typeof row.appointment === 'object') return row.appointment.id
  return row.appointment
}

function nestedAppointment(row) {
  if (row.appointment_detail) return row.appointment_detail
  if (row.appointment && typeof row.appointment === 'object') return row.appointment
  return null
}

function rowPatient(row) {
  return row.appointment_detail?.patient_detail || row.patient_detail
}

function rowDoctor(row) {
  return row.appointment_detail?.doctor_detail || row.doctor_detail
}

function rowPatientLabel(row) {
  const name = patientName(rowPatient(row))
  if (name !== '—') return name
  const id = appointmentId(row)
  return id ? `Appointment #${id}` : '—'
}

function initialsFromName(name) {
  const parts = String(name || '').split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (String(name).replace(/[^A-Za-z]/g, '').slice(0, 2) || 'PR').toUpperCase()
}

function avatarTone(name) {
  let hash = 0
  for (const char of name) hash += char.charCodeAt(0)
  return AVATAR_TONES[hash % AVATAR_TONES.length]
}

async function withAppointmentDetails(result) {
  const rows = result.results || []
  const missingIds = [...new Set(
    rows
      .filter((row) => appointmentId(row) && !nestedAppointment(row)?.patient_detail)
      .map((row) => appointmentId(row)),
  )]
  const fetched = await Promise.all(
    missingIds.map((id) => appointmentsApi.get(id).catch(() => null)),
  )
  const byId = Object.fromEntries(fetched.filter(Boolean).map((item) => [item.id, item]))

  return {
    ...result,
    results: rows.map((row) => ({
      ...row,
      appointment_detail: nestedAppointment(row) || byId[appointmentId(row)] || null,
    })),
  }
}

function matchesSearch(row, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [
    String(row.id),
    rowPatientLabel(row),
    doctorName(rowDoctor(row)),
    row.diagnosis,
  ].some((value) => String(value || '').toLowerCase().includes(q))
}

export function PrescriptionListPage() {
  const { user } = useAuth()
  const canCreate = user.role === 'doctor' || user.role === 'admin'
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(nextPage = page, nextSearch = appliedSearch) {
    setLoading(true)
    setError('')
    try {
      if (nextSearch.trim()) {
        const all = await withAppointmentDetails({
          results: await fetchAllPages(prescriptionsApi.list),
        })
        const matched = all.results.filter((row) => matchesSearch(row, nextSearch))
        const start = (nextPage - 1) * PAGE_SIZE
        setData({
          results: matched.slice(start, start + PAGE_SIZE),
          count: matched.length,
        })
      } else {
        setData(await withAppointmentDetails(await prescriptionsApi.list({ page: nextPage })))
      }
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

  const sortedRows = useMemo(() => {
    const rows = [...data.results]
    rows.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0)
      if (sort === 'patient_asc') return rowPatientLabel(a).localeCompare(rowPatientLabel(b))
      if (sort === 'doctor_asc') return doctorName(rowDoctor(a)).localeCompare(doctorName(rowDoctor(b)))
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })
    return rows
  }, [data.results, sort])

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        breadcrumb={[{ label: 'Prescriptions' }]}
        description={
          user.role === 'patient' || user.role === 'doctor'
            ? 'Showing records scoped to your account. Search uses patient, doctor, and diagnosis.'
            : 'Search uses patient name, doctor name, and diagnosis.'
        }
        actions={
          canCreate && (
            <Link to="/prescriptions/new">
              <Button>
                <Icon name="plus" className="h-4 w-4" />
                New prescription
              </Button>
            </Link>
          )
        }
      />

      <form
        className="mb-5 flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        onSubmit={(event) => {
          event.preventDefault()
          setAppliedSearch(search)
          setPage(1)
          load(1, search)
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient, doctor, or diagnosis..."
            className="w-full border-0 bg-transparent py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
          />
        </div>
        <Button type="submit" className="rounded-none px-5">
          <Icon name="search" className="h-4 w-4" />
          Search
        </Button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Icon name="file" className="h-4 w-4 text-teal-700" />
            {data.count} {data.count === 1 ? 'prescription' : 'prescriptions'} found
          </p>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Sort by
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && (
          <div className="px-4 pt-4">
            <Alert>{error}</Alert>
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : data.results.length === 0 ? (
          <EmptyState title="No prescriptions found." className="border-0 shadow-none" />
        ) : (
          <>
            <Table
              framed={false}
              columns={[
                {
                  key: 'id',
                  header: 'ID',
                  render: (row) => (
                    <span className="font-medium text-slate-600">#{row.id}</span>
                  ),
                },
                {
                  key: 'patient',
                  header: 'Patient',
                  render: (row) => {
                    const name = rowPatientLabel(row)
                    return (
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarTone(name)}`}
                        >
                          {initialsFromName(name)}
                        </span>
                        <span className="font-medium text-slate-800">{name}</span>
                      </div>
                    )
                  },
                },
                {
                  key: 'doctor',
                  header: 'Doctor',
                  render: (row) => doctorName(rowDoctor(row)),
                },
                { key: 'diagnosis', header: 'Diagnosis' },
                { key: 'created_at', header: 'Created', render: (row) => formatDateTime(row.created_at) },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <Link to={`/prescriptions/${row.id}`} className="text-sm font-medium text-teal-700 hover:underline">
                      View
                    </Link>
                  ),
                },
              ]}
              rows={sortedRows}
            />
            <Pagination
              numbered
              page={page}
              count={data.count}
              pageSize={PAGE_SIZE}
              itemLabel={data.count === 1 ? 'prescription' : 'prescriptions'}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  )
}
