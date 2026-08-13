import { Icon } from './Icon'
import { Button } from './Button'
import { PAGE_SIZE } from '../../utils/constants'
import { pageCount as getPageCount } from '../../utils/format'

export function Table({ columns, rows, rowKey = 'id' }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
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

export function Pagination({ page, count, onPageChange, pageSize = PAGE_SIZE }) {
  const totalPages = getPageCount(count, pageSize)
  if (!count || totalPages <= 1) return null

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
