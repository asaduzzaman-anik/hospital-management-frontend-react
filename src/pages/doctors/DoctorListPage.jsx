import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doctorsApi } from '../../api/doctors'
import { departmentsApi } from '../../api/departments'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Fields'
import { Table, Pagination } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Alert, EmptyState, Spinner } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { STAFF_ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'
import { doctorName } from '../../utils/format'

export function DoctorListPage() {
  const { user } = useAuth()
  const toast = useToast()
  const canWrite = STAFF_ROLES.includes(user.role)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [availability, setAvailability] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [departments, setDepartments] = useState([])
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchAllPages(departmentsApi.list).then(setDepartments).catch(() => setDepartments([]))
  }, [])

  async function load(nextPage = page) {
    setLoading(true)
    setError('')
    try {
      if (availableOnly) {
        const results = await doctorsApi.available()
        const list = Array.isArray(results) ? results : results.results || []
        setData({ results: list, count: list.length })
      } else {
        const params = { page: nextPage, search: search || undefined }
        if (department) params.department = department
        if (availability !== '') params.is_available = availability
        setData(await doctorsApi.list(params))
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
  }, [page, availableOnly])

  function applyFilters(event) {
    event.preventDefault()
    setPage(1)
    load(1)
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

  return (
    <div>
      <PageHeader
        title="Doctors"
        breadcrumb={[{ label: 'Doctors' }]}
        description="Search uses first name, last name, specialization, and department name."
        actions={
          canWrite && (
            <Link to="/doctors/new">
              <Button>Add doctor</Button>
            </Link>
          )
        }
      />

      <form className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-5" onSubmit={applyFilters}>
        <Input placeholder="Search name, specialization, department" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={department} onChange={(e) => setDepartment(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </Select>
        <Select value={availability} onChange={(e) => setAvailability(e.target.value)} disabled={availableOnly}>
          <option value="">Any availability</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </Select>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={availableOnly} onChange={(e) => { setAvailableOnly(e.target.checked); setPage(1) }} />
          Available endpoint
        </label>
        <Button type="submit">Apply filters</Button>
      </form>

      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : data.results.length === 0 ? (
        <EmptyState title="No doctors found." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'name', header: 'Doctor', render: (row) => doctorName(row) },
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
                  <div className="flex gap-2">
                    <Link to={`/doctors/${row.id}`} className="text-sm font-medium text-teal-700 hover:underline">View</Link>
                    {canWrite && (
                      <>
                        <Link to={`/doctors/${row.id}/edit`} className="text-sm font-medium text-slate-700 hover:underline">Edit</Link>
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
          {!availableOnly && <Pagination page={page} count={data.count} onPageChange={setPage} />}
        </>
      )}

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
