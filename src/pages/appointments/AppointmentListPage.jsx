import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { appointmentsApi } from '../../api/appointments'
import { doctorsApi } from '../../api/doctors'
import { patientsApi } from '../../api/patients'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Table, Pagination } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Alert, EmptyState, Spinner } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { APPOINTMENT_STATUSES, PAGE_SIZE, STAFF_ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'
import { doctorName, formatDateTime, patientName, toDateKey } from '../../utils/format'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'patient_asc', label: 'Patient (A-Z)' },
  { value: 'patient_desc', label: 'Patient (Z-A)' },
  { value: 'doctor_asc', label: 'Doctor (A-Z)' },
  { value: 'doctor_desc', label: 'Doctor (Z-A)' },
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

function DateInput({ value, onChange, min }) {
  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        min={min}
        onChange={onChange}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 ${
          value
            ? 'text-slate-900'
            : 'text-transparent [&::-webkit-datetime-edit]:text-transparent [&::-webkit-datetime-edit-fields-wrapper]:text-transparent [&::-webkit-datetime-edit-text]:text-transparent [&::-webkit-datetime-edit-month-field]:text-transparent [&::-webkit-datetime-edit-day-field]:text-transparent [&::-webkit-datetime-edit-year-field]:text-transparent'
        }`}
      />
      {!value && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400">
          Pick a date
        </span>
      )}
    </div>
  )
}

function RadioOption({ name, value, checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-teal-700"
      />
      <span className="min-w-0 truncate">{children}</span>
    </label>
  )
}

function SearchableRadioDropdown({
  label,
  name,
  allLabel,
  items,
  getLabel,
  value,
  onChange,
  placeholder,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef(null)
  const searchRef = useRef(null)

  const selected = items.find((item) => String(item.id) === String(value))
  const selectedLabel = selected ? getLabel(selected) : allLabel

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => getLabel(item).toLowerCase().includes(q))
  }, [items, query, getLabel])

  useEffect(() => {
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setQuery('')
    requestAnimationFrame(() => searchRef.current?.focus())
  }, [open])

  function select(nextValue) {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="mb-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm outline-none transition hover:bg-slate-50 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`min-w-0 truncate ${value ? 'text-slate-900' : 'text-slate-500'}`}>
          {selectedLabel}
        </span>
        <Icon
          name="chevronDown"
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="relative z-20">
          <div className="absolute mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <div className="relative mb-2">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchRef}
                type="search"
                value={query}
                placeholder={placeholder}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <RadioOption name={name} value="" checked={value === ''} onChange={() => select('')}>
              {allLabel}
            </RadioOption>
            <div className="mt-1 max-h-[10.5rem] space-y-0.5 overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <p className="px-1 py-2 text-xs text-slate-500">No matches</p>
              ) : (
                filtered.map((item) => (
                  <RadioOption
                    key={item.id}
                    name={name}
                    value={String(item.id)}
                    checked={value === String(item.id)}
                    onChange={() => select(String(item.id))}
                  >
                    {getLabel(item)}
                  </RadioOption>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function initialsFromName(name) {
  const parts = String(name || '').split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (String(name).replace(/[^A-Za-z]/g, '').slice(0, 2) || 'P').toUpperCase()
}

function avatarTone(name) {
  let hash = 0
  for (const char of name) hash += char.charCodeAt(0)
  return AVATAR_TONES[hash % AVATAR_TONES.length]
}

function matchesDateRange(value, from, to) {
  const key = toDateKey(value)
  if (!key) return !from && !to
  if (from && key < from) return false
  if (to && key > to) return false
  return true
}

export function AppointmentListPage() {
  const { user } = useAuth()
  const canBook = user.role === 'patient' || STAFF_ROLES.includes(user.role)
  const canFilterPatients = STAFF_ROLES.includes(user.role) || user.role === 'doctor'
  const [page, setPage] = useState(1)
  const [doctor, setDoctor] = useState('')
  const [patient, setPatient] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState('newest')
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAllPages(doctorsApi.list)
      .then((list) => setDoctors([...list].sort((a, b) => doctorName(a).localeCompare(doctorName(b)))))
      .catch(() => setDoctors([]))
    if (canFilterPatients) {
      fetchAllPages(patientsApi.list)
        .then((list) => setPatients([...list].sort((a, b) => patientName(a).localeCompare(patientName(b)))))
        .catch(() => setPatients([]))
    }
  }, [canFilterPatients])

  async function load(nextPage = page, overrides = {}) {
    setLoading(true)
    setError('')
    try {
      const nextDoctor = overrides.doctor ?? doctor
      const nextPatient = overrides.patient ?? patient
      const nextStatus = overrides.status ?? status
      const nextFrom = overrides.dateFrom ?? dateFrom
      const nextTo = overrides.dateTo ?? dateTo
      const params = {}
      if (nextDoctor) params.doctor = nextDoctor
      if (nextPatient) params.patient = nextPatient
      if (nextStatus) params.status = nextStatus

      if (nextFrom || nextTo) {
        const all = await fetchAllPages(appointmentsApi.list, params)
        const matched = all.filter((item) => matchesDateRange(item.appointment_date, nextFrom, nextTo))
        const start = (nextPage - 1) * PAGE_SIZE
        setData({
          results: matched.slice(start, start + PAGE_SIZE),
          count: matched.length,
        })
      } else {
        setData(await appointmentsApi.list({ ...params, page: nextPage }))
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

  function applyFilters(event) {
    event.preventDefault()
    setPage(1)
    load(1)
  }

  function resetFilters() {
    setDoctor('')
    setPatient('')
    setStatus('')
    setDateFrom('')
    setDateTo('')
    setSort('newest')
    setPage(1)
    load(1, { doctor: '', patient: '', status: '', dateFrom: '', dateTo: '' })
  }

  const sortedRows = useMemo(() => {
    const rows = [...data.results]
    rows.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.appointment_date || 0) - new Date(b.appointment_date || 0)
      if (sort === 'patient_asc') return patientName(a.patient_detail).localeCompare(patientName(b.patient_detail))
      if (sort === 'patient_desc') return patientName(b.patient_detail).localeCompare(patientName(a.patient_detail))
      if (sort === 'doctor_asc') return doctorName(a.doctor_detail).localeCompare(doctorName(b.doctor_detail))
      if (sort === 'doctor_desc') return doctorName(b.doctor_detail).localeCompare(doctorName(a.doctor_detail))
      return new Date(b.appointment_date || 0) - new Date(a.appointment_date || 0)
    })
    return rows
  }, [data.results, sort])

  return (
    <div>
      <PageHeader
        title="Appointments"
        breadcrumb={[{ label: 'Appointments' }]}
        description="Filter by doctor, patient, status, and appointment date range."
        actions={
          canBook && (
            <Link to="/appointments/new">
              <Button>
                <Icon name="plus" className="h-4 w-4" />
                Book appointment
              </Button>
            </Link>
          )
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <form
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          onSubmit={applyFilters}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
            <button
              type="button"
              className="text-sm font-medium text-teal-700 hover:underline"
              onClick={resetFilters}
            >
              Reset
            </button>
          </div>

          <SearchableRadioDropdown
            label="Doctor"
            name="doctor"
            allLabel="All doctors"
            items={doctors}
            getLabel={doctorName}
            value={doctor}
            onChange={setDoctor}
            placeholder="Search doctor"
          />

          {canFilterPatients && (
            <SearchableRadioDropdown
              label="Patient"
              name="patient"
              allLabel="All patients"
              items={patients}
              getLabel={patientName}
              value={patient}
              onChange={setPatient}
              placeholder="Search patient"
            />
          )}

          <fieldset className="mb-5 space-y-1">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </legend>
            <RadioOption name="status" value="" checked={status === ''} onChange={(e) => setStatus(e.target.value)}>
              All statuses
            </RadioOption>
            {APPOINTMENT_STATUSES.map((item) => (
              <RadioOption
                key={item.value}
                name="status"
                value={item.value}
                checked={status === item.value}
                onChange={(e) => setStatus(e.target.value)}
              >
                {item.label}
              </RadioOption>
            ))}
          </fieldset>

          <fieldset className="mb-5 space-y-3">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date range
            </legend>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">From</span>
              <DateInput value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">To</span>
              <DateInput
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>
          </fieldset>

          <Button type="submit" className="w-full">
            Apply filters
          </Button>
        </form>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Icon name="calendar" className="h-4 w-4 text-teal-700" />
              {data.count} {data.count === 1 ? 'appointment' : 'appointments'} found
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
            <EmptyState title="No appointments found." className="border-0 shadow-none" />
          ) : (
            <>
              <Table
                framed={false}
                columns={[
                  {
                    key: 'patient',
                    header: 'Patient',
                    render: (row) => {
                      const name = patientName(row.patient_detail)
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
                    render: (row) => doctorName(row.doctor_detail),
                  },
                  {
                    key: 'appointment_date',
                    header: 'Date',
                    render: (row) => formatDateTime(row.appointment_date),
                  },
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
                rows={sortedRows}
              />
              <Pagination
                numbered
                page={page}
                count={data.count}
                pageSize={PAGE_SIZE}
                itemLabel={data.count === 1 ? 'appointment' : 'appointments'}
                onPageChange={setPage}
              />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
