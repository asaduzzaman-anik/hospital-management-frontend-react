import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { departmentsApi } from '../../api/departments'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Table, Pagination } from '../../components/ui/Table'
import { Alert, EmptyState, Spinner } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../context/ToastContext'
import { getApiError } from '../../utils/errors'

export function DepartmentListPage() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function load(nextPage = page) {
    setLoading(true)
    setError('')
    try {
      setData(await departmentsApi.list({ page: nextPage }))
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
      await departmentsApi.remove(pendingDelete.id)
      toast.success('Department deleted.')
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
        title="Departments"
        breadcrumb={[{ label: 'Departments' }]}
        actions={
          <Link to="/departments/new">
            <Button>Add department</Button>
          </Link>
        }
      />
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : data.results.length === 0 ? (
        <EmptyState title="No departments found." description="Create a department before adding doctors." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'description', header: 'Description' },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <div className="flex gap-2">
                    <Link to={`/departments/${row.id}/edit`} className="text-sm font-medium text-teal-700 hover:underline">
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="text-sm font-medium text-rose-600 hover:underline"
                      onClick={() => setPendingDelete(row)}
                    >
                      Delete
                    </button>
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
        title="Delete department"
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
        This will permanently remove {pendingDelete?.name}. Doctors assigned to this department may fail to load.
      </Modal>
    </div>
  )
}
