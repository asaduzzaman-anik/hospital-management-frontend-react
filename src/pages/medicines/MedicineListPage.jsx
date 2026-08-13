import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { medicinesApi } from '../../api/medicines'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Fields'
import { Table, Pagination } from '../../components/ui/Table'
import { Alert, EmptyState, Spinner } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { STAFF_ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'

export function MedicineListPage() {
  const { user } = useAuth()
  const toast = useToast()
  const canWrite = STAFF_ROLES.includes(user.role)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function load(nextPage = page, nextSearch = search) {
    setLoading(true)
    setError('')
    try {
      setData(await medicinesApi.list({ page: nextPage, search: nextSearch || undefined }))
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
      await medicinesApi.remove(pendingDelete.id)
      toast.success('Medicine deleted.')
      setPendingDelete(null)
      load(page)
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Medicines"
        breadcrumb={[{ label: 'Medicines' }]}
        description="Search uses medicine name and description."
        actions={
          canWrite && (
            <Link to="/medicines/new">
              <Button>Add medicine</Button>
            </Link>
          )
        }
      />
      <form
        className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          setPage(1)
          load(1, search)
        }}
      >
        <div className="flex-1">
          <Input placeholder="Search medicines" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button type="submit">Search</Button>
      </form>
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : data.results.length === 0 ? (
        <EmptyState title="No medicines found." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'unit', header: 'Unit' },
              { key: 'description', header: 'Description' },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <div className="flex gap-2">
                    <Link to={`/medicines/${row.id}`} className="text-sm font-medium text-teal-700 hover:underline">View</Link>
                    {canWrite && (
                      <>
                        <Link to={`/medicines/${row.id}/edit`} className="text-sm font-medium text-slate-700 hover:underline">Edit</Link>
                        <button type="button" className="text-sm font-medium text-rose-600 hover:underline" onClick={() => setPendingDelete(row)}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
            rows={data.results}
          />
          <Pagination page={page} count={data.count} onPageChange={setPage} />
        </>
      )}
      <Modal
        open={Boolean(pendingDelete)}
        title="Delete medicine"
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
        Remove {pendingDelete?.name}?
      </Modal>
    </div>
  )
}
