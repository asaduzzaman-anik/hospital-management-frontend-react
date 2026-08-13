import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Feedback'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-md p-8 text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-slate-500">The page you requested does not exist.</p>
        <Link to="/dashboard" className="mt-5 inline-block">
          <Button>Go to dashboard</Button>
        </Link>
      </Card>
    </div>
  )
}
