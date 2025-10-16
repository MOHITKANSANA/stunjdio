
'use client';

import { useState, Suspense, useEffect } from 'react';
import { doc, DocumentData } from 'firebase/firestore';
import { useDocument, useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { firestore } from '@/lib/firebase';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { IndianRupee, BookOpen, Clock, Users, Video, PlayCircle, FileText, StickyNote, ShieldQuestion, Bot, ThumbsUp, ThumbsDown, MessageSquare, CalendarDays, Send, HelpCircle, Download, CheckCircle, MessageCircle as WhatsAppIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, orderBy, getDocs, limit, onSnapshot, addDoc, serverTimestamp, arrayUnion, updateDoc, arrayRemove, deleteDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AiTestGenerator } from '@/app/dashboard/ai-test/page';
import { addDoubtReplyAction } from '@/app/actions/doubts';
import type { GenerateAiTestOutput } from '@/ai/flows/generate-ai-test';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateAiTutorResponse } from '@/ai/flows/generate-ai-tutor-response';

const ContentIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'video': return <Video className="h-5 w-5 text-primary"/>;
        case 'pdf': return <FileText className="h-5 w-5 text-primary"/>;
        case 'note': return <StickyNote className="h-5 w-5 text-primary"/>;
        case 'test_series': return <FileText className="h-5 w-5 text-primary" />;
        case 'ai_test': return <ShieldQuestion className="h-5 w-5 text-primary" />;
        default: return <BookOpen className="h-5 w-5 text-primary"/>;
    }
}


