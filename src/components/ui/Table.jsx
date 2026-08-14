import { Icon } from './Icon'
import { Button } from './Button'
import { PAGE_SIZE } from '../../utils/constants'
import { pageCount as getPageCount } from '../../utils/format'

export function Table({ columns, rows, rowKey = 'id', framed = true }) {
  return (
    <div className={framed ? 'overflow-x-auto rounded-2xl border border-slate-200 bg-white' : 'overflow-x-auto'}>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]} className="border-t border-slate-100 hover:bg-slate-50/80">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 align-middle text-slate-700">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({
  page,
  count,
  onPageChange,
  pageSize = PAGE_SIZE,
  itemLabel = 'records',
  numbered = false,
}) {
  const totalPages = getPageCount(count, pageSize)
  if (!count) return null
  if (!numbered && totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, count)

  if (numbered) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
        <p className="text-sm text-slate-500">
          Showing {from} to {to} of {count} {itemLabel}.
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            aria-label="Previous page"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => onPageChange(page - 1)}
          >
            <Icon name="chevronLeft" className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              aria-current={pageNumber === page ? 'page' : undefined}
              className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition ${
                pageNumber === page
                  ? 'bg-teal-700 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            disabled={page >= totalPages}
            aria-label="Next page"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => onPageChange(page + 1)}
          >
            <Icon name="chevronRight" className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-sm text-slate-500">
        Showing page {page} of {totalPages} · {count} records
      </p>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icon name="chevronLeft" className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <Icon name="chevronRight" className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
