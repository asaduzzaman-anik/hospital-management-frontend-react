import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usersApi } from '../../api/users'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Fields'
import { Table } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Alert, EmptyState, Spinner } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ROLE_LABELS, ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'
import { fullName } from '../../utils/format'

export function ReceptionistListPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
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

  const visible = useMemo(() => {
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
        description="Admin-only staff accounts. Receptionists can manage doctors, patients, appointments, medicines, and billing."
        actions={
          <Link to="/receptionists/new">
            <Button>Add receptionist</Button>
          </Link>
        }
      />

      <form
        className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          setAppliedSearch(search)
        }}
      >
        <div className="flex-1">
          <Input placeholder="Search name, username, or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No receptionist accounts found."
          description="Create a receptionist so they can sign in and handle front-desk workflows."
          action={
            <Link to="/receptionists/new">
              <Button>Add receptionist</Button>
            </Link>
          }
        />
      ) : (
        <Table
          columns={[
            { key: 'name', header: 'Name', render: (row) => fullName(row) },
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
                <div className="flex gap-2">
                  <Link to={`/receptionists/${row.id}/edit`} className="text-sm font-medium text-slate-700 hover:underline">
                    Edit
                  </Link>
                  {row.id === user.id ? (
                    <span className="text-sm text-slate-400">Current user</span>
                  ) : (
                    <button
                      type="button"
                      className="text-sm font-medium text-rose-600 hover:underline"
                      onClick={() => setPendingDelete(row)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          rows={visible}
        />
      )}

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
