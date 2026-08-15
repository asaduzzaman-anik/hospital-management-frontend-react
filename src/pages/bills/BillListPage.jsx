import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { billsApi } from '../../api/bills'
import { appointmentsApi } from '../../api/appointments'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { Table, Pagination } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Alert, EmptyState, Spinner } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { PAGE_SIZE, STAFF_ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'
import { billDoctorDetail, billPatientDetail, doctorName, formatDateTime, formatMoney, isDoctorRelatedBill, patientName, relatedId, toDateKey } from '../../utils/format'
import { hydrateBills } from '../../utils/billRelations'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'amount_desc', label: 'Amount (high-low)' },
  { value: 'amount_asc', label: 'Amount (low-high)' },
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
        className="h-4 w-4 accent-teal-700"
      />
      {children}
    </label>
  )
}

function patientInitials(patient) {
  const user = patient?.user_detail || {}
  const first = (user.first_name || '').trim()
  const last = (user.last_name || '').trim()
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase()
  const name = patientName(patient)
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (name.replace(/[^A-Za-z]/g, '').slice(0, 2) || 'P').toUpperCase()
}

function avatarTone(name) {
  let hash = 0
  for (const char of name) hash += char.charCodeAt(0)
  return AVATAR_TONES[hash % AVATAR_TONES.length]
}

function matchesSearch(row, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [
    String(row.id),
    patientName(billPatientDetail(row)),
    doctorName(billDoctorDetail(row)),
  ].some((value) => String(value || '').toLowerCase().includes(q))
}

function matchesDateRange(row, from, to) {
  const key = toDateKey(row.created_at)
  if (!key) return !from && !to
  if (from && key < from) return false
  if (to && key > to) return false
  return true
}

function paidFromSearch(searchParams) {
  const value = searchParams.get('paid')
  return value === 'true' || value === 'false' ? value : ''
}

