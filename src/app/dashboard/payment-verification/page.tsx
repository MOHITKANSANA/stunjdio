
'use client';

import { useState, useRef, type ChangeEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Banknote, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { addDoc, collection, serverTimestamp, query, orderBy, getDocs, where, doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Skeleton } from '@/components/ui/skeleton';

const verificationFormSchema = z.object({
  enrollmentType: z.string().min(1, 'Please select an enrollment type.'),
  courseId: z.string().optional(),
  screenshotFile: z.instanceof(File, { message: 'A screenshot is required.' }),
}).refine(data => {
    if (data.enrollmentType === 'Course Enrollment' && !data.courseId) {
        return false;
    }
    return true;
}, {
    message: 'Please select a course.',
    path: ['courseId'],
});

type VerificationFormValues = z.infer<typeof verificationFormSchema>;

function PaymentVerificationPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [coursesCollection, coursesLoading, coursesError] = useCollection(
    query(collection(firestore, 'courses'), orderBy('title', 'asc'))
  );
  const [qrCodeDoc] = useCollection(collection(firestore, 'settings'));
  const qrCodeUrl = qrCodeDoc?.docs.find(d => d.id === 'paymentQrCode')?.data().url;


  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      enrollmentType: preselectedCourseId ? 'Course Enrollment' : '',
      courseId: preselectedCourseId || '',
      screenshotFile: undefined,
    },
  });

  const enrollmentType = form.watch('enrollmentType');

  useEffect(() => {
    if (preselectedCourseId) {
      form.setValue('enrollmentType', 'Course Enrollment');
      form.setValue('courseId', preselectedCourseId);
    }
  }, [preselectedCourseId, form]);


  if (authLoading || coursesLoading) {
    return (
      <div className="max-w-xl mx-auto p-4 md:p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: 'destructive', title: 'File too large', description: 'Please upload an image smaller than 2MB.' });
        return;
      }
      form.setValue('screenshotFile', file, { shouldValidate: true });
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const getEnrollmentTitle = (data: VerificationFormValues) => {
    if (data.enrollmentType === 'Course Enrollment') {
        const selectedCourse = coursesCollection?.docs.find(doc => doc.id === data.courseId);
        return selectedCourse?.data().title || 'Unknown Course';
    }
    return data.enrollmentType;
  }

  const onSubmit = async (data: VerificationFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not logged in', description: 'Please log in to submit.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const screenshotDataUrl = await fileToDataUrl(data.screenshotFile);
      
      await addDoc(collection(firestore, 'enrollments'), {
          enrollmentType: data.enrollmentType,
          courseId: data.courseId || null,
          courseTitle: getEnrollmentTitle(data),
          screenshotDataUrl,
          userId: user.uid,
          userEmail: user.email,
          userDisplayName: user.displayName,
          status: 'pending',
          createdAt: serverTimestamp(),
        });

      toast({ title: 'Submitted!', description: 'Your request is pending approval. We will notify you soon.' });
      router.push('/dashboard');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: e.message || 'An unknown error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-muted/20 min-h-screen p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <Card className="shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <div className="flex items-center gap-3">
                    <Banknote className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle className="text-2xl font-headline">Payment Verification</CardTitle>
                        <CardDescription>Submit your payment details for verification.</CardDescription>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="enrollmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What are you paying for?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Full App Upgrade">Full App Upgrade</SelectItem>
                          <SelectItem value="Course Enrollment">Course Enrollment</SelectItem>
                          <SelectItem value="Test Series">Test Series</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {enrollmentType === 'Course Enrollment' && (
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Course</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {coursesError && <p className='p-2 text-xs text-destructive'>Could not load courses.</p>}
                            {coursesCollection?.docs.map(doc => (
                                <SelectItem key={doc.id} value={doc.id}>{doc.data().title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                    control={form.control}
                    name="screenshotFile"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Upload Payment Screenshot</FormLabel>
                             <FormControl>
                                <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                   <Upload className="mr-2 h-4 w-4" />
                                   {previewImage ? 'Change Image' : 'Choose Image'}
                                </Button>
                             </FormControl>
                             <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/png, image/jpeg"
                            />
                            {previewImage && (
                              <div className="mt-4 border p-2 rounded-lg inline-block relative bg-background">
                                <p className="text-xs text-muted-foreground mb-2 text-center">{field.value?.name}</p>
                                <Image src={previewImage} alt="Screenshot preview" width={200} height={200} className="rounded-md object-contain" />
                              </div>
                            )}
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="p-4 border rounded-lg bg-muted/50 flex flex-col items-center text-center">
                  <p className="text-muted-foreground mb-4">You can scan the QR code below with any payment app.</p>
                  <div className="relative w-52 h-52 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {qrCodeUrl ? (
                         <Image src={qrCodeUrl} alt="QR Code" width={208} height={208} data-ai-hint="qr code" />
                    ) : (
                         <Skeleton className="w-full h-full" />
                    )}
                  </div>
                </div>

              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" disabled={isSubmitting} className="w-full text-lg" size="lg">
                  {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Submitting...</> : 'Submit for Verification'}
                </Button>
                <div className="flex items-center gap-3 pt-2 text-green-600 text-sm">
                  <ShieldCheck className="h-5 w-5" />
                  <span className="font-semibold">Secure Payment & Verification</span>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentVerificationPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
            <PaymentVerificationPageContent />
        </Suspense>
    )
}

    