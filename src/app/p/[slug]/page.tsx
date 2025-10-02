
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  try {
    const pagesSnapshot = await getDocs(collection(firestore, 'htmlPages'));
    return pagesSnapshot.docs.map((doc) => ({
      slug: doc.id,
    }));
  } catch (error) {
    console.error("Could not generate static params for HTML pages:", error);
    return [];
  }
}

export default async function CustomHtmlPage({ params }: PageProps) {
  const { slug } = params;

  try {
    const pageDoc = await getDoc(doc(firestore, 'htmlPages', slug));

    if (!pageDoc.exists()) {
      notFound();
    }

    const pageData = pageDoc.data();
    const htmlContent = pageData.content;

    // This is a simple way to render the HTML. For security, especially if user-input
    // is ever allowed, this should be sanitized.
    return (
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    );
  } catch (error) {
    console.error(`Error fetching page ${slug}:`, error);
    notFound();
  }
}

    