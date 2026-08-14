import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { doctorsApi } from '../../api/doctors'
import { departmentsApi } from '../../api/departments'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { IconAction, IconActions } from '../../components/ui/IconAction'
import { Table, Pagination } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Alert, EmptyState, Spinner } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { PAGE_SIZE, STAFF_ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'
import { doctorName } from '../../utils/format'

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'experience_desc', label: 'Experience (high-low)' },
  { value: 'experience_asc', label: 'Experience (low-high)' },
]

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

export function DoctorListPage() {
  const { user } = useAuth()
  const toast = useToast()
  const canWrite = STAFF_ROLES.includes(user.role)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [availability, setAvailability] = useState('')
  const [sort, setSort] = useState('name_asc')
  const [departments, setDepartments] = useState([])
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchAllPages(departmentsApi.list).then(setDepartments).catch(() => setDepartments([]))
  }, [])

  async function load(nextPage = page, overrides = {}) {
    setLoading(true)
    setError('')
    try {
      const nextSearch = overrides.search ?? search
      const nextDepartment = overrides.department ?? department
      const nextAvailability = overrides.availability ?? availability
      const params = { page: nextPage, search: nextSearch || undefined }
      if (nextDepartment) params.department = nextDepartment
      if (nextAvailability !== '') params.is_available = nextAvailability
      setData(await doctorsApi.list(params))
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
    setSearch('')
    setDepartment('')
    setAvailability('')
    setSort('name_asc')
    setPage(1)
    load(1, { search: '', department: '', availability: '' })
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await doctorsApi.remove(pendingDelete.id)
      toast.success('Doctor deleted.')
      setPendingDelete(null)
      load(page)
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setDeleting(false)
    }
  }

  const sortedRows = useMemo(() => {
    const rows = [...data.results]
    rows.sort((a, b) => {
      if (sort === 'name_desc') return doctorName(b).localeCompare(doctorName(a))
      if (sort === 'experience_desc') return (Number(b.experience) || 0) - (Number(a.experience) || 0)
      if (sort === 'experience_asc') return (Number(a.experience) || 0) - (Number(b.experience) || 0)
      return doctorName(a).localeCompare(doctorName(b))
    })
    return rows
  }, [data.results, sort])

  return (
    <div>
      <PageHeader
        title="Doctors"
        breadcrumb={[{ label: 'Doctors' }]}
        description="Search uses first name, last name, specialization, and department name."
        actions={
          canWrite && (
            <Link to="/doctors/new">
              <Button>
                <Icon name="plus" className="h-4 w-4" />
                Add doctor
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
              placeholder="Search name, specialization, department"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <fieldset className="mb-5 space-y-1">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Departments
            </legend>
            <RadioOption name="department" value="" checked={department === ''} onChange={(e) => setDepartment(e.target.value)}>
              All departments
            </RadioOption>
            {departments.map((item) => (
              <RadioOption
                key={item.id}
                name="department"
                value={String(item.id)}
                checked={department === String(item.id)}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {item.name}
              </RadioOption>
            ))}
          </fieldset>

          <fieldset className="mb-5 space-y-1">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Availability
            </legend>
            <RadioOption name="availability" value="" checked={availability === ''} onChange={(e) => setAvailability(e.target.value)}>
              Any availability
            </RadioOption>
            <RadioOption name="availability" value="true" checked={availability === 'true'} onChange={(e) => setAvailability(e.target.value)}>
              Available
            </RadioOption>
            <RadioOption name="availability" value="false" checked={availability === 'false'} onChange={(e) => setAvailability(e.target.value)}>
              Unavailable
            </RadioOption>
          </fieldset>

          <Button type="submit" className="w-full">
            Apply filters
          </Button>
        </form>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-medium text-slate-700">
              {data.count} {data.count === 1 ? 'doctor' : 'doctors'} found
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
            <EmptyState title="No doctors found." className="border-0 shadow-none" />
          ) : (
            <>
              <Table
                framed={false}
                columns={[
                  {
                    key: 'name',
                    header: 'Doctor',
                    render: (row) => (
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                          <Icon name="user" className="h-4 w-4" />
                        </span>
                        <span className="font-medium text-slate-800">{doctorName(row)}</span>
                      </div>
                    ),
                  },
                  { key: 'department', header: 'Department', render: (row) => row.department_detail?.name || '—' },
                  { key: 'specialization', header: 'Specialization' },
                  { key: 'phone', header: 'Phone' },
                  { key: 'experience', header: 'Experience', render: (row) => `${row.experience} yrs` },
                  {
                    key: 'is_available',
                    header: 'Status',
                    render: (row) => (
                      <Badge tone={row.is_available ? 'available' : 'unavailable'}>
                        {row.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    ),
                  },
                  {
                    key: 'actions',
                    header: 'Actions',
                    render: (row) => (
                      <IconActions>
                        <IconAction to={`/doctors/${row.id}`} icon="eye" label="View" tone="teal" />
                        {canWrite && (
                          <>
                            <IconAction to={`/doctors/${row.id}/edit`} icon="pencil" label="Edit" />
                            <IconAction
                              icon="trash"
                              label="Delete"
                              tone="rose"
                              onClick={() => setPendingDelete(row)}
                            />
                          </>
                        )}
                      </IconActions>
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
                itemLabel={data.count === 1 ? 'doctor' : 'doctors'}
                onPageChange={setPage}
              />
            </>
          )}
        </section>
      </div>

      <Modal
        open={Boolean(pendingDelete)}
        title="Delete doctor"
        onClose={() => setPendingDelete(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="danger" disabled={deleting} onClick={confirmDelete}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </>
        }
      >
        Remove {pendingDelete ? doctorName(pendingDelete) : 'this doctor'}?
      </Modal>
    </div>
  )
}
