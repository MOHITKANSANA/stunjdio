
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { EnrollmentForm } from '@/components/enrollment-form';

async function getCourseData(courseId: string): Promise<{ id: string; data: DocumentData } | null> {
    const courseRef = doc(firestore, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
        return null;
    }
    return { id: courseSnap.id, data: courseSnap.data() };
}


// This is a Server Component. It fetches the initial, non-real-time data.
export default async function CourseEnrollPage({ params }: { params: { courseId: string } }) {
  const courseId = params.courseId;

  if (!courseId) {
    notFound();
  }

  const courseDetails = await getCourseData(courseId);

  if (!courseDetails) {
    notFound();
  }
  
  // Pass the static data and courseId to the Client Component.
  return <EnrollmentForm courseId={courseId} course={courseDetails.data} />;
}