export function BillListPage() {
  const { user, doctorProfile } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlPaid = paidFromSearch(searchParams)
  const canWrite = STAFF_ROLES.includes(user.role)
  const isDoctor = user.role === 'doctor'
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [paid, setPaid] = useState(urlPaid)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sort, setSort] = useState('newest')
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(nextPage = page, overrides = {}) {
    setLoading(true)
    setError('')
    try {
      const nextSearch = overrides.search ?? search
      const nextPaid = overrides.paid ?? paid
      const nextFrom = overrides.dateFrom ?? dateFrom
      const nextTo = overrides.dateTo ?? dateTo
      const params = {}
      if (nextPaid !== '') params.paid = nextPaid

      const needsClientFilter = Boolean(isDoctor || nextSearch.trim() || nextFrom || nextTo)
      if (needsClientFilter) {
        const [all, appointments] = await Promise.all([
          fetchAllPages(billsApi.list, params),
          isDoctor ? fetchAllPages(appointmentsApi.list) : Promise.resolve([]),
        ])
        const appointmentIds = new Set(appointments.map((item) => Number(item.id)))
        const patientIds = new Set(
          appointments
            .map((item) => Number(relatedId(item.patient) ?? item.patient_detail?.id))
            .filter(Boolean),
        )
        const hydrated = await hydrateBills({ results: all })
        const matched = hydrated.results.filter(
          (row) =>
            isDoctorRelatedBill(row, { user, doctorProfile, appointmentIds, patientIds }) &&
            matchesSearch(row, nextSearch) &&
            matchesDateRange(row, nextFrom, nextTo),
        )
        const start = (nextPage - 1) * PAGE_SIZE
        setData({
          results: matched.slice(start, start + PAGE_SIZE),
          count: matched.length,
        })
      } else {
        setData(await hydrateBills(await billsApi.list({ ...params, page: nextPage })))
      }
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(page, { paid: urlPaid })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, urlPaid])

  useEffect(() => {
    setPaid(urlPaid)
    setPage(1)
  }, [urlPaid])

  function applyFilters(event) {
    event.preventDefault()
    setPage(1)
    if (paid === urlPaid) {
      load(1)
      return
    }
    if (paid) setSearchParams({ paid }, { replace: true })
    else setSearchParams({}, { replace: true })
  }

  function resetFilters() {
    setSearch('')
    setPaid('')
    setDateFrom('')
    setDateTo('')
    setSort('newest')
    setPage(1)
    if (urlPaid) setSearchParams({}, { replace: true })
    load(1, { search: '', paid: '', dateFrom: '', dateTo: '' })
  }

  const sortedRows = useMemo(() => {
    const rows = [...data.results]
    rows.sort((a, b) => {
      if (sort === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0)
      if (sort === 'amount_desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0)
      if (sort === 'amount_asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0)
      if (sort === 'patient_asc') return patientName(billPatientDetail(a)).localeCompare(patientName(billPatientDetail(b)))
      if (sort === 'patient_desc') return patientName(billPatientDetail(b)).localeCompare(patientName(billPatientDetail(a)))
      if (sort === 'doctor_asc') return doctorName(billDoctorDetail(a)).localeCompare(doctorName(billDoctorDetail(b)))
      if (sort === 'doctor_desc') return doctorName(billDoctorDetail(b)).localeCompare(doctorName(billDoctorDetail(a)))
      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })
    return rows
  }, [data.results, sort])

  return (
    <div>
      <PageHeader
        title="Billing"
        breadcrumb={[{ label: 'Billing' }]}
        description={
          isDoctor
            ? 'Showing bills linked to your appointments only. Search by patient or doctor name, or filter by payment status and created date.'
            : 'Search by patient or doctor name. Filter by payment status and created date.'
        }
        actions={
          canWrite && (
            <Link to="/bills/new">
              <Button>
                <Icon name="plus" className="h-4 w-4" />
                Generate bill
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

          <div className="relative mb-5">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient or doctor name"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <fieldset className="mb-5 space-y-1">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </legend>
            <RadioOption name="paid" value="" checked={paid === ''} onChange={(e) => setPaid(e.target.value)}>
              All statuses
            </RadioOption>
            <RadioOption name="paid" value="true" checked={paid === 'true'} onChange={(e) => setPaid(e.target.value)}>
              Paid
            </RadioOption>
            <RadioOption name="paid" value="false" checked={paid === 'false'} onChange={(e) => setPaid(e.target.value)}>
              Unpaid
            </RadioOption>
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
              <Icon name="receipt" className="h-4 w-4 text-teal-700" />
              {data.count} {data.count === 1 ? 'bill' : 'bills'} found
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
            <EmptyState title="No bills found." className="border-0 shadow-none" />
          ) : (
            <>
              <Table
                framed={false}
                columns={[
                  {
                    key: 'id',
                    header: 'Bill',
                    render: (row) => <span className="font-medium text-slate-600">#{row.id}</span>,
                  },
                  {
                    key: 'patient',
                    header: 'Patient',
                    render: (row) => {
                      const patient = billPatientDetail(row)
                      const name = patientName(patient)
                      return (
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarTone(name)}`}
                          >
                            {patientInitials(patient)}
                          </span>
                          <span className="font-medium text-slate-800">{name}</span>
                        </div>
                      )
                    },
                  },
                  {
                    key: 'doctor',
                    header: 'Doctor',
                    render: (row) => doctorName(billDoctorDetail(row)),
                  },
                  {
                    key: 'amount',
                    header: 'Amount',
                    render: (row) => <span className="font-medium text-slate-800">{formatMoney(row.amount)}</span>,
                  },
                  {
                    key: 'paid',
                    header: 'Status',
                    render: (row) => (
                      <Badge tone={row.paid ? 'paid' : 'unpaid'}>{row.paid ? 'Paid' : 'Unpaid'}</Badge>
                    ),
                  },
                  { key: 'created_at', header: 'Created', render: (row) => formatDateTime(row.created_at) },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (row) => (
                      <Link to={`/bills/${row.id}`} className="text-sm font-medium text-teal-700 hover:underline">
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
                itemLabel={data.count === 1 ? 'bill' : 'bills'}
                onPageChange={setPage}
              />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
