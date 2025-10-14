'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, where, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, FileText, AlertTriangle, ShieldQuestion, PencilRuler, History, IndianRupee } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const TestCard = ({ test, testId, isEnrolled, onFreeEnroll }: { test: any, testId: string, isEnrolled: boolean, onFreeEnroll: (id: string, title: string) => void }) => {
    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
                <CardTitle className="text-xl">{test.title}</CardTitle>
                <CardDescription>{test.subject}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="flex items-center font-bold text-lg mt-4">
                    {test.isFree ? 'Free' : (
                        <>
                            <IndianRupee className="h-5 w-5 mr-1" />
                            {test.price ? test.price.toLocaleString() : 'N/A'}
                        </>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                {isEnrolled ? (
                     <Button asChild className="w-full" variant="secondary">
                        <Link href={`/dashboard/test-series/${testId}`}>Start Test</Link>
                    </Button>
                ) : test.isFree ? (
                     <Button className="w-full" onClick={() => onFreeEnroll(testId, test.title)}>Enroll for Free</Button>
                ) : (
                    <Button asChild className="w-full">
                        <Link href={`/dashboard/payment-verification?testSeriesId=${testId}`}>Buy Now</Link>
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};


function TestHubContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get('tab') || 'ai';
  const { toast } = useToast();

  const [testSeriesCollection, testSeriesLoading] = useCollection(
      query(collection(firestore, 'testSeries'), orderBy('createdAt', 'desc'))
  );

  const enrollmentsQuery = user 
    ? query(
        collection(firestore, 'enrollments'), 
        where('userId', '==', user.uid),
        where('status', '==', 'approved')
      )
    : null;
  const [enrollments] = useCollection(enrollmentsQuery);

  const enrolledTestIds = new Set(enrollments?.docs.filter(doc => doc.data().enrollmentType === 'Test Series').map(doc => doc.data().courseId));


  const onTabChange = (value: string) => {
    router.push(`/dashboard/tests?tab=${value}`);
  };
  
  const handleFreeEnroll = async (testId: string, testTitle: string) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Logged In', description: 'You must be logged in to enroll.' });
        return;
    }
    try {
        await addDoc(collection(firestore, 'enrollments'), {
            enrollmentType: 'Test Series',
            courseId: testId,
            courseTitle: testTitle,
            screenshotDataUrl: 'FREE_TEST',
            userId: user.uid,
            userEmail: user.email,
            userDisplayName: user.displayName,
            status: 'approved',
            createdAt: serverTimestamp(),
        });
        toast({ title: 'Enrolled Successfully!', description: `You can now access ${testTitle}.` });
        router.push(`/dashboard/test-series/${testId}`);
    } catch (error) {
        toast({ variant: 'destructive', title: 'Enrollment Failed', description: 'Could not enroll in the test series.' });
    }
};

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">Test Hub</h1>
        <p className="text-muted-foreground mt-2">Your central place for all tests and quizzes.</p>
      </div>

      <Tabs defaultValue={initialTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
          <TabsTrigger value="ai"><ShieldQuestion className="mr-2"/>AI Tests</TabsTrigger>
          <TabsTrigger value="series"><PencilRuler className="mr-2"/>Practice Series</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-2"/>My Tests</TabsTrigger>
        </TabsList>
        <TabsContent value="ai" className="mt-6">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>AI Generated Tests</CardTitle>
                    <CardDescription>Create custom tests on any subject.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">Click the button below to go to our AI Test Generator and create unlimited practice tests tailored to your needs.</p>
                    <Button asChild>
                        <Link href="/dashboard/ai-test">Go to AI Test Generator</Link>
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="series" className="mt-6">
            {testSeriesLoading ? (
                <p>Loading test series...</p>
            ) : testSeriesCollection && !testSeriesCollection.empty ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testSeriesCollection.docs.map(doc => {
                        const isEnrolled = enrolledTestIds.has(doc.id);
                        return (
                            <TestCard key={doc.id} test={doc.data()} testId={doc.id} isEnrolled={isEnrolled} onFreeEnroll={handleFreeEnroll} />
                        )
                    })}
                </div>
            ) : (
                <div className="text-center p-8 text-muted-foreground">
                    <FileText className="mx-auto h-12 w-12" />
                    <p className="mt-4">No practice test series available yet.</p>
                </div>
            )}
        </TabsContent>
        <TabsContent value="history" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Previous Tests</CardTitle>
                    <CardDescription>Review your past performance.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center p-8 text-muted-foreground">
                        <History className="mx-auto h-12 w-12" />
                        <p className="mt-4">You have not taken any tests yet.</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function TestHubPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
            <TestHubContent />
        </Suspense>
    )
}
