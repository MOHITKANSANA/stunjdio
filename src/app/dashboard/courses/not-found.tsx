
import { Button } from '@/components/ui/button'
import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <h2 className="text-4xl font-bold mb-4">Course Not Found</h2>
      <p className="text-muted-foreground mb-6">Could not find the requested course. It might have been moved or deleted.</p>
      <Button asChild>
        <Link href="/dashboard/courses">Return to Courses</Link>
      </Button>
    </div>
  )
}
