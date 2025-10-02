
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

function JsonViewer({ data }: { data: any }) {
    return (
        <div className="bg-gray-100 dark:bg-gray-900 p-4 md:p-8 min-h-screen">
            <pre className="bg-white dark:bg-black p-6 rounded-lg shadow-lg overflow-x-auto text-sm">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}

export default async function CustomHtmlPage({ params }: PageProps) {
  const { slug } = params;

  try {
    const pageDoc = await getDoc(doc(firestore, 'htmlPages', slug));

    if (!pageDoc.exists()) {
      notFound();
    }

    const pageData = pageDoc.data();
    const contentType = pageData.type || 'html'; // Default to html if type is not set
    const content = pageData.content;

    if (contentType === 'json') {
        let jsonData;
        try {
            jsonData = JSON.parse(content);
        } catch {
            return <div className="p-8 text-red-500">Error: Invalid JSON content.</div>
        }
        return <JsonViewer data={jsonData} />;
    }

    // Default to HTML rendering
    return (
      <div dangerouslySetInnerHTML={{ __html: content }} />
    );
  } catch (error) {
    console.error(`Error fetching page ${slug}:`, error);
    notFound();
  }
}
