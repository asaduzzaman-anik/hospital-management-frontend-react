import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { patientsApi } from '../../api/patients'
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
import { patientName } from '../../utils/format'

export function PatientListPage() {
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

  return (
    <div>
      <PageHeader
        title="Patients"
        breadcrumb={[{ label: 'Patients' }]}
        description="Search uses first name, last name, phone, and blood group."
        actions={
          canWrite && (
            <Link to="/patients/new">
              <Button>Add patient</Button>
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
          <Input placeholder="Search patients" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button type="submit">Search</Button>
      </form>
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : data.results.length === 0 ? (
        <EmptyState title="No patients found." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'name', header: 'Patient', render: (row) => patientName(row) },
              { key: 'age', header: 'Age' },
              { key: 'gender', header: 'Gender' },
              { key: 'blood_group', header: 'Blood group' },
              { key: 'phone', header: 'Phone' },
              {
                key: 'actions',
                header: 'Actions',
                render: (row) => (
                  <div className="flex gap-2">
                    <Link to={`/patients/${row.id}`} className="text-sm font-medium text-teal-700 hover:underline">View</Link>
                    {canWrite && (
                      <>
                        <Link to={`/patients/${row.id}/edit`} className="text-sm font-medium text-slate-700 hover:underline">Edit</Link>
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
