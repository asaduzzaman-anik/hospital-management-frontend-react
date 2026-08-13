import { Link } from 'react-router-dom'

export function PageHeader({ title, breadcrumb, actions, description }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {breadcrumb && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-teal-700">
            {breadcrumb.map((item, index) => (
              <span key={item.label}>
                {item.to ? (
                  <Link to={item.to} className="hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  item.label
                )}
                {index < breadcrumb.length - 1 && <span className="mx-1.5 text-slate-400">/</span>}
              </span>
            ))}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
