import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Feedback'

export function ForbiddenPage() {
  return (
    <div>
      <PageHeader title="Forbidden" breadcrumb={[{ label: 'Error' }]} />
      <Card className="p-8 text-center">
        <h2 className="text-lg font-semibold">You do not have access to this page</h2>
        <p className="mt-2 text-sm text-slate-500">
          Frontend route protection is for usability. The API remains the real authorization layer.
        </p>
        <Link to="/dashboard" className="mt-5 inline-block">
          <Button>Back to dashboard</Button>
        </Link>
      </Card>
    </div>
  )
}
