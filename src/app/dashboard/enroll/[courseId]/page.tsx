
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { notFound } from 'next/navigation';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, IndianRupee, QrCode, CheckCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { submitEnrollmentAction } from '@/app/actions/enrollment';
import Link from 'next/link';

function EnrollmentForm({ courseId }: { courseId: string }) {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [courseDoc, loading, error] = useDocument(doc(firestore, 'courses', courseId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading || authLoading) {
    return <div className="max-w-4xl mx-auto p-8 grid md:grid-cols-2 gap-8"><Skeleton className="h-96 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (error || !courseDoc?.exists()) {
    notFound();
  }
  
  const course = courseDoc.data();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          toast({ variant: 'destructive', title: 'File too large', description: 'Please upload an image smaller than 2MB.'});
          return;
      }
      setScreenshotFile(file);
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
  }

  const handleSubmit = async () => {
    if (!screenshotFile) {
      toast({ variant: 'destructive', title: 'Screenshot required', description: 'Please upload a screenshot of your payment.' });
      return;
    }
    if (!user) {
        toast({ variant: 'destructive', title: 'Not logged in', description: 'Please log in to enroll.' });
        return;
    }

    setIsSubmitting(true);
    try {
      const screenshotDataUrl = await fileToDataUrl(screenshotFile);
      const result = await submitEnrollmentAction({
          courseId: courseId,
          courseTitle: course.title,
          screenshotDataUrl,
      });

      if (result.success) {
          toast({ title: 'Submitted!', description: 'Your enrollment is pending approval. We will notify you soon.' });
          // Redirect using window.location to ensure a full page reload, which can solve some Next.js caching issues.
          window.location.href = `/dashboard/courses/${courseId}`;
      } else {
          throw new Error(result.error || 'An unknown error occurred.');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: e.message || 'An unknown error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="bg-muted/20 min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" asChild className="mb-4">
            <Link href={`/dashboard/courses/${courseId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course
            </Link>
        </Button>
        <div className="grid md:grid-cols-2 gap-8 items-start">
           <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">Complete Your Enrollment</CardTitle>
                  <CardDescription>You are enrolling in: <span className="font-bold text-primary">{course.title}</span></CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Step 1: Complete Payment</h3>
                    <div className="p-4 border rounded-lg bg-muted/50 flex flex-col items-center text-center">
                      <p className="text-muted-foreground mb-4">Scan the QR code below with any payment app to pay the course fee.</p>
                       <div className="relative w-52 h-52 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                           <Image src="https://i.postimg.cc/VzTgS66F/IMG-20250630-062749.jpg" alt="QR Code" width={208} height={208} data-ai-hint="qr code" />
                        </div>
                    </div>
                  </div>
                  <div>
                     <h3 className="font-semibold text-lg mb-2">Step 2: Upload Screenshot</h3>
                     <CardDescription className="mb-4">After payment, upload the confirmation screenshot here.</CardDescription>
                     
                    <div className="space-y-4">
                        <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                           <Upload className="mr-2 h-4 w-4" />
                           {screenshotFile ? 'Change Image' : 'Choose Image'}
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/png, image/jpeg"
                        />
                         {previewImage && (
                          <div className="mt-4 border p-2 rounded-lg inline-block relative bg-background">
                            <p className="text-xs text-muted-foreground mb-2 text-center">{screenshotFile?.name}</p>
                            <Image src={previewImage} alt="Screenshot preview" width={200} height={200} className="rounded-md object-contain" />
                          </div>
                        )}
                    </div>
                  </div>
                </CardContent>
                 <CardFooter>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !screenshotFile} className="w-full text-lg" size="lg">
                        {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Submitting...</> : 'Submit for Verification'}
                    </Button>
                 </CardFooter>
              </Card>

              <Card className="sticky top-8 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-2xl">
                        <IndianRupee className="h-6 w-6 mr-1" />
                        {course.price ? course.price.toLocaleString() : 'Free'}
                    </CardTitle>
                    <CardDescription>One-time payment for lifetime access</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p>By enrolling, you'll get:</p>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500" /><span>Full access to all course materials</span></li>
                        <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500" /><span>Downloadable resources & PDFs</span></li>
                        <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500" /><span>Access to course community</span></li>
                        <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500" /><span>Certificate of completion</span></li>
                    </ul>
                     <div className="flex items-center gap-3 pt-4 text-green-600">
                        <ShieldCheck className="h-5 w-5" />
                        <span className="font-semibold">Secure Payment & Verification</span>
                     </div>
                  </CardContent>
              </Card>
        </div>
      </div>
    </div>
  );
}

// This is the main page component. It's kept simple to avoid server/client conflicts.
export default function EnrollPage({ params }: { params: { courseId: string } }) {
  const { courseId } = params;
  // It passes the courseId to the client component that handles all the logic.
  return <EnrollmentForm courseId={courseId} />;
}
