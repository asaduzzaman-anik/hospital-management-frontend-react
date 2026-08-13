import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { billsApi } from '../../api/bills'
import { patientsApi } from '../../api/patients'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Fields'
import { Table, Pagination } from '../../components/ui/Table'
import { Badge } from '../../components/ui/Badge'
import { Alert, EmptyState, Spinner } from '../../components/ui/Feedback'
import { useAuth } from '../../context/AuthContext'
import { STAFF_ROLES } from '../../utils/constants'
import { getApiError } from '../../utils/errors'
import { formatDateTime, formatMoney, patientName } from '../../utils/format'

export function BillListPage() {
  const { user } = useAuth()
  const canWrite = STAFF_ROLES.includes(user.role)
  const [page, setPage] = useState(1)
  const [patient, setPatient] = useState('')
  const [paid, setPaid] = useState('')
  const [patients, setPatients] = useState([])
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (canWrite) {
      fetchAllPages(patientsApi.list).then(setPatients).catch(() => setPatients([]))
    }
  }, [canWrite])

  async function load(nextPage = page) {
    setLoading(true)
    setError('')
    try {
      const params = { page: nextPage }
      if (patient) params.patient = patient
      if (paid !== '') params.paid = paid
      setData(await billsApi.list(params))
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

  return (
    <div>
      <PageHeader
        title="Billing"
        breadcrumb={[{ label: 'Billing' }]}
        actions={
          canWrite && (
            <Link to="/bills/new">
              <Button>Generate bill</Button>
            </Link>
          )
        }
      />
      <form
        className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault()
          setPage(1)
          load(1)
        }}
      >
        {canWrite && (
          <Select value={patient} onChange={(e) => setPatient(e.target.value)}>
            <option value="">All patients</option>
            {patients.map((item) => (
              <option key={item.id} value={item.id}>{patientName(item)}</option>
            ))}
          </Select>
        )}
        <Select value={paid} onChange={(e) => setPaid(e.target.value)}>
          <option value="">All statuses</option>
          <option value="true">Paid</option>
          <option value="false">Unpaid</option>
        </Select>
        <Button type="submit">Filter</Button>
      </form>
      {error && <Alert>{error}</Alert>}
      {loading ? (
        <Spinner />
      ) : data.results.length === 0 ? (
        <EmptyState title="No bills found." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'id', header: 'Bill', render: (row) => `#${row.id}` },
              { key: 'patient', header: 'Patient', render: (row) => patientName(row.patient_detail) },
              { key: 'amount', header: 'Amount', render: (row) => formatMoney(row.amount) },
              {
                key: 'paid',
                header: 'Status',
                render: (row) => <Badge tone={row.paid ? 'paid' : 'unpaid'}>{row.paid ? 'Paid' : 'Unpaid'}</Badge>,
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
            rows={data.results}
          />
          <Pagination page={page} count={data.count} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
