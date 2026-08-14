import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { departmentsApi } from '../../api/departments'
import { fetchAllPages } from '../../api/client'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { IconAction, IconActions } from '../../components/ui/IconAction'
import { Table, Pagination } from '../../components/ui/Table'
import { Alert, EmptyState, Spinner } from '../../components/ui/Feedback'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../context/ToastContext'
import { PAGE_SIZE } from '../../utils/constants'
import { getApiError } from '../../utils/errors'

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
]

export function DepartmentListPage() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [sort, setSort] = useState('name_asc')
  const [data, setData] = useState({ results: [], count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function load(nextPage = page, nextSearch = appliedSearch) {
    setLoading(true)
    setError('')
    try {
      const query = nextSearch.trim().toLowerCase()
      if (query) {
        const all = await fetchAllPages(departmentsApi.list)
        const matched = all.filter((item) => {
          const name = String(item.name || '').toLowerCase()
          const description = String(item.description || '').toLowerCase()
          return name.includes(query) || description.includes(query)
        })
        const start = (nextPage - 1) * PAGE_SIZE
        setData({
          results: matched.slice(start, start + PAGE_SIZE),
          count: matched.length,
        })
      } else {
        setData(await departmentsApi.list({ page: nextPage }))
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

  const sortedRows = useMemo(() => {
    const rows = [...data.results]
    rows.sort((a, b) => {
      if (sort === 'name_desc') return String(b.name || '').localeCompare(String(a.name || ''))
      return String(a.name || '').localeCompare(String(b.name || ''))
    })
    return rows
  }, [data.results, sort])

  return (
    <div>
      <PageHeader
        title="Departments"
        breadcrumb={[{ label: 'Departments' }]}
        description="Search uses department name and description."
        actions={
          <Link to="/departments/new">
            <Button>
              <Icon name="plus" className="h-4 w-4" />
              Add department
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
            placeholder="Search departments by name or description..."
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
            <Icon name="building" className="h-4 w-4 text-teal-700" />
            {data.count} {data.count === 1 ? 'department' : 'departments'} found
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
          <EmptyState
            title="No departments found."
            description="Create a department before adding doctors."
            className="border-0 shadow-none"
            action={
              <Link to="/departments/new">
                <Button>
                  <Icon name="plus" className="h-4 w-4" />
                  Add department
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
                  render: (row) => (
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                        <Icon name="building" className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-slate-800">{row.name}</span>
                    </div>
                  ),
                },
                { key: 'description', header: 'Description' },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (row) => (
                    <IconActions>
                      <IconAction to={`/departments/${row.id}/edit`} icon="pencil" label="Edit" />
                      <IconAction
                        icon="trash"
                        label="Delete"
                        tone="rose"
                        onClick={() => setPendingDelete(row)}
                      />
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
              itemLabel={data.count === 1 ? 'department' : 'departments'}
              onPageChange={setPage}
            />
          </>
        )}
      </section>

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
