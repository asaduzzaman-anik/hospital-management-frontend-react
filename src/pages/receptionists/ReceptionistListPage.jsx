import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usersApi } from '../../api/users'
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
import { PAGE_SIZE, ROLE_LABELS, ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'
import { fullName } from '../../utils/format'

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'username_asc', label: 'Username (A-Z)' },
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

function initialsFromName(name) {
  const parts = String(name || '').split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (String(name).replace(/[^A-Za-z]/g, '').slice(0, 2) || 'R').toUpperCase()
}

function avatarTone(name) {
  let hash = 0
  for (const char of name) hash += char.charCodeAt(0)
  return AVATAR_TONES[hash % AVATAR_TONES.length]
}

export function ReceptionistListPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [sort, setSort] = useState('name_asc')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const users = await fetchAllPages(usersApi.list, { role: ROLES.RECEPTIONIST })
      setRows(users.filter((item) => item.role === ROLES.RECEPTIONIST))
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const query = appliedSearch.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((item) => {
      const haystack = [item.username, item.email, item.first_name, item.last_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [rows, appliedSearch])

  const sorted = useMemo(() => {
    const next = [...filtered]
    next.sort((a, b) => {
      if (sort === 'name_desc') return fullName(b).localeCompare(fullName(a))
      if (sort === 'username_asc') return String(a.username || '').localeCompare(String(b.username || ''))
      return fullName(a).localeCompare(fullName(b))
    })
    return next
  }, [filtered, sort])

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return sorted.slice(start, start + PAGE_SIZE)
  }, [sorted, page])

  async function confirmDelete() {
    setDeleting(true)
    try {
      await usersApi.remove(pendingDelete.id)
      toast.success('Receptionist deleted.')
      setPendingDelete(null)
      load()
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Receptionists"
        breadcrumb={[{ label: 'Receptionists' }]}
        description="Admin-only staff accounts. Search uses name, username, and email."
        actions={
          <Link to="/receptionists/new">
            <Button>
              <Icon name="plus" className="h-4 w-4" />
              Add receptionist
            </Button>
          </Link>
        }
      />

      <form
        className="mb-5 flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        onSubmit={(event) => {
          event.preventDefault()
          setAppliedSearch(search)
          setPage(1)
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
            placeholder="Search name, username, or email..."
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
            <Icon name="reception" className="h-4 w-4 text-teal-700" />
            {sorted.length} {sorted.length === 1 ? 'receptionist' : 'receptionists'} found
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
        ) : sorted.length === 0 ? (
          <EmptyState
            title="No receptionist accounts found."
            description="Create a receptionist so they can sign in and handle front-desk workflows."
            className="border-0 shadow-none"
            action={
              <Link to="/receptionists/new">
                <Button>
                  <Icon name="plus" className="h-4 w-4" />
                  Add receptionist
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            <Table
              framed={false}
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  render: (row) => {
                    const name = fullName(row)
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
                { key: 'username', header: 'Username' },
                { key: 'email', header: 'Email', render: (row) => row.email || '—' },
                {
                  key: 'role',
                  header: 'Role',
                  render: (row) => <Badge tone={row.role}>{ROLE_LABELS[row.role]}</Badge>,
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <IconActions>
                      <IconAction to={`/receptionists/${row.id}`} icon="eye" label="View" tone="teal" />
                      <IconAction to={`/receptionists/${row.id}/edit`} icon="pencil" label="Edit" />
                      {row.id !== user.id && (
                        <IconAction
                          icon="trash"
                          label="Delete"
                          tone="rose"
                          onClick={() => setPendingDelete(row)}
                        />
                      )}
                    </IconActions>
                  ),
                },
              ]}
              rows={paged}
            />
            <Pagination
              numbered
              page={page}
              count={sorted.length}
              pageSize={PAGE_SIZE}
              itemLabel={sorted.length === 1 ? 'receptionist' : 'receptionists'}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

      <Modal
        open={Boolean(pendingDelete)}
        title="Delete receptionist"
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
        Remove {pendingDelete ? fullName(pendingDelete) : 'this receptionist'}? They will no longer be able to sign in.
      </Modal>
    </div>
  )
}
