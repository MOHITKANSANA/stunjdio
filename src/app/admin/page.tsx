
'use client';

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, setDoc, writeBatch, getDocs, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Check, X, Upload, Video, FileText, StickyNote, PlusCircle, Save, Download, ThumbsUp, ThumbsDown, Clock, CircleAlert, CheckCircle2, XCircle, KeyRound, Newspaper, Image as ImageIcon, MinusCircle, BookMarked, Award, Gift, ShieldQuestion, Percent, IndianRupee, CalendarDays, MonitorPlay, Clapperboard } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Image from 'next/image';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { awardExtraPointsAction } from '@/app/actions/kids-tube';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const courseFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(3, 'Category must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  validity: z.coerce.number().min(0, 'Validity must be a positive number of days.'),
  imageFile: z.instanceof(File).optional(),
  isFree: z.boolean().default(false),
});
type CourseFormValues = z.infer<typeof courseFormSchema>;

const couponSchema = z.object({
    code: z.string().min(3, 'Coupon code must be at least 3 characters long.').toUpperCase(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.coerce.number().min(1, 'Discount value must be at least 1.'),
    courseId: z.string().min(1, 'Please select a course for this coupon.'),
    expiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
});
type CouponFormValues = z.infer<typeof couponSchema>;

const liveClassFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    youtubeUrl: z.string().url('Must be a valid YouTube URL'),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
    thumbnailFile: z.instanceof(File).optional(),
});
type LiveClassFormValues = z.infer<typeof liveClassFormSchema>;


const qrCodeFormSchema = z.object({
    imageFile: z.instanceof(File, { message: 'Please upload an image file.' }).refine(file => file.size < 2 * 1024 * 1024, 'Image must be less than 2MB.'),
});
type QrCodeFormValues = z.infer<typeof qrCodeFormSchema>;

const splashScreenFormSchema = z.object({
    imageFile: z.instanceof(File, { message: 'Please upload an image file.' }).refine(file => file.size < 2 * 1024 * 1024, 'Image must be less than 2MB.'),
});
type SplashScreenFormValues = z.infer<typeof splashScreenFormSchema>;

const courseContentSchema = z.object({
    courseId: z.string().min(1, "Please select a course."),
    contentType: z.enum(['video', 'pdf', 'note', 'test_series', 'ai_test']),
    title: z.string().min(3, 'Content title is required.'),
    introduction: z.string().optional(),
    url: z.string().url().optional(), // Optional for tests
    testSeriesId: z.string().optional(), // For linking existing test series
}).refine(data => {
    if (data.contentType === 'test_series' && !data.testSeriesId) {
        return false;
    }
    if (['video', 'pdf', 'note'].includes(data.contentType) && !data.url) {
        return false;
    }
    return true;
}, {
    message: 'Required field for this content type is missing.',
    path: ['url'], // Path to show error on
});
type CourseContentValues = z.infer<typeof courseContentSchema>;

const scholarshipSettingsSchema = z.object({
    startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
    endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
    testStartDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
    testEndDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
    resultDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
});
type ScholarshipSettingsValues = z.infer<typeof scholarshipSettingsSchema>;

const scholarshipQuestionSchema = z.object({
    text: z.string().min(5, 'Question text is required'),
    options: z.array(z.string().min(1)).length(4, 'There must be 4 options'),
    correctAnswer: z.string().min(1, 'Please select the correct answer'),
});
type ScholarshipQuestionValues = z.infer<typeof scholarshipQuestionSchema>;

const jsonQuestionsSchema = z.object({
    jsonInput: z.string().refine((val) => {
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) && parsed.every(q => scholarshipQuestionSchema.safeParse(q).success);
        } catch (e) {
            return false;
        }
    }, 'Invalid JSON format or structure.'),
});
type JsonQuestionsValues = z.infer<typeof jsonQuestionsSchema>;

const accessKeySchema = z.object({
    key: z.string().min(1, "Access key cannot be empty."),
});
type AccessKeyFormValues = z.infer<typeof accessKeySchema>;

const previousPaperSchema = z.object({
    title: z.string().min(3, 'Title is required.'),
    year: z.coerce.number().min(2000).max(new Date().getFullYear()),
    file: z.instanceof(File).optional(),
    fileUrl: z.string().url().optional(),
}).refine(data => data.file || data.fileUrl, {
    message: 'Either a file upload or a file URL is required.',
    path: ['file'],
});
type PreviousPaperValues = z.infer<typeof previousPaperSchema>;

const testSeriesQuestionSchema = z.object({
    text: z.string().min(5, "Question text is required."),
    options: z.array(z.string().min(1, "Option cannot be empty.")).length(4, "Must have 4 options."),
    correctAnswer: z.string().min(1, "Please select the correct answer."),
});

const testSeriesSchema = z.object({
    title: z.string().min(3, 'Title is required.'),
    subject: z.string().min(2, 'Subject is required.'),
    questions: z.array(testSeriesQuestionSchema).min(1, "At least one question is required."),
});
type TestSeriesValues = z.infer<typeof testSeriesSchema>;


const jsonTestSeriesSchema = z.object({
    jsonInput: z.string().refine((val) => {
        try {
            const parsed = JSON.parse(val);
            return testSeriesSchema.safeParse(parsed).success;
        } catch (e) {
            return false;
        }
    }, 'Invalid JSON format or structure for a Test Series.'),
});
type JsonTestSeriesValues = z.infer<typeof jsonTestSeriesSchema>;


const carouselItemSchema = z.object({
    imageFile: z.instanceof(File, { message: "An image file is required." }),
    internalLink: z.string().optional(),
    externalLink: z.string().url().optional(),
}).refine(data => data.internalLink || data.externalLink, {
    message: 'Please select an internal link or provide an external one.',
    path: ['internalLink'],
});
type CarouselItemValues = z.infer<typeof carouselItemSchema>;

const kidsTubeVideoSchema = z.object({
    title: z.string().min(3, "Title is required."),
    description: z.string().optional(),
    videoUrl: z.string().url("Must be a valid video URL."),
    thumbnailUrl: z.string().optional(), // Now optional
});
type KidsTubeVideoValues = z.infer<typeof kidsTubeVideoSchema>;

const eBookSchema = z.object({
    title: z.string().min(3, "Title is required."),
    description: z.string().optional(),
    thumbnailFile: z.instanceof(File, { message: 'Thumbnail is required.' }),
    pdfFile: z.instanceof(File, { message: 'PDF file is required.' }).refine(file => file.type === 'application/pdf', 'File must be a PDF.'),
});
type EBookValues = z.infer<typeof eBookSchema>;

const liveClassFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    youtubeUrl: z.string().url('Must be a valid YouTube URL'),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
    thumbnailFile: z.instanceof(File).optional(),
});
type LiveClassFormValues = z.infer<typeof liveClassFormSchema>;

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
};

const ADMIN_ACCESS_KEY = "GSC_ADMIN_2024";

const APP_PAGES = [
    { label: 'Home / Dashboard', value: '/dashboard' },
    { label: 'All Courses', value: '/dashboard/courses' },
    { label: 'Free Courses', value: '/dashboard/courses/free' },
    { label: 'Classes & Lectures', value: '/dashboard/classes-lectures' },
    { label: 'AI Tutor', value: '/dashboard/tutor' },
    { label: 'AI Tests', value: '/dashboard/ai-test' },
    { label: 'Test Series', value: '/dashboard/ai-test?tab=series' },
    { label: 'Previous Papers', value: '/dashboard/papers' },
    { label: 'Scholarship', value: '/dashboard/scholarship' },
    { label: 'Profile', value: '/dashboard/profile' },
];

export default function AdminPage() {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('admin_access_granted') === 'true') {
        setHasAccess(true);
    }
  }, []);

  if (!hasAccess) {
    return <AdminAccessGate setHasAccess={setHasAccess} />;
  }

  return <AdminDashboard />;
}

