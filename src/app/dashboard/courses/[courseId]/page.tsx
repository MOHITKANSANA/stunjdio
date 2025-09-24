
'use client';

import { useState, Suspense } from 'react';
import { doc, DocumentData } from 'firebase/firestore';
import { useDocument, useCollection } from 'react-firebase-hooks/firestore';
import { firestore } from '@/lib/firebase';
import { notFound, useParams, useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { IndianRupee, BookOpen, Clock, Users, Lock, Video, PlayCircle, FileText, StickyNote, Send, HelpCircle, GraduationCap, ShieldQuestion, Bot, Languages, Sigma } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { generateAiTestAction } from '@/app/actions/ai-test';
import type { GenerateAiTestOutput, GenerateAiTestInput } from '@/ai/flows/generate-ai-test';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, AlertTriangle, Award, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import Certificate from '@/components/certificate';
import { Progress } from '@/components/ui/progress';

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

const getYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    let videoId: string | null = null;
    try {
        const patterns = [
            /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                videoId = match[1];
                break;
            }
        }
    } catch (e) {
        console.error("Error parsing YouTube URL", e);
        return null;
    }
    return videoId;
}


const VideoPlayer = ({ videoUrl, title, onOpenChange }: { videoUrl: string, title: string, onOpenChange: (open: boolean) => void }) => {
    const youtubeVideoId = getYoutubeVideoId(videoUrl);

    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl p-4">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="aspect-video">
                    {youtubeVideoId ? (
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1`}
                            title={title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="rounded-lg"
                        ></iframe>
                    ) : (
                        <video controls autoPlay src={videoUrl} className="w-full h-full rounded-lg bg-black">
                            Your browser does not support the video tag.
                        </video>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const CourseContentTab = ({ courseId, onContentClick }: { courseId: string, onContentClick: (content: any) => void }) => {
    const [courseContentCollection, courseContentLoading, courseContentError] = useCollection(
        query(collection(firestore, 'courses', courseId, 'content'), where('type', 'in', ['pdf', 'note']), orderBy('createdAt', 'asc'))
    );
    return (
        <CardContent>
          {courseContentError && <p className="text-destructive">Could not load course content.</p>}
          {courseContentLoading && <Skeleton className="w-full h-24" />}
          {courseContentCollection && courseContentCollection.docs.length > 0 ? (
            <div className="space-y-4">
              {courseContentCollection.docs.map(doc => {
                const content = doc.data();
                return (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                    <div className="flex items-center gap-3">
                       <ContentIcon type={content.type} />
                       <p className="font-semibold">{content.title}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onContentClick(content)}>
                        <PlayCircle className="h-6 w-6" />
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No content has been added to this course yet.</p>
          )}
        </CardContent>
    )
}

const DoubtsTab = ({ courseId }: { courseId: string }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [doubtText, setDoubtText] = useState('');

    const [doubtsCollection, doubtsLoading, doubtsError] = useCollection(
        query(collection(firestore, 'courses', courseId, 'doubts'), orderBy('createdAt', 'desc'))
    );
    
    const handleDoubtSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !doubtText.trim()) return;
        try {
            await addDoc(collection(firestore, 'courses', courseId, 'doubts'), {
                text: doubtText,
                userId: user.uid,
                userName: user.displayName,
                userPhoto: user.photoURL,
                createdAt: serverTimestamp(),
                answer: null,
            });
            setDoubtText('');
            toast({ description: "Your doubt has been submitted." });
        } catch (error) {
            toast({ variant: 'destructive', description: "Could not submit your doubt." });
        }
    };

    return (
        <CardContent className="space-y-6">
            <form onSubmit={handleDoubtSubmit} className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback>{user?.displayName?.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                <Textarea 
                    value={doubtText} 
                    onChange={(e) => setDoubtText(e.target.value)} 
                    placeholder="Ask your doubt here..." 
                />
                <Button type="submit"><Send /></Button>
            </form>

            <div className="space-y-4">
                {doubtsLoading && <Skeleton className="h-20 w-full" />}
                {doubtsError && <p className="text-destructive">Could not load doubts.</p>}
                {doubtsCollection?.docs.map(doc => {
                    const doubt = doc.data();
                    return (
                        <div key={doc.id} className="p-4 border rounded-lg">
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={doubt.userPhoto || undefined} />
                                    <AvatarFallback>{doubt.userName?.charAt(0) || 'A'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-sm">{doubt.userName}</p>
                                    <p>{doubt.text}</p>
                                </div>
                            </div>
                            {doubt.answer && (
                                <div className="mt-3 ml-11 pl-4 border-l">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                                           <AvatarFallback><GraduationCap size={18}/></AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm">Instructor</p>
                                            <p className="text-muted-foreground">{doubt.answer}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
                 {!doubtsLoading && doubtsCollection?.empty && (
                    <p className="text-muted-foreground text-center py-8">No doubts have been asked yet.</p>
                )}
            </div>
        </CardContent>
    );
};

const VideoLecturesTab = ({ courseId, onContentClick }: { courseId: string; onContentClick: (content: any) => void }) => {
    const [videos, loading, error] = useCollection(
        query(collection(firestore, 'courses', courseId, 'content'), where('type', '==', 'video'), orderBy('createdAt', 'asc'))
    );

    return (
        <CardContent>
            {error && <p className="text-destructive">Could not load videos.</p>}
            {loading && <Skeleton className="w-full h-24" />}
            {videos && videos.docs.length > 0 ? (
                <div className="space-y-4">
                    {videos.docs.map(doc => {
                        const content = doc.data();
                        return (
                            <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <ContentIcon type={content.type} />
                                    <p className="font-semibold">{content.title}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => onContentClick(content)}>
                                    <PlayCircle className="h-6 w-6" />
                                </Button>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-8">No video lectures have been added yet.</p>
            )}
        </CardContent>
    );
};

const TestsTab = ({ course, courseId }: { course: DocumentData, courseId: string }) => {
    const [tests, loading, error] = useCollection(
        query(collection(firestore, 'courses', courseId, 'content'), where('type', '==', 'test_series'), orderBy('createdAt', 'asc'))
    );
    const router = useRouter();
    const [isAiTestModalOpen, setIsAiTestModalOpen] = useState(false);

    return (
        <CardContent className="space-y-4">
            <Dialog open={isAiTestModalOpen} onOpenChange={setIsAiTestModalOpen}>
                <DialogContent className="max-w-2xl">
                    <AiTestGenerator onTestGenerated={() => {}} subject={course.title} examType={course.category} />
                </DialogContent>
            </Dialog>

            <Tabs defaultValue="series">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="series">Test Series</TabsTrigger>
                    <TabsTrigger value="ai">AI Generated Test</TabsTrigger>
                </TabsList>
                <TabsContent value="series" className="pt-4">
                    {error && <p className="text-destructive">Could not load test series.</p>}
                    {loading && <Skeleton className="w-full h-24" />}
                    {tests && tests.docs.length > 0 ? (
                        <div className="space-y-4">
                            {tests.docs.map(doc => {
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
                    ) : (
                         <p className="text-muted-foreground text-center py-8">No official test series added to this course yet.</p>
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
                        <p className="text-muted-foreground text-sm">Create a personalized test based on this course.</p>
                     </div>
                </TabsContent>
            </Tabs>
        </CardContent>
    );
};


const CourseTabs = ({ courseId, course, onContentClick }: { courseId: string; course: DocumentData, onContentClick: (content: any) => void }) => {
    return (
        <div className="col-span-1 md:col-span-5">
            <Tabs defaultValue="videos">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="videos">Video Lectures</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="tests">Tests</TabsTrigger>
                    <TabsTrigger value="doubts">Your Doubts</TabsTrigger>
                </TabsList>
                <TabsContent value="videos">
                     <VideoLecturesTab courseId={courseId} onContentClick={onContentClick} />
                </TabsContent>
                <TabsContent value="content">
                    <CourseContentTab courseId={courseId} onContentClick={onContentClick}/>
                </TabsContent>
                <TabsContent value="tests">
                    <TestsTab course={course} courseId={courseId} />
                </TabsContent>
                <TabsContent value="doubts">
                    <DoubtsTab courseId={courseId} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function CourseDetailPageContent() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();

  const [selectedVideo, setSelectedVideo] = useState<{ url: string, title: string } | null>(null);
  
  const [courseDoc, courseLoading, courseError] = useDocument(doc(firestore, 'courses', courseId));

  const enrollmentsQuery = user 
    ? query(
        collection(firestore, 'enrollments'), 
        where('userId', '==', user.uid), 
        where('courseId', '==', courseId), 
        where('status', '==', 'approved')
      )
    : null;
    
  const [enrollmentDocs, enrollmentLoading, enrollmentError] = useCollection(enrollmentsQuery);

  const isEnrolled = !!enrollmentDocs && !enrollmentDocs.empty;

  const handleContentClick = (content: { type: string, url: string, title: string }) => {
    if (content.type === 'video') {
        setSelectedVideo({ url: content.url, title: content.title });
    } else {
        window.open(content.url, '_blank', 'noopener,noreferrer');
    }
  };


  if (courseLoading || authLoading || enrollmentLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
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

  if (courseError || !courseDoc?.exists()) {
    notFound();
  }

  const course = courseDoc.data();
  const isFreeCourse = course.isFree === true;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
       {selectedVideo && (
            <VideoPlayer 
                videoUrl={selectedVideo.url}
                title={selectedVideo.title}
                onOpenChange={(isOpen) => !isOpen && setSelectedVideo(null)}
            />
        )}
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-6">
          <div>
            <p className="text-primary font-semibold mb-1">{course.category}</p>
            <h1 className="text-4xl font-bold font-headline">{course.title}</h1>
          </div>
          
            {!isEnrolled && (
            <>
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
            </>
            )}
        </div>

        <div className="md:col-span-2">
          <Card className="sticky top-8 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center">
                {isFreeCourse ? 'Free' : (
                    <>
                        <IndianRupee className="h-7 w-7 mr-1" />
                        {course.price ? course.price.toLocaleString() : 'N/A'}
                    </>
                )}
              </CardTitle>
              <CardDescription>{isFreeCourse ? 'Enroll for free' : 'One-time payment'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEnrolled ? (
                <Button size="lg" className="w-full text-lg" disabled>Enrolled</Button>
              ) : (
                <Button asChild size="lg" className="w-full text-lg">
                   <Link href={isFreeCourse ? `/dashboard/courses/free` : `/dashboard/payment-verification?courseId=${courseId}`}>
                        {isFreeCourse ? 'Enroll for Free' : 'Enroll Now'}
                   </Link>
                </Button>
              )}
              <div className="space-y-3 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Full course access</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Lifetime access</span>
                </div>
                 <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Community access</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isEnrolled && <CourseTabs courseId={courseId} course={course} onContentClick={handleContentClick} />}
      </div>
    </div>
  );
}

// AI Test Component inside Course Page
const LANGUAGES = ["English", "Hindi", "Kannada", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Malayalam", "Punjabi", "Odia", "Assamese", "Urdu", "Sanskrit", "Nepali", "Sindhi", "Konkani", "Manipuri", "Bodo", "Dogri", "Maithili", "Santhali", "Kashmiri"];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

const testGenerationSchema = z.object({
  subject: z.string().min(1, 'Subject is required.'),
  examType: z.string().min(1, 'Exam type is required.'),
  language: z.string().min(1, 'Language is required.'),
  testType: z.literal('Multiple Choice'),
  questionCount: z.coerce.number().min(3, 'Minimum 3 questions').max(50, 'Maximum 50 questions'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
});

type TestGenerationValues = z.infer<typeof testGenerationSchema>;


function AiTestGenerator({ onTestGenerated, subject, examType }: { onTestGenerated: (data: GenerateAiTestOutput, formData: TestGenerationValues) => void, subject?: string, examType?: string }) {
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const form = useForm<TestGenerationValues>({
        resolver: zodResolver(testGenerationSchema),
        defaultValues: {
            subject: subject || '',
            examType: examType || '',
            language: 'English',
            testType: 'Multiple Choice',
            questionCount: 5,
            difficulty: 'Medium',
        },
    });

    const steps = [
        { id: 'language', title: 'किस भाषा में टेस्ट बनाना है?', icon: Languages, options: LANGUAGES },
        { id: 'questionCount', title: 'कितने सवाल चाहिए?', icon: HelpCircle, options: [5, 10, 15, 20, 25] },
        { id: 'difficulty', title: 'टेस्ट कितना कठिन होना चाहिए?', icon: Sigma, options: DIFFICULTIES },
    ];

    const currentStep = steps[step];

    const handleSelect = async (value: string | number) => {
        // @ts-ignore
        form.setValue(currentStep.id, value, { shouldValidate: true });

        if (step < steps.length - 1) {
            setStep(s => s + 1);
        } else {
            await form.handleSubmit(onGenerateSubmit)();
        }
    };
    
    async function onGenerateSubmit(data: TestGenerationValues) {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateAiTestAction(data);
            onTestGenerated(result, data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }
    
    return (
        <Card className="shadow-lg border-border/60 bg-gradient-to-br from-purple-400/10 via-blue-400/10 to-teal-400/10">
            <CardHeader className="text-center">
                <Bot className="h-12 w-12 mx-auto text-primary animate-bounce" />
                <CardTitle>AI Test Generator</CardTitle>
                <CardDescription>Let's create your personalized test!</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[250px] flex flex-col justify-center items-center">
                {isLoading ? (
                    <div className="text-center space-y-3">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                        <p className="font-semibold">Generating your test...</p>
                        <p className="text-sm text-muted-foreground">This may take a moment.</p>
                    </div>
                ) : (
                    <div className="w-full text-center space-y-4">
                        <div className="flex items-center justify-center gap-2 font-semibold text-lg">
                           <currentStep.icon className="h-6 w-6 text-primary" />
                           <h3>{currentStep.title}</h3>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 pt-4">
                            {currentStep.options.map(option => (
                                <Button key={option} variant="outline" size="lg" onClick={() => handleSelect(option)}>
                                    {option} {currentStep.id === 'questionCount' && 'Questions'}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
                 {error && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error Generating Test</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    )
}


export default function CourseDetailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CourseDetailPageContent />
        </Suspense>
    )
}
