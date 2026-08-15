import { Link } from 'react-router-dom'

export function AuthLayout({ title, subtitle, children, footer, credit }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-teal-900 lg:flex lg:flex-col lg:justify-between p-12 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_42%)]" />
          <Link to="/" className="relative flex items-center gap-3 text-lg font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">+</span>
            MediCare HMS
          </Link>
          <div className="relative max-w-md space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-teal-100">Hospital Management</p>
            <h2 className="text-4xl font-semibold leading-tight">Care coordination in one secure workspace.</h2>
            <p className="text-teal-100">
              Appointments, prescriptions, billing, and patient records — organized by role and backed by the hospital API.
            </p>
          </div>
          <p className="relative text-sm text-teal-200">For authorized hospital staff and registered patients.</p>
        </div>
        <div className="flex min-h-screen flex-col bg-[#f4f7f8]">
          <div className="flex flex-1 items-center justify-center px-4 py-10">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
              </div>
              {children}
              {footer && <div className="mt-6 text-center text-sm text-slate-500">{footer}</div>}
            </div>
          </div>
          {credit && (
            <div className="px-4 py-4 text-center text-xs text-slate-400">
              {credit}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
