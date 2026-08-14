import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { patientsApi } from '../../api/patients'
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
import { patientName } from '../../utils/format'

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'age_asc', label: 'Age (low-high)' },
  { value: 'age_desc', label: 'Age (high-low)' },
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

function patientInitials(patient) {
  const user = patient.user_detail || {}
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

export function PatientListPage() {
  const { user } = useAuth()
  const toast = useToast()
  const canWrite = STAFF_ROLES.includes(user.role)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('name_asc')
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function load(nextPage = page, nextSearch = search) {
    setLoading(true)
    setError('')
    try {
      setData(await patientsApi.list({ page: nextPage, search: nextSearch || undefined }))
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

  async function confirmDelete() {
    setDeleting(true)
    try {
      await patientsApi.remove(pendingDelete.id)
      toast.success('Patient deleted.')
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
      if (sort === 'name_desc') return patientName(b).localeCompare(patientName(a))
      if (sort === 'age_asc') return (Number(a.age) || 0) - (Number(b.age) || 0)
      if (sort === 'age_desc') return (Number(b.age) || 0) - (Number(a.age) || 0)
      return patientName(a).localeCompare(patientName(b))
    })
    return rows
  }, [data.results, sort])

  return (
    <div>
      <PageHeader
        title="Patients"
        breadcrumb={[{ label: 'Patients' }]}
        description="Search uses first name, last name, phone, and blood group."
        actions={
          canWrite && (
            <Link to="/patients/new">
              <Button>
                <Icon name="plus" className="h-4 w-4" />
                Add patient
              </Button>
            </Link>
          )
        }
      />

      <form
        className="mb-5 flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        onSubmit={(event) => {
          event.preventDefault()
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
            placeholder="Search patients by name, phone, or blood group..."
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
            <Icon name="users" className="h-4 w-4 text-teal-700" />
            {data.count} {data.count === 1 ? 'patient' : 'patients'} found
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
          <EmptyState title="No patients found." className="border-0 shadow-none" />
        ) : (
          <>
            <Table
              framed={false}
              columns={[
                {
                  key: 'name',
                  header: 'Patient',
                  render: (row) => {
                    const name = patientName(row)
                    return (
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarTone(name)}`}
                        >
                          {patientInitials(row)}
                        </span>
                        <span className="font-medium text-slate-800">{name}</span>
                      </div>
                    )
                  },
                },
                { key: 'age', header: 'Age' },
                { key: 'gender', header: 'Gender' },
                {
                  key: 'blood_group',
                  header: 'Blood group',
                  render: (row) => (
                    <Badge tone={row.blood_group} className="normal-case">
                      {row.blood_group || '—'}
                    </Badge>
                  ),
                },
                { key: 'phone', header: 'Phone' },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <IconActions>
                      <IconAction to={`/patients/${row.id}`} icon="eye" label="View" tone="teal" />
                      {canWrite && (
                        <>
                          <IconAction to={`/patients/${row.id}/edit`} icon="pencil" label="Edit" />
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
              itemLabel={data.count === 1 ? 'patient' : 'patients'}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <Modal
        open={Boolean(pendingDelete)}
        title="Delete patient"
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
        Remove {pendingDelete ? patientName(pendingDelete) : 'this patient'}?
      </Modal>
    </div>
  )
}
