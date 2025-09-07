
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { EnrollmentForm } from '@/components/enrollment-form';

// This is now a Server Component. It fetches the initial, non-real-time data.
export default async function CourseEnrollPage({ params }: { params: { courseId: string } }) {
  const courseId = params.courseId;

  if (!courseId) {
    notFound();
  }

  // Fetch the course data once on the server.
  const courseRef = doc(firestore, 'courses', courseId);
  const courseSnap = await getDoc(courseRef);

  if (!courseSnap.exists()) {
    notFound();
  }
  
  const course = courseSnap.data();

  // Pass the static data and courseId to the Client Component.
  return <EnrollmentForm courseId={courseId} course={course} />;
}
