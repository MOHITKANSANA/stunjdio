
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { Award, Shield, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const WhyUsPageContent = () => (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-primary">Why Choose Learn with Munedra?</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            We are dedicated to providing the best learning experience with a focus on results, innovation, and student success.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                 <Award className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Expert-Led Courses</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Learn from the best educators in the industry who bring real-world experience and deep subject matter expertise to every lesson.
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                 <Shield className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">AI-Powered Testing</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Our advanced AI generates unlimited, personalized practice tests to help you identify strengths and weaknesses, ensuring you're always prepared.
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-2xl transition-shadow duration-300">
            <CardHeader className="items-center text-center">
               <div className="p-4 bg-primary/10 rounded-full mb-4">
                 <Target className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Personalized Learning</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              We don't believe in one-size-fits-all. Our platform analyzes your performance to create a unique learning path tailored just for you.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
);


export default async function CustomHtmlPage({ params }: PageProps) {
  const { slug } = params;

  if (slug === 'why-us') {
    return <WhyUsPageContent />;
  }


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
