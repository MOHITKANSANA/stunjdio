

'use client';

import { useState, Suspense, useEffect } from 'react';
import { doc, DocumentData } from 'firebase/firestore';
import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
import { firestore } from '@/lib/firebase';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { IndianRupee, BookOpen, Clock, Users, Video, PlayCircle, FileText, StickyNote, ShieldQuestion, Bot, ThumbsUp, ThumbsDown, MessageSquare, CalendarDays, Send, HelpCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, orderBy, getDocs, limit, onSnapshot, addDoc, serverTimestamp, arrayUnion, updateDoc, arrayRemove } from 'firebase/firestore';
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

const PDFViewer = ({ pdfUrl, title, onOpenChange }: { pdfUrl: string, title: string, onOpenChange: (open: boolean) => void }) => {
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        const saveToDownloads = async () => {
            if (!user) return;
            try {
                // Check if it already exists
                const q = query(
                    collection(firestore, 'userDownloads'),
                    where('userId', '==', user.uid),
                    where('url', '==', pdfUrl)
                );
                const existing = await getDocs(q);
                if (existing.empty) {
                     await addDoc(collection(firestore, 'userDownloads'), {
                        userId: user.uid,
                        title: title,
                        url: pdfUrl,
                        type: 'PDF',
                        savedAt: serverTimestamp()
                    });
                }
            } catch (e) {
                console.error("Failed to save to downloads:", e);
                toast({ variant: 'destructive', description: "Failed to save PDF to your downloads." });
            }
        };

        saveToDownloads();
    }, [pdfUrl, title, user, toast]);

    const getZohoVideoEmbedUrl = (url: string): string | null => {
        if (!url) return null;
        try {
            // Handle Zoho Show Public links
            const zohoPublicRegex = /show\.zohopublic\.(in|com)\/publish\/([a-zA-Z0-9_-]+)/;
            const publicMatch = url.match(zohoPublicRegex);
            if (publicMatch && publicMatch[2]) {
                return `https://show.zohopublic.in/publish/${publicMatch[2]}?viewtype=embed`;
            }
    
            // Handle Zoho Workdrive file links
            const zohoWorkdriveRegex = /workdrive\.zoho\.(in|com)\/file\/([a-zA-Z0-9_-]+)/;
            const workdriveMatch = url.match(zohoWorkdriveRegex);
            if (workdriveMatch && workdriveMatch[2]) {
                // The URL for embedding workdrive videos is different
                return `https://workdrive.zoho.in/embed/${workdriveMatch[2]}`;
            }
        } catch(e) {
            console.error("Error parsing Zoho URL", e);
        }
        return null;
    };
    
    let effectiveUrl = pdfUrl;
    if(pdfUrl.includes('zoho')) {
        effectiveUrl = getZohoVideoEmbedUrl(pdfUrl) || `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
    } else {
        effectiveUrl = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
    }

    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] p-4 flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow">
                    <iframe
                        src={effectiveUrl}
                        width="100%"
                        height="100%"
                        className="rounded-lg border"
                        title={title}
                        allow="fullscreen"
                    ></iframe>
                </div>
            </DialogContent>
        </Dialog>
    );
};

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
    const [isPdfOpen, setIsPdfOpen] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState<{ url: string, title: string } | null>(null);

    const sortedContent = courseContentCollection?.docs
        .filter(doc => ['pdf', 'note'].includes(doc.data().type))
        .sort((a, b) => {
            const dateA = a.data().createdAt?.toDate() || 0;
            const dateB = b.data().createdAt?.toDate() || 0;
            if (dateA < dateB) return -1; if (dateA > dateB) return 1; return 0;
        });

    const handleContentClick = (content: any) => {
        setSelectedPdf({ url: content.url, title: content.title });
        setIsPdfOpen(true);
    };

    return (
        <>
            {isPdfOpen && selectedPdf && (
                 <PDFViewer 
                    pdfUrl={selectedPdf.url}
                    title={selectedPdf.title}
                    onOpenChange={(isOpen) => !isOpen && setIsPdfOpen(false)}
                />
            )}
            <CardContent>
              {courseContentError && <p className="text-destructive">Could not load course content: {courseContentError.message}</p>}
              {courseContentLoading && <Skeleton className="w-full h-24" />}
              {sortedContent && sortedContent.length > 0 ? (
                <div className="space-y-4">
                  {sortedContent.map(doc => {
                    const content = doc.data();
                    return (
                      <div key={doc.id} onClick={() => handleContentClick(content)} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
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
        </>
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
                            <div key={doc.id} className={cn("flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors", 'bg-muted/50 hover:bg-muted')} onClick={() => handleVideoClick(content.id)}>
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

const TestsTab = ({ course, courseId }: { course: DocumentData, courseId: string }) => {
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
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="series">Test Series</TabsTrigger>
                    <TabsTrigger value="ai">AI Generated Test</TabsTrigger>
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
                                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors">
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
                <TabsContent value="ai" className="pt-4">
                     <div 
                        className="p-6 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                        onClick={() => setIsAiTestModalOpen(true)}
                     >
                        <div className="w-fit mx-auto p-3 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white mb-3">
                            <Bot className="h-8 w-8" />
                        </div>
                        <h3 className="font-bold text-lg">AI Generated Test</h3>
                        <p className="text-muted-foreground text-sm">Create unlimited personalized tests for this course.</p>
                     </div>
                </TabsContent>
            </Tabs>
        </CardContent>
    );
};



const EnrolledCourseView = ({ course, courseId }: { course: DocumentData, courseId: string }) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const defaultTab = searchParams.get('tab') || 'videos';

    const onTabChange = (value: string) => {
        router.push(`/dashboard/courses/${courseId}?tab=${value}`, { scroll: false });
    };

    return (
        <div className="w-full">
            <Tabs defaultValue={defaultTab} onValueChange={onTabChange} className="w-full">
                <div className="overflow-x-auto">
                    <TabsList className="grid w-full grid-cols-3 min-w-[300px]">
                        <TabsTrigger value="videos">Videos</TabsTrigger>
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="tests">Tests</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="videos">
                    <VideoLecturesTab courseId={courseId} />
                </TabsContent>
                <TabsContent value="content">
                    <ContentTab courseId={courseId} />
                </TabsContent>
                <TabsContent value="tests">
                    <TestsTab course={course} courseId={courseId} />
                </TabsContent>
            </Tabs>
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
        where('status', '==', 'approved')
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
                <Button asChild size="lg" className="w-full text-lg">
                   <Link href={`/dashboard/payment-verification?courseId=${courseId}`}>
                        Enroll Now
                   </Link>
                </Button>
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
