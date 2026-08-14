import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { doctorsApi } from '../../api/doctors'
import { patientsApi } from '../../api/patients'
import { appointmentsApi } from '../../api/appointments'
import { billsApi } from '../../api/bills'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, Alert, Spinner } from '../../components/ui/Feedback'
import { Button } from '../../components/ui/Button'
import { Icon } from '../../components/ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { getApiError } from '../../utils/errors'
import { fullName } from '../../utils/format'
import { ROLE_LABELS } from '../../utils/constants'

function StatCard({ label, value, to, icon }) {
  const content = (
    <Card className="p-5 transition hover:border-teal-200">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Icon name={icon} className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </Card>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

export function DashboardPage() {
  const { user, patientProfile } = useAuth()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [doctors, patients, pending, completed, unpaid] = await Promise.all([
          doctorsApi.list({ page: 1 }),
          patientsApi.list({ page: 1 }),
          appointmentsApi.list({ page: 1, status: 'pending' }),
          appointmentsApi.list({ page: 1, status: 'completed' }),
          billsApi.list({ page: 1, paid: false }),
        ])
        if (!cancelled) {
          setStats({
            doctors: doctors.count ?? 0,
            patients: patients.count ?? 0,
            pending: pending.count ?? 0,
            completed: completed.count ?? 0,
            unpaid: unpaid.count ?? 0,
          })
        }
      } catch (err) {
        if (!cancelled) setError(getApiError(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div>
      <PageHeader
        title={`Welcome, ${fullName(user)}`}
        breadcrumb={[{ label: 'Dashboard' }]}
        description={`${ROLE_LABELS[user.role]} workspace. Counts come from existing API list endpoints.`}
      />

      {user.role === 'patient' && !patientProfile && (
        <Alert type="error">
          Your medical profile is incomplete. Complete it before booking appointments.{' '}
          <Link to="/profile" className="font-medium underline">
            Complete profile
          </Link>
        </Alert>
      )}

      {error && <div className="mb-4"><Alert>{error}</Alert></div>}
      {loading ? (
        <Spinner />
      ) : (
        stats && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard icon="stethoscope" label="Doctors" value={stats.doctors} to="/doctors" />
            {(user.role === 'admin' || user.role === 'receptionist' || user.role === 'doctor') && (
              <StatCard icon="users" label="Patients" value={stats.patients} to="/patients" />
            )}
            <StatCard
              icon="clock"
              label={user.role === 'patient' || user.role === 'doctor' ? 'My pending appointments' : 'Pending appointments'}
              value={stats.pending}
              to="/appointments"
            />
            <StatCard
              icon="check"
              label={user.role === 'patient' || user.role === 'doctor' ? 'My completed appointments' : 'Completed appointments'}
              value={stats.completed}
              to="/appointments"
            />
            {(user.role === 'admin' || user.role === 'receptionist' || user.role === 'patient') && (
              <StatCard
                icon="receipt"
                label={user.role === 'patient' ? 'My unpaid bills' : 'Unpaid bills'}
                value={stats.unpaid}
                to="/bills"
              />
            )}
          </div>
        )
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(user.role === 'patient' || user.role === 'admin' || user.role === 'receptionist') && (
              <Link to="/appointments/new">
                <Button>
                  <Icon name="calendar" className="h-4 w-4" />
                  Book appointment
                </Button>
              </Link>
            )}
            {(user.role === 'admin' || user.role === 'receptionist') && (
              <>
                <Link to="/patients/new">
                  <Button variant="secondary">
                    <Icon name="users" className="h-4 w-4" />
                    Add patient
                  </Button>
                </Link>
                <Link to="/doctors/new">
                  <Button variant="secondary">
                    <Icon name="stethoscope" className="h-4 w-4" />
                    Add doctor
                  </Button>
                </Link>
              </>
            )}
            {user.role === 'admin' && (
              <Link to="/receptionists/new">
                <Button variant="secondary">
                  <Icon name="reception" className="h-4 w-4" />
                  Add receptionist
                </Button>
              </Link>
            )}
            {(user.role === 'doctor' || user.role === 'admin') && (
              <Link to="/prescriptions/new">
                <Button variant="secondary">
                  <Icon name="file" className="h-4 w-4" />
                  New prescription
                </Button>
              </Link>
            )}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold text-slate-900">How counts are calculated</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            This dashboard does not invent statistics. Each card uses the <code>count</code> field
            from the corresponding paginated API list, including status and payment filters where the backend supports them.
            Doctor and patient roles automatically see their own appointment totals because the API scopes those querysets.
          </p>
        </Card>
      </div>
    </div>
  )
}