const ContentTab = ({ courseId }: { courseId: string }) => {
    const [courseContentCollection, courseContentLoading, courseContentError] = useCollection(
        query(collection(firestore, 'courses', courseId, 'content'))
    );

    const sortedContent = courseContentCollection?.docs
        .filter(doc => ['pdf', 'note'].includes(doc.data().type))
        .sort((a, b) => {
            const dateA = a.data().createdAt?.toDate() || 0;
            const dateB = b.data().createdAt?.toDate() || 0;
            if (dateA < dateB) return -1; if (dateA > dateB) return 1; return 0;
        });

    const handleContentClick = (content: any) => {
        window.open(content.url, '_blank');
    };

    return (
        <CardContent>
          {courseContentError && <p className="text-destructive">Could not load course content: {courseContentError.message}</p>}
          {courseContentLoading && <Skeleton className="w-full h-24" />}
          {sortedContent && sortedContent.length > 0 ? (
            <div className="space-y-4">
              {sortedContent.map(doc => {
                const content = doc.data();
                return (
                  <div key={doc.id} onClick={() => handleContentClick(content)} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 cursor-pointer hover:bg-muted transition-colors active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                       <ContentIcon type={content.type} />
                       <p className="font-semibold">{content.title}</p>
                    </div>
                     <Button variant="ghost" size="icon">
                        <PlayCircle className="h-6 w-6" />
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : !courseContentLoading && (
            <p className="text-muted-foreground text-center py-8">No PDF or note content has been added to this course yet.</p>
          )}
        </CardContent>
    )
}


const VideoLecturesTab = ({ courseId }: { courseId: string; }) => {
    const router = useRouter();
    const [videosCollection, loading, error] = useCollection(
        query(collection(firestore, 'courses', courseId, 'content'))
    );

    const sortedVideos = videosCollection?.docs
        .filter(doc => doc.data().type === 'video')
        .sort((a, b) => {
            const dateA = a.data().createdAt?.toDate() || 0;
            const dateB = b.data().createdAt?.toDate() || 0;
            if (dateA < dateB) return -1; if (dateA > dateB) return 1; return 0;
        });
        
    const handleVideoClick = (contentId: string) => {
        router.push(`/dashboard/courses/${courseId}/video/${contentId}`);
    }

    return (
        <CardContent>
            {error && <p className="text-destructive">Could not load videos: {error.message}</p>}
            {loading && <Skeleton className="w-full h-24" />}
            {sortedVideos && sortedVideos.length > 0 ? (
                <div className="space-y-4">
                    {sortedVideos.map(doc => {
                        const content = { id: doc.id, ...doc.data() };
                        return (
                            <div key={doc.id} className={cn("flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors active:scale-[0.98]", 'bg-muted/50 hover:bg-muted')} onClick={() => handleVideoClick(content.id)}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <ContentIcon type={content.type} />
                                    <p className="font-semibold break-words">{content.title}</p>
                                </div>
                                <Button variant="ghost" size="icon" className="shrink-0">
                                    <PlayCircle className="h-6 w-6" />
                                </Button>
                            </div>
                        )
                    })}
                </div>
            ) : !loading && (
                <div className="text-center py-8">
                    <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4">No video lectures have been added yet.</p>
                </div>
            )}
        </CardContent>
    );
};

const TestsTab = ({ course, courseId, aiFeaturesEnabled }: { course: DocumentData, courseId: string, aiFeaturesEnabled: boolean }) => {
    const [testsCollection, loading, error] = useCollection(
        query(collection(firestore, 'courses', courseId, 'content'))
    );
    const [isAiTestModalOpen, setIsAiTestModalOpen] = useState(false);

    const tests = testsCollection?.docs
        .filter(doc => doc.data().type === 'test_series')
        .sort((a, b) => {
            const dateA = a.data().createdAt?.toDate() || 0;
            const dateB = b.data().createdAt?.toDate() || 0;
            if (dateA < dateB) return -1; if (dateA > dateB) return 1; return 0;
        });
    
    return (
        <CardContent className="space-y-4">
            <Dialog open={isAiTestModalOpen} onOpenChange={setIsAiTestModalOpen}>
                <DialogContent className="max-w-md p-0 bg-transparent border-none">
                     <DialogHeader className="p-4 bg-blue-600 rounded-t-2xl">
                        <DialogTitle className="text-white">AI Test Generator</DialogTitle>
                     </DialogHeader>
                    <AiTestGenerator 
                        onTestGenerated={(testData: GenerateAiTestOutput, formData: any) => { 
                            setIsAiTestModalOpen(false);
                        }} 
                        isCourseContext={true} 
                        subject={course.title} 
                        examType={course.category} 
                    />
                </DialogContent>
            </Dialog>

            <Tabs defaultValue="series">
                <TabsList className={cn("grid w-full", aiFeaturesEnabled ? "grid-cols-2" : "grid-cols-1")}>
                    <TabsTrigger value="series">Test Series</TabsTrigger>
                    {aiFeaturesEnabled && <TabsTrigger value="ai">AI Generated Test</TabsTrigger>}
                </TabsList>
                <TabsContent value="series" className="pt-4">
                    {error && <p className="text-destructive">Could not load test series: {error.message}</p>}
                    {loading && <Skeleton className="w-full h-24" />}
                    {tests && tests.length > 0 ? (
                        <div className="space-y-4">
                            {tests.map(doc => {
                                const content = doc.data();
                                return (
                                    <Link href={`/dashboard/test-series/${content.testSeriesId}`} key={doc.id}>
                                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors active:scale-[0.98]">
                                            <div className="flex items-center gap-3">
                                                <ContentIcon type={content.type} />
                                                <p className="font-semibold">{content.title}</p>
                                            </div>
                                            <Button>Start Test</Button>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    ) : !loading && (
                         <div className="text-center py-8">
                            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4">No official test series added to this course yet.</p>
                        </div>
                    )}
                </TabsContent>
                {aiFeaturesEnabled && 
                    <TabsContent value="ai" className="pt-4">
                         <div 
                            className="p-6 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors active:scale-[0.98]"
                            onClick={() => setIsAiTestModalOpen(true)}
                         >
                            <div className="w-fit mx-auto p-3 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white mb-3">
                                <Bot className="h-8 w-8" />
                            </div>
                            <h3 className="font-bold text-lg">AI Generated Test</h3>
                            <p className="text-muted-foreground text-sm">Create unlimited personalized tests for this course.</p>
                         </div>
                    </TabsContent>
                }
            </Tabs>
        </CardContent>
    );
};

const AIDoubtsTab = ({ course }: { course: DocumentData }) => {
    const [question, setQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAsk = async () => {
        if (!question.trim()) return;
        setIsLoading(true);
        setError(null);
        setResponse(null);
        try {
            const result = await generateAiTutorResponse({
                question: `In the context of the course "${course.title}", ${question}`,
                language: 'English',
            });
            setResponse(result);
        } catch (e: any) {
            setError(e.message || "Failed to get an answer.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <CardContent className="space-y-4">
            <div className="flex gap-2">
                <Input 
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask AI about this course..."
                    disabled={isLoading}
                />
                <Button onClick={handleAsk} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            {response && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
                    <p className="font-semibold">AI Answer:</p>
                    <p className="text-sm whitespace-pre-wrap">{response.answer}</p>
                </div>
            )}
        </CardContent>
    );
};

const ManualDoubtsTab = ({ courseId }: { courseId: string; }) => {
    // This component remains largely the same
    return <CardContent><p className="text-center text-muted-foreground p-4">Manual doubts section is under construction.</p></CardContent>
}


const EnrolledCourseView = ({ course, courseId }: { course: DocumentData, courseId: string }) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(doc(firestore, 'settings', 'appConfig'), (doc) => {
            if (doc.exists()) {
                setSettings(doc.data());
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);
    
    const defaultTab = searchParams.get('tab') || 'videos';

    const onTabChange = (value: string) => {
        router.push(`/dashboard/courses/${courseId}?tab=${value}`, { scroll: false });
    };

    if (loading) {
        return <Skeleton className="h-64 w-full" />
    }

    const aiFeaturesEnabled = settings?.aiFeaturesEnabled === undefined ? true : settings.aiFeaturesEnabled;

    return (
        <div className="w-full">
            <Tabs defaultValue={defaultTab} onValueChange={onTabChange} className="w-full">
                <div className="overflow-x-auto">
                    <TabsList className={cn("grid w-full min-w-[400px]", aiFeaturesEnabled ? "grid-cols-4" : "grid-cols-3")}>
                        <TabsTrigger value="videos">Videos</TabsTrigger>
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="tests">Tests</TabsTrigger>
                        {aiFeaturesEnabled && <TabsTrigger value="doubts">Doubts</TabsTrigger>}
                    </TabsList>
                </div>
                <TabsContent value="videos">
                    <VideoLecturesTab courseId={courseId} />
                </TabsContent>
                <TabsContent value="content">
                    <ContentTab courseId={courseId} />
                </TabsContent>
                <TabsContent value="tests">
                    <TestsTab course={course} courseId={courseId} aiFeaturesEnabled={aiFeaturesEnabled} />
                </TabsContent>
                 {aiFeaturesEnabled && 
                    <TabsContent value="doubts">
                        <Tabs defaultValue="ai" className="w-full">
                             <TabsList className="grid w-full grid-cols-2">
                                 <TabsTrigger value="ai">AI Doubts</TabsTrigger>
                                 <TabsTrigger value="manual">Manual Doubts</TabsTrigger>
                             </TabsList>
                             <TabsContent value="ai" className="pt-4">
                                 <AIDoubtsTab course={course} />
                             </TabsContent>
                             <TabsContent value="manual" className="pt-4">
                                 <ManualDoubtsTab courseId={courseId} />
                             </TabsContent>
                        </Tabs>
                    </TabsContent>
                 }
            </Tabs>
        </div>
    )
}

const EnrollmentStatusChecker = ({ courseId }: { courseId: string }) => {
    const { user } = useAuth();
    const [enrollment, setEnrollment] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(7200); // 2 hours in seconds
    const router = useRouter();

    useEffect(() => {
        if (user) {
            const q = query(
                collection(firestore, 'enrollments'),
                where('userId', '==', user.uid),
                where('courseId', '==', courseId),
                orderBy('createdAt', 'desc'),
                limit(1)
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    setEnrollment({ id: doc.id, ...doc.data() });
                }
            });
            return () => unsubscribe();
        }
    }, [user, courseId]);

    useEffect(() => {
        if (enrollment?.status === 'pending') {
            const createdAt = enrollment.createdAt.toDate();
            const twoHoursLater = new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
            
            const interval = setInterval(() => {
                const now = new Date();
                const remaining = Math.max(0, Math.floor((twoHoursLater.getTime() - now.getTime()) / 1000));
                setTimeLeft(remaining);
                if (remaining === 0) {
                    clearInterval(interval);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [enrollment]);

    if (!enrollment) {
        return (
             <Button asChild size="lg" className="w-full text-lg bg-green-600 hover:bg-green-700 active:bg-green-800 transition-all duration-150 active:scale-95">
                <Link href={`/dashboard/payment-verification?courseId=${courseId}`}>
                    Enroll Now
                </Link>
            </Button>
        );
    }
    
    if (enrollment.status === 'approved') {
         router.refresh(); // Refresh page to show enrolled view
         return <p>Enrollment Approved! Reloading...</p>;
    }

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isHelpActive = timeLeft === 0;

    return (
        <div className="w-full space-y-4">
             <Button size="lg" className="w-full text-lg" disabled>
                {enrollment.status === 'rejected' ? 'Enrollment Rejected' : 'Approval Pending'}
            </Button>
            {enrollment.status === 'pending' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Status: Pending</CardTitle>
                        <CardDescription>Your enrollment request is being reviewed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">If you do not get a response within 2 hours, you can contact support.</p>
                         <div className="text-center font-mono text-xl p-2 bg-muted rounded-md">
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                    </CardContent>
                     <CardFooter>
                         <Button className="w-full" disabled={!isHelpActive} asChild>
                            <a href={`https://wa.me/9327175729?text=Hello, my enrollment for course ID ${courseId} is still pending.`} target="_blank">
                                <WhatsAppIcon className="mr-2" />
                                WhatsApp Help
                            </a>
                        </Button>
                     </CardFooter>
                </Card>
            )}
             {enrollment.status === 'rejected' && (
                 <p className="text-sm text-center text-destructive">Your enrollment was rejected. Please contact support or try enrolling again with correct details.</p>
             )}
        </div>
    )
}


function CourseDetailPageContent() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams() as { courseId: string };
  const courseId = params.courseId;
  
  const [courseDoc, courseLoading, courseError] = useDocument(doc(firestore, 'courses', courseId));

  const enrollmentsQuery = user 
    ? query(
        collection(firestore, 'enrollments'), 
        where('userId', '==', user.uid), 
        where('courseId', '==', courseId),
        where('status', '==', 'approved'),
        limit(1)
      )
    : null;
    
  const [enrollmentDocs, enrollmentLoading] = useCollection(enrollmentsQuery);

  const isEnrolled = !!enrollmentDocs && !enrollmentDocs.empty;
  
  if (courseLoading || authLoading || enrollmentLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (courseError) {
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
            <h1 className="text-2xl font-bold text-destructive">Error Loading Course</h1>
            <p>Could not load course details: {courseError.message}</p>
        </div>
    )
  }
  
  if (!courseDoc?.exists()) {
    notFound();
  }

  const course = courseDoc.data();
  const isFreeCourse = course.isFree === true;

  if (isEnrolled || isFreeCourse) {
      return (
        <div className="max-w-4xl mx-auto">
            <EnrolledCourseView course={course} courseId={courseId} />
        </div>
      )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          <div>
            <p className="text-primary font-semibold mb-1">{course.category}</p>
            <h1 className="text-4xl font-bold font-headline">{course.title}</h1>
          </div>
          
            <div className="relative h-80 w-full rounded-lg overflow-hidden shadow-lg">
                <Image src={course.imageUrl || `https://picsum.photos/seed/${courseId}/800/600`} alt={course.title} fill style={{objectFit:"cover"}} data-ai-hint="online learning" />
            </div>
            <Card>
                <CardHeader>
                <CardTitle>About this course</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{course.description}</p>
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="sticky top-8 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center">
                <IndianRupee className="h-7 w-7 mr-1" />
                {course.price ? course.price.toLocaleString() : 'N/A'}
              </CardTitle>
              <CardDescription>One-time payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <EnrollmentStatusChecker courseId={courseId} />
                 <div className="space-y-3 pt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-primary" /><span>Full course access</span></div>
                    <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /><span>Lifetime access</span></div>
                    <div className="flex items-center gap-3"><CalendarDays className="h-5 w-5 text-primary" /><span>{course.validity || 'Unlimited'} days validity</span></div>
                    <div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" /><span>Community access</span></div>
                 </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


export default function CourseDetailPage() {
    return (
        <Suspense fallback={<div className="p-4 md:p-8"><Skeleton className="h-screen w-full" /></div>}>
            <CourseDetailPageContent />
        </Suspense>
    )
}
