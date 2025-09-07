
'use client';

// This file is no longer in use and can be safely deleted.
// The new enrollment flow uses the /dashboard/payment-verification page.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedEnrollPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const courseId = params.courseId;

  useEffect(() => {
    // Redirect to the new payment verification page, passing the courseId
    if (courseId) {
      router.replace(`/dashboard/payment-verification?courseId=${courseId}`);
    }
  }, [router, courseId]);

  // Render a loading state or null while redirecting
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <p>Redirecting to our new enrollment page...</p>
    </div>
  );
}