function AdminAccessGate({ setHasAccess }: { setHasAccess: (hasAccess: boolean) => void }) {
    const accessKeyForm = useForm<AccessKeyFormValues>({ 
        resolver: zodResolver(accessKeySchema),
        defaultValues: {
            key: '',
        }
    });
    const { toast } = useToast();

    const onAccessKeySubmit = (data: AccessKeyFormValues) => {
        if (data.key === ADMIN_ACCESS_KEY) {
            sessionStorage.setItem('admin_access_granted', 'true');
            setHasAccess(true);
            toast({ title: 'Access Granted', description: 'Welcome to the Admin Panel.' });
        } else {
            toast({ variant: 'destructive', title: 'Access Denied', description: 'The provided access key is incorrect.' });
        }
    };
    
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Admin Access Required</CardTitle>
                    <CardDescription>Please enter the access key to manage the admin panel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...accessKeyForm}>
                        <form onSubmit={accessKeyForm.handleSubmit(onAccessKeySubmit)} className="space-y-4">
                            <FormField
                                control={accessKeyForm.control}
                                name="key"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Access Key</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input type="password" placeholder="Enter secret key" className="pl-10" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={accessKeyForm.formState.isSubmitting}>
                                {accessKeyForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Unlock Admin Panel
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

function AdminDashboard() {
  const [enrollmentsCollection, enrollmentsLoading] = useCollection(query(collection(firestore, 'enrollments'), orderBy('createdAt', 'desc')));
  const [coursesCollection, coursesLoading] = useCollection(query(collection(firestore, 'courses'), orderBy('title', 'asc')));
  const [couponsCollection, couponsLoading] = useCollection(query(collection(firestore, 'coupons'), orderBy('createdAt', 'desc')));
  const [settingsCollection] = useCollection(collection(firestore, 'settings'));
  const [scholarshipQuestionsCollection, scholarshipQuestionsLoading] = useCollection(query(collection(firestore, 'scholarshipTest'), orderBy('createdAt', 'asc')));
  const [scholarshipApplicants, scholarshipApplicantsLoading, scholarshipApplicantsError] = useCollection(query(collection(firestore, 'scholarshipApplications'), orderBy('appliedAt', 'desc')));
  const [carouselItemsCollection, carouselItemsLoading] = useCollection(query(collection(firestore, 'homepageCarousel'), orderBy('createdAt', 'asc')));
  const [kidsVideosCollection, kidsVideosLoading] = useCollection(query(collection(firestore, 'kidsTubeVideos'), orderBy('createdAt', 'desc')));
  const [ebooksCollection, ebooksLoading] = useCollection(query(collection(firestore, 'ebooks'), orderBy('createdAt', 'desc')));
  const [rewardRedemptions, rewardRedemptionsLoading] = useCollection(query(collection(firestore, 'rewardRedemptions'), orderBy('redeemedAt', 'desc')));
  const [pointRequests, pointRequestsLoading] = useCollection(query(collection(firestore, 'pointRequests'), orderBy('requestedAt', 'desc')));
  const [testSeriesCollection, testSeriesLoading] = useCollection(query(collection(firestore, 'testSeries'), orderBy('createdAt', 'desc')));
  const [liveClassesCollection, liveClassesLoading] = useCollection(query(collection(firestore, 'live_classes'), orderBy('startTime', 'desc')));


  const qrCodeUrl = settingsCollection?.docs.find(d => d.id === 'paymentQrCode')?.data().url;
  const splashScreenUrl = settingsCollection?.docs.find(d => d.id === 'splashScreen')?.data().url;
  const scholarshipSettings = settingsCollection?.docs.find(d => d.id === 'scholarship')?.data();
  
  const [applicantTestScores, setApplicantTestScores] = useState<Record<string, string>>({});
  const [pointsToAward, setPointsToAward] = useState<Record<string, number>>({});
  
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const { toast } = useToast();


  useEffect(() => {
    if (!scholarshipApplicants || scholarshipApplicantsLoading) return;
  
    const fetchScores = async () => {
      if (!scholarshipApplicants?.docs) return;
  
      const scores: Record<string, string> = {};
      for (const appDoc of scholarshipApplicants.docs) {
        const app = appDoc.data();
        if (app.status === 'test_taken') {
          const q = query(
            collection(firestore, 'scholarshipTestResults'),
            where('applicationNumber', '==', app.applicationNumber)
          );
          try {
            const resultsSnapshot = await getDocs(q);
            if (!resultsSnapshot.empty) {
              const resultData = resultsSnapshot.docs[0].data();
              scores[appDoc.id] = `${resultData.score}/${resultData.totalQuestions}`;
            } else {
              scores[appDoc.id] = 'N/A';
            }
          } catch (e) {
            console.error(e);
            scores[appDoc.id] = 'N/A';
          }
        } else {
          scores[appDoc.id] = 'N/A';
        }
      }
      setApplicantTestScores(scores);
    };
  
    if (scholarshipApplicants) {
      fetchScores();
    }
  }, [scholarshipApplicants, scholarshipApplicantsLoading]);
  
  const courseForm = useForm<CourseFormValues>({ resolver: zodResolver(courseFormSchema), defaultValues: { title: '', category: '', description: '', price: 0, validity: 365, isFree: false, imageFile: undefined } });
  const couponForm = useForm<CouponFormValues>({ resolver: zodResolver(couponSchema), defaultValues: { code: '', discountType: 'percentage', discountValue: 10, courseId: '', expiryDate: '' } });
  const qrCodeForm = useForm<QrCodeFormValues>({ resolver: zodResolver(qrCodeFormSchema), defaultValues: { imageFile: undefined } });
  const splashScreenForm = useForm<SplashScreenFormValues>({ resolver: zodResolver(splashScreenFormSchema) });
  const courseContentForm = useForm<CourseContentValues>({ resolver: zodResolver(courseContentSchema), defaultValues: { courseId: '', contentType: 'video', title: '', introduction: '', url: '', testSeriesId: '' } });
  const scholarshipSettingsForm = useForm<ScholarshipSettingsValues>({
    resolver: zodResolver(scholarshipSettingsSchema),
    values: {
      startDate: scholarshipSettings?.startDate?.toDate()?.toISOString().substring(0, 16) || '',
      endDate: scholarshipSettings?.endDate?.toDate()?.toISOString().substring(0, 16) || '',
      testStartDate: scholarshipSettings?.testStartDate?.toDate()?.toISOString().substring(0, 16) || '',
      testEndDate: scholarshipSettings?.testEndDate?.toDate()?.toISOString().substring(0, 16) || '',
      resultDate: scholarshipSettings?.resultDate?.toDate()?.toISOString().substring(0, 16) || '',
    },
  });
  const scholarshipQuestionForm = useForm<ScholarshipQuestionValues>({ resolver: zodResolver(scholarshipQuestionSchema), defaultValues: { text: '', options: ['', '', '', ''], correctAnswer: '' } });
  const jsonQuestionsForm = useForm<JsonQuestionsValues>({ resolver: zodResolver(jsonQuestionsSchema), defaultValues: { jsonInput: '' } });
  const previousPaperForm = useForm<PreviousPaperValues>({ resolver: zodResolver(previousPaperSchema), defaultValues: { title: '', year: new Date().getFullYear(), fileUrl: '', file: undefined } });
  const liveClassForm = useForm<LiveClassFormValues>({ resolver: zodResolver(liveClassFormSchema), defaultValues: { title: '', youtubeUrl: '', startTime: '' } });

  
  const testSeriesForm = useForm<TestSeriesValues>({
    resolver: zodResolver(testSeriesSchema),
    defaultValues: { title: '', subject: '', questions: [{ text: '', options: ['', '', '', ''], correctAnswer: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control: testSeriesForm.control, name: "questions" });

  const jsonTestSeriesForm = useForm<JsonTestSeriesValues>({ resolver: zodResolver(jsonTestSeriesSchema), defaultValues: { jsonInput: '' } });
  const carouselItemForm = useForm<CarouselItemValues>({ resolver: zodResolver(carouselItemSchema), defaultValues: { internalLink: '', externalLink: '', imageFile: undefined } });
  const kidsTubeVideoForm = useForm<KidsTubeVideoValues>({ resolver: zodResolver(kidsTubeVideoSchema), defaultValues: { title: '', description: '', videoUrl: '', thumbnailUrl: '' } });
  const eBookForm = useForm<EBookValues>({ resolver: zodResolver(eBookSchema) });

  const handleEnrollmentAction = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(firestore, 'enrollments', id), { status: newStatus });
      toast({ title: 'Success', description: `Enrollment has been ${newStatus}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update enrollment status.' });
    }
  };
  
  const onCourseSubmit = async (data: CourseFormValues) => {
    try {
      let imageUrl = `https://picsum.photos/seed/${new Date().getTime()}/600/400`;
      if (data.imageFile) {
        imageUrl = await fileToDataUrl(data.imageFile);
      }
      
      const courseData = {
        title: data.title,
        category: data.category,
        description: data.description,
        price: data.price,
        validity: data.validity,
        isFree: data.isFree,
        imageUrl,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'courses'), courseData);
      toast({ title: 'Success', description: 'Course created successfully.' });
      courseForm.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create course.' });
    }
  };
  
   const toggleCourseFreeStatus = async (courseId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(firestore, 'courses', courseId), { isFree: !currentStatus });
      toast({ title: 'Success', description: `Course status updated.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update course status.' });
    }
  };

    const onCourseContentSubmit = async (data: CourseContentValues) => {
        try {
            const contentData: any = {
                type: data.contentType,
                title: data.title,
                introduction: data.introduction || null,
                createdAt: serverTimestamp()
            };

            if (data.contentType === 'test_series') {
                contentData.testSeriesId = data.testSeriesId;
            } else if (data.contentType === 'ai_test') {
            } else {
                contentData.url = data.url;
            }

            await addDoc(collection(firestore, 'courses', data.courseId, 'content'), contentData);
            toast({ title: 'Success', description: 'Content added to course.' });
            courseContentForm.reset();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not add content.' });
        }
    };
  
  const onPreviousPaperSubmit = async (data: PreviousPaperValues) => {
    try {
        let finalFileUrl = data.fileUrl;
        if (data.file) {
            finalFileUrl = await fileToDataUrl(data.file);
        }
        await addDoc(collection(firestore, 'previousPapers'), { title: data.title, year: data.year, fileUrl: finalFileUrl, createdAt: serverTimestamp() });
        toast({ title: 'Success', description: 'Previous year paper added.' });
        previousPaperForm.reset();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add paper.' });
    }
  };
  
  const onTestSeriesSubmit = async (data: TestSeriesValues) => {
    try {
        await addDoc(collection(firestore, 'testSeries'), { ...data, createdAt: serverTimestamp() });
        toast({ title: 'Success', description: 'Test series added successfully.' });
        testSeriesForm.reset({ title: '', subject: '', questions: [{ text: '', options: ['', '', '', ''], correctAnswer: '' }] });
    } catch (error) {
        console.error("Test series submit error:", error)
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add test series.' });
    }
  }

  const onJsonTestSeriesSubmit = async (data: JsonTestSeriesValues) => {
    try {
        const testData = JSON.parse(data.jsonInput);
        await addDoc(collection(firestore, 'testSeries'), { ...testData, createdAt: serverTimestamp() });
        toast({ title: 'Success', description: 'Test series added successfully from JSON.' });
        jsonTestSeriesForm.reset();
    } catch (error) {
        console.error("JSON Test Series submit error:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add test series from JSON. Please check the format.' });
    }
  }

  const onCouponSubmit = async (data: CouponFormValues) => {
    try {
        const couponData = {
            ...data,
            expiryDate: new Date(data.expiryDate),
            isActive: true,
            createdAt: serverTimestamp()
        };
        await addDoc(collection(firestore, 'coupons'), couponData);
        toast({ title: 'Success!', description: `Coupon ${data.code} created.` });
        couponForm.reset();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not create coupon.' });
    }
  };

  const onCarouselItemSubmit = async (data: CarouselItemValues) => {
    try {
        const imageUrl = await fileToDataUrl(data.imageFile);
        const linkUrl = data.externalLink || data.internalLink || '#';
        
        await addDoc(collection(firestore, 'homepageCarousel'), {
            imageUrl,
            linkUrl,
            createdAt: serverTimestamp() 
        });
        toast({ title: 'Success', description: 'Carousel item added.' });
        carouselItemForm.reset();
    } catch (error) {
        console.error("Carousel submit error:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add carousel item.' });
    }
  };

  const deleteCarouselItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this carousel item?')) {
        await deleteDoc(doc(firestore, 'homepageCarousel', id));
        toast({ description: 'Carousel item deleted.' });
    }
  }
  
  const onQrCodeSubmit = async (data: QrCodeFormValues) => {
    qrCodeForm.formState.isSubmitting;
    try {
      const dataUrl = await fileToDataUrl(data.imageFile);
      await setDoc(doc(firestore, 'settings', 'paymentQrCode'), { url: dataUrl });
      toast({ title: 'Success', description: 'QR Code updated.' });
      qrCodeForm.reset();
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not update QR code.' });
    }
  };

  const onSplashScreenSubmit = async (data: SplashScreenFormValues) => {
    try {
      const dataUrl = await fileToDataUrl(data.imageFile);
      await setDoc(doc(firestore, 'settings', 'splashScreen'), { url: dataUrl });
      toast({ title: 'Success', description: 'Splash Screen updated.' });
      splashScreenForm.reset();
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not update splash screen.' });
    }
  };

  const onScholarshipSettingsSubmit = async (data: ScholarshipSettingsValues) => {
    try {
      await setDoc(doc(firestore, 'settings', 'scholarship'), {
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        testStartDate: new Date(data.testStartDate),
        testEndDate: new Date(data.testEndDate),
        resultDate: new Date(data.resultDate),
      }, { merge: true });
      toast({ title: 'Success', description: 'Scholarship settings saved.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save settings.' });
    }
  };

  const onScholarshipQuestionSubmit = async (data: ScholarshipQuestionValues) => {
    try {
      await addDoc(collection(firestore, 'scholarshipTest'), { ...data, createdAt: serverTimestamp() });
      toast({ title: 'Success', description: 'Question added.' });
      scholarshipQuestionForm.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add question.' });
    }
  };
  
  const onJsonQuestionsSubmit = async (data: JsonQuestionsValues) => {
    try {
        const questions = JSON.parse(data.jsonInput);
        const batch = writeBatch(firestore);
        questions.forEach((q: ScholarshipQuestionValues) => {
            const newDocRef = doc(collection(firestore, 'scholarshipTest'));
            batch.set(newDocRef, { ...q, createdAt: serverTimestamp() });
        });
        await batch.commit();
        toast({ title: 'Success', description: `${questions.length} questions added successfully.` });
        jsonQuestionsForm.reset();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add questions from JSON.' });
    }
  };

  const deleteScholarshipQuestion = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      await deleteDoc(doc(firestore, 'scholarshipTest', id));
      toast({ description: 'Question deleted.' });
    }
  };
  
  const handleScholarshipApplicantAction = async (id: string, field: 'status' | 'resultStatus', newStatus: string) => {
    try {
      await updateDoc(doc(firestore, 'scholarshipApplications', id), { [field]: newStatus });
      toast({ title: 'Success', description: `Applicant status has been updated.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update applicant status.' });
    }
  };
  
  const onKidsTubeVideoSubmit = async (data: KidsTubeVideoValues) => {
    try {
        const videoData = {
            title: data.title,
            description: data.description || '',
            videoUrl: data.videoUrl,
            thumbnailUrl: data.thumbnailUrl || `https://picsum.photos/seed/${new Date().getTime()}/200/120`,
            likes: 0,
            dislikes: 0,
            createdAt: serverTimestamp(),
        };

        await addDoc(collection(firestore, 'kidsTubeVideos'), videoData);
        toast({ title: 'Success', description: 'Kids Tube video added.' });
        kidsTubeVideoForm.reset();
    } catch (error) {
        console.error("Error adding video:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add video.' });
    }
  };


  const deleteKidsTubeVideo = async (id: string) => {
      if (window.confirm("Are you sure you want to delete this video?")) {
          await deleteDoc(doc(firestore, 'kidsTubeVideos', id));
          toast({ description: 'Video deleted from Kids Tube.' });
      }
  };
  
  const onEBookSubmit = async (data: EBookValues) => {
    try {
        const thumbnailUrl = await fileToDataUrl(data.thumbnailFile);
        const fileUrl = await fileToDataUrl(data.pdfFile);

        await addDoc(collection(firestore, 'ebooks'), {
            title: data.title,
            description: data.description,
            thumbnailUrl,
            fileUrl,
            createdAt: serverTimestamp(),
        });
        toast({ title: 'Success', description: 'E-book added successfully.' });
        eBookForm.reset();
    } catch (error) {
        console.error("E-book submit error:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add e-book.' });
    }
  };

  const deleteEBook = async (id: string) => {
      if (window.confirm("Are you sure you want to delete this e-book?")) {
          await deleteDoc(doc(firestore, 'ebooks', id));
          toast({ description: 'E-book deleted.' });
      }
  };

  const handleAwardPoints = async (requestId: string, userId: string) => {
    const points = pointsToAward[requestId];
    if (!points || points <= 0) {
        toast({ variant: 'destructive', description: "Please enter a valid number of points." });
        return;
    }
    const result = await awardExtraPointsAction(requestId, userId, points);
    if (result.success) {
        toast({ title: 'Success!', description: result.message });
        setPointsToAward(prev => ({ ...prev, [requestId]: 0 }));
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };


  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'applied': return <Badge variant="secondary">Applied</Badge>;
        case 'payment_pending': return <Badge className="bg-yellow-500 text-white hover:bg-yellow-500/90"><Clock className="mr-1.5 h-3 w-3"/>Payment Pending</Badge>;
        case 'payment_approved': return <Badge className="bg-green-500 text-white hover:bg-green-500/90"><Check className="mr-1.5 h-3 w-3"/>Payment Approved</Badge>;
        case 'payment_rejected': return <Badge variant="destructive"><X className="mr-1.5 h-3 w-3"/>Payment Rejected</Badge>;
        case 'test_taken': return <Badge><FileText className="mr-1.5 h-3 w-3"/>Test Taken</Badge>;
        default: return <Badge variant="outline">{status}</Badge>;
    }
  }

  const getResultBadge = (status: string | undefined) => {
    switch (status) {
        case 'pass': return <Badge className="bg-green-600 text-white hover:bg-green-600/90"><CheckCircle2 className="mr-1.5 h-3 w-3"/>Pass</Badge>;
        case 'fail': return <Badge variant="destructive"><XCircle className="mr-1.5 h-3 w-3"/>Fail</Badge>;
        case 'pending':
        default:
            return <Badge variant="secondary"><CircleAlert className="mr-1.5 h-3 w-3"/>Pending</Badge>;
    }
  }
  
  const isValidUrl = (url: string | undefined | null): boolean => {
    if (!url) return false;
    try {
        new URL(url);
        return url.startsWith('data:image/');
    } catch (e) {
        return false;
    }
  };
  
    const onThumbnailFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Reset crop state
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(e.target.files[0]);
            setIsCropperOpen(true);
        }
    };

    const getCroppedImgDataUrl = (): Promise<string> => {
        return new Promise((resolve) => {
            const image = imgRef.current;
            if (!image || !completedCrop) {
                return;
            }

            const canvas = document.createElement('canvas');
            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;
            
            canvas.width = completedCrop.width * scaleX;
            canvas.height = completedCrop.height * scaleY;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.drawImage(
                image,
                completedCrop.x * scaleX,
                completedCrop.y * scaleY,
                completedCrop.width * scaleX,
                completedCrop.height * scaleY,
                0, 0,
                canvas.width,
                canvas.height
            );

            resolve(canvas.toDataURL('image/jpeg'));
        });
    };

    const handleCrop = async () => {
        const dataUrl = await getCroppedImgDataUrl();
        kidsTubeVideoForm.setValue('thumbnailUrl', dataUrl);
        setIsCropperOpen(false);
    };

    const onLiveClassSubmit = async (data: LiveClassFormValues) => {
        try {
            let thumbnailUrl = `https://picsum.photos/seed/liveclass-${new Date().getTime()}/400/225`;
            if (data.thumbnailFile) {
                thumbnailUrl = await fileToDataUrl(data.thumbnailFile);
            }

            await addDoc(collection(firestore, 'live_classes'), {
                title: data.title,
                youtubeUrl: data.youtubeUrl,
                thumbnailUrl,
                startTime: new Date(data.startTime),
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Success!', description: 'Live class created successfully.' });
            liveClassForm.reset();
        } catch (error) {
            console.error("Live Class submit error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not create live class.' });
        }
    };

    const deleteLiveClass = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this live class?")) {
            await deleteDoc(doc(firestore, 'live_classes', id));
            toast({ description: 'Live class deleted.' });
        }
    };


  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6">
      <h1 className="text-3xl font-semibold font-headline">Administration</h1>
      <Tabs defaultValue="enrollments">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="main_content">Main App Content</TabsTrigger>
          <TabsTrigger value="live_classes">Live Classes</TabsTrigger>
          <TabsTrigger value="kids_content">Kids Tube Content</TabsTrigger>
          <TabsTrigger value="scholarship">Scholarship</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="enrollments">
           <Card>
            <CardHeader><CardTitle>Enrollment Requests</CardTitle><CardDescription>Review and approve student course enrollments.</CardDescription></CardHeader>
            <CardContent>
              <div className="max-h-[800px] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Request</TableHead><TableHead>Screenshot</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {enrollmentsLoading && Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                    ))}
                    {enrollmentsCollection?.docs.map((doc) => {
                      const enrollment = doc.data();
                      const hasValidScreenshot = isValidUrl(enrollment.screenshotDataUrl);
                      return (
                        <TableRow key={doc.id}>
                          <TableCell><div className="font-medium">{enrollment.userDisplayName}</div><div className="text-sm text-muted-foreground">{enrollment.userEmail}</div></TableCell>
                          <TableCell>{enrollment.courseTitle}</TableCell>
                          <TableCell>
                            {hasValidScreenshot ? (
                              <Link href={enrollment.screenshotDataUrl} target="_blank" rel="noopener noreferrer">
                                <Image src={enrollment.screenshotDataUrl} alt="Payment Screenshot" width={80} height={80} className="rounded-md object-cover" />
                              </Link>
                            ) : (
                                <span className="text-xs text-muted-foreground">No Screenshot</span>
                            )}
                          </TableCell>
                          <TableCell><Badge variant={enrollment.status === 'pending' ? 'secondary' : enrollment.status === 'approved' ? 'default' : 'destructive'}>{enrollment.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            {enrollment.status === 'pending' && (
                              <div className="flex gap-2 justify-end">
                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEnrollmentAction(doc.id, 'approved')}><Check className="h-4 w-4 text-green-500" /></Button>
                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEnrollmentAction(doc.id, 'rejected')}><X className="h-4 w-4 text-red-500" /></Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="main_content">
          <div className="grid md:grid-cols-2 gap-6">
             <Card>
              <CardHeader><CardTitle>Create &amp; Manage Courses</CardTitle><CardDescription>Fill out the details to add a new course or manage existing ones.</CardDescription></CardHeader>
              <CardContent>
                <Form {...courseForm}><form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="grid gap-6 mb-6">
                    <FormField control={courseForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Course Title</FormLabel><FormControl><Input placeholder="e.g. Algebra Fundamentals" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={courseForm.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g. Maths" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={courseForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price (INR)</FormLabel><FormControl><Input type="number" placeholder="e.g. 499" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={courseForm.control} name="validity" render={({ field }) => (<FormItem><FormLabel>Validity (in days)</FormLabel><FormControl><Input type="number" placeholder="e.g. 365" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={courseForm.control} name="imageFile" render={({ field: { onChange, value, ...rest } }) => (
                      <FormItem>
                        <FormLabel>Cover Image</FormLabel>
                        <FormControl>
                          <Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...rest} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={courseForm.control} name="isFree" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Mark as Free</FormLabel><p className="text-sm text-muted-foreground">If checked, this course will be available for free.</p></div><FormControl><input type="checkbox" checked={field.value} onChange={field.onChange} className="h-5 w-5"/></FormControl></FormItem>)}/>
                    <FormField control={courseForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A short description of the course content." className="min-h-32" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <Button type="submit" disabled={courseForm.formState.isSubmitting}>{courseForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creating...</> : "Create Course"}</Button>
                </form></Form>
                 <Separator/>
                 <div className="mt-6">
                    <h4 className="font-semibold mb-2">Existing Courses</h4>
                    <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                      {coursesLoading && <Skeleton className="h-9 w-full" />}
                      {coursesCollection?.docs.map(doc => (
                        <div key={doc.id} className="text-sm p-2 border rounded flex justify-between items-center">
                          <span>{doc.data().title}</span>
                          <Button size="sm" variant={doc.data().isFree ? "secondary" : "outline"} onClick={() => toggleCourseFreeStatus(doc.id, doc.data().isFree)}>
                            {doc.data().isFree ? 'Mark as Paid' : 'Mark as Free'}
                          </Button>
                        </div>
                      ))}
                    </div>
                </div>

              </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Manage Course Content</CardTitle><CardDescription>Add videos, PDFs, and tests to your courses.</CardDescription></CardHeader>
                    <CardContent>
                        <Form {...courseContentForm}><form onSubmit={courseContentForm.handleSubmit(onCourseContentSubmit)} className="grid gap-4">
                            <FormField control={courseContentForm.control} name="courseId" render={({ field }) => (<FormItem><FormLabel>Select Course</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Choose a course" /></SelectTrigger></FormControl>
                                <SelectContent>{coursesCollection?.docs.map(doc => (<SelectItem key={doc.id} value={doc.id}>{doc.data().title}</SelectItem>))}</SelectContent>
                            </Select><FormMessage /></FormItem>)}/>
                             <FormField control={courseContentForm.control} name="contentType" render={({ field }) => (<FormItem><FormLabel>Content Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Choose a content type" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="video"><div className="flex items-center"><Video className="mr-2 h-4 w-4" />Video Lecture</div></SelectItem>
                                    <SelectItem value="pdf"><div className="flex items-center"><FileText className="mr-2 h-4 w-4" />PDF/Note</div></SelectItem>
                                    <SelectItem value="test_series"><div className="flex items-center"><FileText className="mr-2 h-4 w-4" />Test Series</div></SelectItem>
                                    <SelectItem value="ai_test"><div className="flex items-center"><ShieldQuestion className="mr-2 h-4 w-4" />AI Test Series</div></SelectItem>
                                </SelectContent>
                            </Select><FormMessage /></FormItem>)}/>
                            <FormField control={courseContentForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Content Title</FormLabel><FormControl><Input placeholder="e.g. Chapter 1: Introduction" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={courseContentForm.control} name="introduction" render={({ field }) => (<FormItem><FormLabel>Introduction (for Videos)</FormLabel><FormControl><Textarea placeholder="A short introduction for the video..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            
                            {courseContentForm.watch('contentType') === 'test_series' && (
                                <FormField control={courseContentForm.control} name="testSeriesId" render={({ field }) => (<FormItem><FormLabel>Select Test Series</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Choose a test series" /></SelectTrigger></FormControl>
                                    <SelectContent>{testSeriesCollection?.docs.map(doc => (<SelectItem key={doc.id} value={doc.id}>{doc.data().title}</SelectItem>))}</SelectContent>
                                </Select><FormMessage /></FormItem>)}/>
                            )}
                            
                            {(courseContentForm.watch('contentType') === 'video' || courseContentForm.watch('contentType') === 'pdf' || courseContentForm.watch('contentType') === 'note') && (
                                <FormField control={courseContentForm.control} name="url" render={({ field }) => (<FormItem><FormLabel>URL</FormLabel><FormControl><Input placeholder="https://youtube.com/watch?v=... or https://..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            )}
                            
                             <Button type="submit" disabled={courseContentForm.formState.isSubmitting}>{courseContentForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Adding...</> : "Add Content"}</Button>
                        </form></Form>
                    </CardContent>
                </Card>

                 <Card>
                  <CardHeader><CardTitle>E-Books Management</CardTitle><CardDescription>Add, view, and manage E-books.</CardDescription></CardHeader>
                  <CardContent>
                    <Form {...eBookForm}>
                        <form onSubmit={eBookForm.handleSubmit(onEBookSubmit)} className="space-y-4 mb-6">
                           <FormField control={eBookForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>E-Book Title</FormLabel><FormControl><Input {...field} placeholder="e.g. Complete Guide to History" /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={eBookForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="Short description of the e-book" /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={eBookForm.control} name="thumbnailFile" render={({ field: { onChange, value, ...rest } }) => (<FormItem><FormLabel>Thumbnail Image</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...rest} /></FormControl><FormMessage /></FormItem>)} />
                           <FormField control={eBookForm.control} name="pdfFile" render={({ field: { onChange, value, ...rest } }) => (<FormItem><FormLabel>PDF File</FormLabel><FormControl><Input type="file" accept=".pdf" onChange={(e) => onChange(e.target.files?.[0])} {...rest} /></FormControl><FormMessage /></FormItem>)} />
                           <Button type="submit" disabled={eBookForm.formState.isSubmitting}>{eBookForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Adding...</> : <><BookMarked className="mr-2"/>Add E-Book</>}</Button>
                        </form>
                    </Form>
                     <h4 className="font-semibold mb-2">Existing E-Books</h4>
                     <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                        {ebooksLoading && <Skeleton className="h-12 w-full" />}
                        {ebooksCollection?.docs.map((doc) => (
                           <div key={doc.id} className="flex items-center justify-between p-2 border rounded-lg">
                             <span className="font-medium">{doc.data().title}</span>
                             <Button variant="ghost" size="icon" onClick={() => deleteEBook(doc.id)}>
                               <Trash2 className="h-4 w-4 text-destructive" />
                             </Button>
                           </div>
                         ))}
                     </div>
                  </CardContent>
                 </Card>

                 <Card>
                    <CardHeader><CardTitle>Previous Year Papers</CardTitle><CardDescription>Add and manage previous year papers.</CardDescription></CardHeader>
                    <CardContent>
                        <Form {...previousPaperForm}><form onSubmit={previousPaperForm.handleSubmit(onPreviousPaperSubmit)} className="grid gap-4">
                            <FormField control={previousPaperForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Paper Title</FormLabel><FormControl><Input placeholder="e.g. UPSC Prelims 2023" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={previousPaperForm.control} name="year" render={({ field }) => (<FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" placeholder="e.g. 2023" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={previousPaperForm.control} name="file" render={({ field: { onChange, value, ...rest } }) => (<FormItem><FormLabel>Upload File (PDF)</FormLabel><FormControl><Input type="file" accept=".pdf" onChange={(e) => onChange(e.target.files?.[0])} {...rest} /></FormControl><FormMessage /></FormItem>)}/>
                            <div className="text-center text-xs text-muted-foreground">OR</div>
                            <FormField control={previousPaperForm.control} name="fileUrl" render={({ field }) => (<FormItem><FormLabel>File URL (PDF)</FormLabel><FormControl><Input placeholder="https://example.com/paper.pdf" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <Button type="submit" disabled={previousPaperForm.formState.isSubmitting}>{previousPaperForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Adding...</> : <><Newspaper className="mr-2"/>Add Paper</>}</Button>
                        </form></Form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Test Series Manager</CardTitle><CardDescription>Add new test series manually or from JSON.</CardDescription></CardHeader>
                    <CardContent>
                      <Tabs defaultValue="manual">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="manual">Add Manually</TabsTrigger>
                          <TabsTrigger value="json">Add from JSON</TabsTrigger>
                        </TabsList>
                        <TabsContent value="manual" className="pt-4">
                           <Form {...testSeriesForm}>
                              <form onSubmit={testSeriesForm.handleSubmit(onTestSeriesSubmit)} className="space-y-6">
                                <FormField control={testSeriesForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Test Series Title</FormLabel><FormControl><Input {...field} placeholder="e.g. Maths Full Syllabus Test" /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={testSeriesForm.control} name="subject" render={({ field }) => (<FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} placeholder="e.g. Maths" /></FormControl><FormMessage /></FormItem>)} />
                                <Separator />
                                {fields.map((field, index) => (
                                  <div key={field.id} className="space-y-4 p-4 border rounded-lg relative">
                                    <h4 className="font-semibold">Question {index + 1}</h4>
                                     <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                        <MinusCircle className="h-5 w-5 text-destructive" />
                                     </Button>
                                    <FormField control={testSeriesForm.control} name={`questions.${index}.text`} render={({ field }) => (<FormItem><FormLabel>Question Text</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    {[0, 1, 2, 3].map(optIndex => (
                                      <FormField key={optIndex} control={testSeriesForm.control} name={`questions.${index}.options.${optIndex}`} render={({ field }) => (<FormItem><FormLabel>Option {optIndex + 1}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    ))}
                                    <FormField control={testSeriesForm.control} name={`questions.${index}.correctAnswer`} render={({ field }) => (<FormItem><FormLabel>Correct Answer</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select correct option" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {testSeriesForm.watch(`questions.${index}.options`)?.map((opt, i) => opt && (<SelectItem key={i} value={opt}>Option {i + 1}: {opt}</SelectItem>))}
                                            </SelectContent>
                                        </Select><FormMessage /></FormItem>
                                    )}/>
                                  </div>
                                ))}
                                <div className="flex justify-between">
                                <Button type="button" variant="outline" onClick={() => append({ text: '', options: ['', '', '', ''], correctAnswer: '' })}><PlusCircle className="mr-2" />Add Question</Button>
                                <Button type="submit" disabled={testSeriesForm.formState.isSubmitting}>
                                    {testSeriesForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Test Series
                                </Button>
                                </div>
                              </form>
                           </Form>
                        </TabsContent>
                        <TabsContent value="json" className="pt-4">
                          <Form {...jsonTestSeriesForm}><form onSubmit={jsonTestSeriesForm.handleSubmit(onJsonTestSeriesSubmit)} className="grid gap-4">
                              <FormField control={jsonTestSeriesForm.control} name="jsonInput" render={({ field }) => (<FormItem><FormLabel>JSON Input</FormLabel><FormControl><Textarea {...field} rows={10} placeholder='{"title": "...", "subject": "...", "questions": [{"text": "...", "options": [...], "correctAnswer": "..."}]}' /></FormControl><FormMessage /></FormItem>)}/>
                              <Button type="submit" disabled={jsonTestSeriesForm.formState.isSubmitting}><Upload className="mr-2"/>{jsonTestSeriesForm.formState.isSubmitting ? 'Uploading...' : 'Upload Test Series'}</Button>
                          </form></Form>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                </Card>

            </div>
           
          </div>
        </TabsContent>
        <TabsContent value="live_classes">
            <div className="grid md:grid-cols-2 gap-6 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Create Live Class</CardTitle>
                        <CardDescription>Schedule a new live class for your students.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...liveClassForm}>
                            <form onSubmit={liveClassForm.handleSubmit(onLiveClassSubmit)} className="space-y-4">
                                <FormField control={liveClassForm.control} name="title" render={({ field }) => (
                                    <FormItem><FormLabel>Class Title</FormLabel><FormControl><Input {...field} placeholder="e.g., Live Doubt Clearing Session" /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={liveClassForm.control} name="youtubeUrl" render={({ field }) => (
                                    <FormItem><FormLabel>YouTube Live URL</FormLabel><FormControl><Input {...field} placeholder="https://www.youtube.com/live/..." /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={liveClassForm.control} name="startTime" render={({ field }) => (
                                    <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={liveClassForm.control} name="thumbnailFile" render={({ field: { onChange, ...fieldProps} }) => (
                                     <FormItem><FormLabel>Thumbnail (Optional)</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...fieldProps} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <Button type="submit" disabled={liveClassForm.formState.isSubmitting}>
                                    {liveClassForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Schedule Class
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Scheduled Classes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[600px] overflow-y-auto pr-2 space-y-2">
                           {liveClassesLoading && <Skeleton className="h-12 w-full" />}
                           {liveClassesCollection?.docs.map((doc) => (
                             <div key={doc.id} className="flex items-center justify-between p-2 border rounded-lg">
                               <div className="flex-1">
                                 <p className="font-medium">{doc.data().title}</p>
                                 <p className="text-sm text-muted-foreground">{doc.data().startTime?.toDate()?.toLocaleString()}</p>
                               </div>
                               <Button variant="ghost" size="icon" onClick={() => deleteLiveClass(doc.id)}>
                                 <Trash2 className="h-4 w-4 text-destructive" />
                               </Button>
                             </div>
                           ))}
                           {!liveClassesLoading && liveClassesCollection?.empty && <p className="text-muted-foreground text-center">No classes scheduled.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
        <TabsContent value="kids_content">
           <div className="grid md:grid-cols-2 gap-6 items-start">
              <Card>
                  <CardHeader><CardTitle>Add Video to Kids Tube</CardTitle><CardDescription>Upload videos for the 1-9 years age group.</CardDescription></CardHeader>
                  <CardContent>
                      <Form {...kidsTubeVideoForm}>
                          <form onSubmit={kidsTubeVideoForm.handleSubmit(onKidsTubeVideoSubmit)} className="space-y-4">
                              <FormField control={kidsTubeVideoForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Video Title</FormLabel><FormControl><Input {...field} placeholder="e.g. Learning Alphabets" /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={kidsTubeVideoForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea {...field} placeholder="A short description about the video." /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={kidsTubeVideoForm.control} name="videoUrl" render={({ field }) => (<FormItem><FormLabel>Video URL</FormLabel><FormControl><Input {...field} placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4" /></FormControl><FormMessage /></FormItem>)} />
                              
                               <FormItem>
                                    <FormLabel>Thumbnail Image (Optional)</FormLabel>
                                    <FormControl>
                                        <Input type="file" accept="image/*" onChange={onThumbnailFileChange} />
                                    </FormControl>
                                    {kidsTubeVideoForm.watch('thumbnailUrl') && (
                                        <div className="mt-2">
                                            <Image src={kidsTubeVideoForm.watch('thumbnailUrl')!} alt="Thumbnail preview" width={160} height={90} className="rounded-md" />
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>

                              <Button type="submit" disabled={kidsTubeVideoForm.formState.isSubmitting}>
                                  {kidsTubeVideoForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Add Video
                              </Button>
                          </form>
                      </Form>
                  </CardContent>
              </Card>
               <Card>
                  <CardHeader><CardTitle>Existing Kids Tube Videos</CardTitle></CardHeader>
                  <CardContent>
                      <div className="max-h-[600px] overflow-y-auto pr-2 space-y-2">
                         {kidsVideosLoading && <Skeleton className="h-12 w-full" />}
                         {kidsVideosCollection?.docs.map((doc) => (
                           <div key={doc.id} className="flex items-center justify-between p-2 border rounded-lg">
                             <span className="font-medium">{doc.data().title}</span>
                             <Button variant="ghost" size="icon" onClick={() => deleteKidsTubeVideo(doc.id)}>
                               <Trash2 className="h-4 w-4 text-destructive" />
                             </Button>
                           </div>
                         ))}
                      </div>
                  </CardContent>
              </Card>
           </div>
        </TabsContent>
        <TabsContent value="scholarship">
            <div className="grid md:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Scholarship Settings</CardTitle><CardDescription>Set application, test, and result dates.</CardDescription></CardHeader>
                        <CardContent>
                            <Form {...scholarshipSettingsForm}><form onSubmit={scholarshipSettingsForm.handleSubmit(onScholarshipSettingsSubmit)} className="grid gap-4">
                                <FormField control={scholarshipSettingsForm.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Application Start Date</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={scholarshipSettingsForm.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>Application End Date</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={scholarshipSettingsForm.control} name="testStartDate" render={({ field }) => (<FormItem><FormLabel>Test Start Date</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={scholarshipSettingsForm.control} name="testEndDate" render={({ field }) => (<FormItem><FormLabel>Test End Date</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={scholarshipSettingsForm.control} name="resultDate" render={({ field }) => (<FormItem><FormLabel>Result Declaration Date</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <Button type="submit" disabled={scholarshipSettingsForm.formState.isSubmitting}><Save className="mr-2"/>{scholarshipSettingsForm.formState.isSubmitting ? 'Saving...' : 'Save Settings'}</Button>
                            </form></Form>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Scholarship Test Questions</CardTitle><CardDescription>Manage the questions for the online test.</CardDescription></CardHeader>
                        <CardContent>
                            <Tabs defaultValue="add_single">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="add_single">Add Single</TabsTrigger>
                                    <TabsTrigger value="add_json">Add from JSON</TabsTrigger>
                                </TabsList>
                                <TabsContent value="add_single" className="pt-4">
                                    <Form {...scholarshipQuestionForm}><form onSubmit={scholarshipQuestionForm.handleSubmit(onScholarshipQuestionSubmit)} className="grid gap-4 mb-6">
                                        <FormField control={scholarshipQuestionForm.control} name="text" render={({ field }) => (<FormItem><FormLabel>Question</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={scholarshipQuestionForm.control} name="options.0" render={({ field }) => (<FormItem><FormLabel>Option 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={scholarshipQuestionForm.control} name="options.1" render={({ field }) => (<FormItem><FormLabel>Option 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={scholarshipQuestionForm.control} name="options.2" render={({ field }) => (<FormItem><FormLabel>Option 3</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={scholarshipQuestionForm.control} name="options.3" render={({ field }) => (<FormItem><FormLabel>Option 4</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                        <FormField control={scholarshipQuestionForm.control} name="correctAnswer" render={({ field }) => (<FormItem><FormLabel>Correct Answer</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select the correct option" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {scholarshipQuestionForm.watch('options')?.map((opt, i) => opt && (<SelectItem key={i} value={opt}>Option {i + 1}: {opt}</SelectItem>))}
                                                </SelectContent>
                                            </Select><FormMessage /></FormItem>
                                        )}/>
                                        <Button type="submit" disabled={scholarshipQuestionForm.formState.isSubmitting}><PlusCircle className="mr-2"/>{scholarshipQuestionForm.formState.isSubmitting ? 'Adding...' : 'Add Question'}</Button>
                                    </form></Form>
                                </TabsContent>
                                <TabsContent value="add_json" className="pt-4">
                                    <Form {...jsonQuestionsForm}><form onSubmit={jsonQuestionsForm.handleSubmit(onJsonQuestionsSubmit)} className="grid gap-4">
                                        <FormField control={jsonQuestionsForm.control} name="jsonInput" render={({ field }) => (<FormItem><FormLabel>JSON Input</FormLabel><FormControl><Textarea {...field} rows={10} placeholder='[{"text": "...", "options": ["..."], "correctAnswer": "..."}]' /></FormControl><FormMessage /></FormItem>)}/>
                                        <Button type="submit" disabled={jsonQuestionsForm.formState.isSubmitting}><Upload className="mr-2"/>{jsonQuestionsForm.formState.isSubmitting ? 'Uploading...' : 'Upload from JSON'}</Button>
                                    </form></Form>
                                </TabsContent>
                            </Tabs>

                            <Separator className="my-6" />
                            
                            <h4 className="font-semibold mb-2">Current Questions</h4>
                            <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                                {scholarshipQuestionsLoading && <Skeleton className="h-9 w-full" />}
                                {scholarshipQuestionsCollection?.docs.map((doc, i) => (
                                    <div key={doc.id} className="text-sm p-2 border rounded flex justify-between items-center">
                                        <span>{i+1}. {doc.data().text}</span>
                                        <Button variant="ghost" size="icon" onClick={() => deleteScholarshipQuestion(doc.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                 <Card>
                    <CardHeader><CardTitle>Scholarship Applicants</CardTitle><CardDescription>Review and manage scholarship applications.</CardDescription></CardHeader>
                    <CardContent>
                         <div className="max-h-[1200px] overflow-y-auto">
                            <Table>
                                <TableHeader><TableRow><TableHead>Applicant</TableHead><TableHead>Score</TableHead><TableHead>Status</TableHead><TableHead>Result</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {scholarshipApplicantsLoading && <TableRow><TableCell colSpan={5}><Skeleton className="h-12 w-full"/></TableCell></TableRow>}
                                    {scholarshipApplicantsError && <TableRow><TableCell colSpan={5} className="text-destructive text-center">Error loading applicants.</TableCell></TableRow>}
                                    {scholarshipApplicants?.docs.map(doc => {
                                        const app = doc.data();
                                        return (
                                            <TableRow key={doc.id}>
                                                <TableCell>
                                                    <div className="font-medium">{app.name}</div>
                                                    <div className="text-sm text-muted-foreground">{app.applicationNumber}</div>
                                                    {app.paymentScreenshotDataUrl ? (
                                                        <Link href={app.paymentScreenshotDataUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                                                            View Payment
                                                        </Link>
                                                    ) : null}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{applicantTestScores[doc.id] || 'N/A'}</Badge>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(app.status)}</TableCell>
                                                <TableCell>{getResultBadge(app.resultStatus)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end gap-2">
                                                        <div className="flex gap-2 justify-end">
                                                            <span className="text-xs text-muted-foreground self-center">Payment:</span>
                                                            <Button size="icon" variant={app.status === 'payment_approved' ? 'default' : 'outline'} className="h-8 w-8" onClick={() => handleScholarshipApplicantAction(doc.id, 'status', 'payment_approved')}><ThumbsUp className="h-4 w-4"/></Button>
                                                            <Button size="icon" variant={app.status === 'payment_rejected' ? 'destructive' : 'outline'} className="h-8 w-8" onClick={() => handleScholarshipApplicantAction(doc.id, 'status', 'payment_rejected')}><ThumbsDown className="h-4 w-4"/></Button>
                                                        </div>
                                                        <div className="flex gap-2 justify-end">
                                                            <span className="text-xs text-muted-foreground self-center">Result:</span>
                                                            <Button size="icon" variant={app.resultStatus === 'pass' ? 'default' : 'outline'} className="h-8 w-8" onClick={() => handleScholarshipApplicantAction(doc.id, 'resultStatus', 'pass')}><Check className="h-4 w-4"/></Button>
                                                            <Button size="icon" variant={app.resultStatus === 'fail' ? 'destructive' : 'outline'} className="h-8 w-8" onClick={() => handleScholarshipApplicantAction(doc.id, 'resultStatus', 'fail')}><X className="h-4 w-4"/></Button>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                         </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
         <TabsContent value="rewards">
           <Card>
            <CardHeader><CardTitle>Reward Management</CardTitle><CardDescription>Review redemptions and award points.</CardDescription></CardHeader>
            <CardContent>
               <Tabs defaultValue="redemptions">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="redemptions">Redemption Requests</TabsTrigger>
                    <TabsTrigger value="points">Point Requests</TabsTrigger>
                </TabsList>
                <TabsContent value="redemptions" className="mt-4">
                     <div className="max-h-[600px] overflow-y-auto">
                        <Table>
                        <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Paytm Number</TableHead><TableHead>Points</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {rewardRedemptionsLoading && Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                            ))}
                            {rewardRedemptions?.docs.map((doc) => {
                            const redemption = doc.data();
                            return (
                                <TableRow key={doc.id}>
                                <TableCell>
                                    <div className="font-medium">{redemption.userName}</div>
                                    <div className="text-sm text-muted-foreground">{redemption.userEmail}</div>
                                </TableCell>
                                <TableCell>{redemption.paytmNumber}</TableCell>
                                <TableCell><Badge variant="secondary">{redemption.points} pts</Badge></TableCell>
                                <TableCell>₹{redemption.amount}</TableCell>
                                <TableCell>{redemption.redeemedAt?.toDate()?.toLocaleDateString()}</TableCell>
                                <TableCell><Badge variant={redemption.status === 'pending' ? 'secondary' : 'default'}>{redemption.status}</Badge></TableCell>
                                </TableRow>
                            )
                            })}
                            {!rewardRedemptionsLoading && rewardRedemptions?.empty && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">No redemption requests yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </div>
                </TabsContent>
                 <TabsContent value="points" className="mt-4">
                    <div className="max-h-[600px] overflow-y-auto">
                        <Table>
                        <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {pointRequestsLoading && Array.from({ length: 3 }).map((_, i) => (
                            <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                            ))}
                            {pointRequests?.docs.map((doc) => {
                            const request = doc.data();
                            return (
                                <TableRow key={doc.id}>
                                <TableCell>
                                    <div className="font-medium">{request.userName}</div>
                                    <div className="text-sm text-muted-foreground">{request.userEmail}</div>
                                </TableCell>
                                <TableCell>{request.requestedAt?.toDate()?.toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge variant={request.status === 'pending' ? 'secondary' : 'default'}>
                                        {request.status === 'awarded' ? `Awarded ${request.pointsAwarded} pts` : request.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {request.status === 'pending' && (
                                        <div className="flex items-center justify-end gap-2">
                                            <Input 
                                                type="number" 
                                                className="w-24 h-9" 
                                                placeholder="Points" 
                                                value={pointsToAward[doc.id] || ''}
                                                onChange={(e) => setPointsToAward(prev => ({...prev, [doc.id]: parseInt(e.target.value, 10)}))}
                                            />
                                            <Button size="sm" onClick={() => handleAwardPoints(doc.id, request.userId)}>
                                                <Gift className="mr-2 h-4 w-4"/> Award
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                                </TableRow>
                            )
                            })}
                            {!pointRequestsLoading && pointRequests?.empty && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">No point requests yet.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        </Table>
                    </div>
                 </TabsContent>
               </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <Card>
                <CardHeader>
                    <CardTitle>Homepage Settings</CardTitle>
                    <CardDescription>Manage general application settings.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Splash Screen */}
                    <Form {...splashScreenForm}>
                        <form onSubmit={splashScreenForm.handleSubmit(onSplashScreenSubmit)} className="space-y-4">
                           <FormField control={splashScreenForm.control} name="imageFile" render={({ field: { value, onChange, ...fieldProps } }) => (
                              <FormItem><FormLabel>Splash Screen Image</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...fieldProps} /></FormControl><FormMessage /></FormItem>
                            )}/>
                          <Button type="submit" disabled={splashScreenForm.formState.isSubmitting}>
                            {splashScreenForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Uploading...</> : <><MonitorPlay className="mr-2 h-4 w-4"/>Update Splash Screen</>}
                          </Button>
                        </form>
                      </Form>
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2 text-sm">Current Splash Screen</h4>
                        {splashScreenUrl ? <Image src={splashScreenUrl} alt="Splash Screen" width={150} height={150} className="rounded-md border p-1" /> : <p className="text-xs text-muted-foreground">None uploaded.</p>}
                      </div>
                    <Separator />
                     {/* Homepage Carousel */}
                      <Form {...carouselItemForm}>
                          <form onSubmit={carouselItemForm.handleSubmit(onCarouselItemSubmit)} className="grid gap-4 pt-4">
                              <FormField control={carouselItemForm.control} name="imageFile" render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem><FormLabel>Carousel Image</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...fieldProps} /></FormControl><FormMessage /></FormItem>
                                )}/>
                              <FormField control={carouselItemForm.control} name="internalLink" render={({ field }) => (
                                <FormItem><FormLabel>Link to App Page</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a page to link to" /></SelectTrigger></FormControl><SelectContent>{APP_PAGES.map(page => <SelectItem key={page.value} value={page.value}>{page.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <div className="text-center text-xs text-muted-foreground">OR</div>
                              <FormField control={carouselItemForm.control} name="externalLink" render={({ field }) => (
                                <FormItem><FormLabel>External Link</FormLabel><FormControl><Input placeholder="https://example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                              <Button type="submit" disabled={carouselItemForm.formState.isSubmitting}>{carouselItemForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Adding...</> : <><PlusCircle className="mr-2"/>Add Carousel Item</>}</Button>
                          </form>
                      </Form>
                      <div className="mt-4">
                        <h4 className="font-semibold my-4 text-sm">Current Carousel Items</h4>
                        <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
                            {carouselItemsLoading && <Skeleton className="h-9 w-full" />}
                            {carouselItemsCollection?.docs.map(doc => (
                                <div key={doc.id} className="text-xs p-2 border rounded flex justify-between items-center gap-2">
                                    <Image src={doc.data().imageUrl} alt="Carousel item" width={40} height={20} className="rounded" />
                                    <span className="flex-1 truncate text-blue-500 hover:underline"><a href={doc.data().linkUrl} target="_blank" rel="noopener noreferrer">{doc.data().linkUrl}</a></span>
                                    <Button variant="ghost" size="icon" onClick={() => deleteCarouselItem(doc.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </div>
                            ))}
                        </div>
                      </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Payment &amp; Coupons</CardTitle><CardDescription>Manage QR code and discount coupons.</CardDescription></CardHeader>
                    <CardContent>
                        {/* QR Code */}
                        <Form {...qrCodeForm}>
                            <form onSubmit={qrCodeForm.handleSubmit(onQrCodeSubmit)} className="space-y-4">
                            <FormField control={qrCodeForm.control} name="imageFile" render={({ field: { value, onChange, ...fieldProps } }) => (
                                <FormItem><FormLabel>Payment QR Code</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...fieldProps} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            <Button type="submit" disabled={qrCodeForm.formState.isSubmitting}>{qrCodeForm.formState.isSubmitting ? <><Loader2 className="mr-2"/>Uploading...</> : <><Upload className="mr-2"/>Upload QR Code</>}</Button>
                            </form>
                        </Form>
                         <div className="mt-4">
                            <h4 className="font-semibold mb-2 text-sm">Current QR Code</h4>
                            {qrCodeUrl ? <Image src={qrCodeUrl} alt="Payment QR Code" width={150} height={150} className="rounded-md border p-1" /> : <p className="text-xs text-muted-foreground">None uploaded.</p>}
                        </div>
                        <Separator className="my-6" />
                        {/* Coupons */}
                        <Form {...couponForm}>
                            <form onSubmit={couponForm.handleSubmit(onCouponSubmit)} className="space-y-4">
                                <FormField control={couponForm.control} name="courseId" render={({ field }) => (<FormItem><FormLabel>Select Course</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Choose a course" /></SelectTrigger></FormControl><SelectContent>{coursesCollection?.docs.filter(c => !c.data().isFree).map(doc => (<SelectItem key={doc.id} value={doc.id}>{doc.data().title}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={couponForm.control} name="code" render={({ field }) => (<FormItem><FormLabel>Coupon Code</FormLabel><FormControl><Input placeholder="E.g., SAVE20" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={couponForm.control} name="discountType" render={({ field }) => (<FormItem><FormLabel>Discount Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Choose a discount type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed Amount (₹)</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                <FormField control={couponForm.control} name="discountValue" render={({ field }) => (<FormItem><FormLabel>Discount Value</FormLabel><FormControl><div className="relative"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><span className="text-muted-foreground sm:text-sm">{couponForm.watch('discountType') === 'percentage' ? <Percent size={16} /> : <IndianRupee size={16} />}</span></div><Input type="number" placeholder="e.g., 20 or 100" className="pl-10" {...field} /></div></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={couponForm.control} name="expiryDate" render={({ field }) => (<FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <Button type="submit" className="w-full" disabled={couponForm.formState.isSubmitting}>{couponForm.formState.isSubmitting ? <><Loader2 className="mr-2"/>Creating...</> : <>Create Coupon</>}</Button>
                            </form>
                        </Form>
                        <div className="mt-4">
                            <h4 className="font-semibold my-4 text-sm">Existing Coupons</h4>
                            <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
                                {couponsLoading && <Skeleton className="h-12 w-full" />}
                                {couponsCollection?.docs.map((doc) => {
                                    const coupon = doc.data();
                                    const course = coursesCollection?.docs.find(c => c.id === coupon.courseId)?.data();
                                    return (
                                        <div key={doc.id} className="flex items-center justify-between p-2 border rounded-lg text-xs">
                                            <div>
                                                <p className="font-mono font-bold text-sm">{coupon.code}</p>
                                                <p className="text-muted-foreground">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} off on {course?.title || 'a course'}</p>
                                                <p className="text-muted-foreground">Expires: {coupon.expiryDate?.toDate()?.toLocaleDateString()}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc.ref)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crop Thumbnail</DialogTitle></DialogHeader>
            {imgSrc && (
                <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)}>
                   <img ref={imgRef} src={imgSrc} alt="Crop preview" />
                </ReactCrop>
            )}
           <DialogFooter>
             <Button onClick={handleCrop}>Crop and Save</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
