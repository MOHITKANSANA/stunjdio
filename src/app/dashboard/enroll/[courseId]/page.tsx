
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, IndianRupee, QrCode } from 'lucide-react';
import Image from 'next/image';
import { submitEnrollmentAction } from '@/app/actions/enrollment';

export default function EnrollPage({ params }: { params: { courseId: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [courseDoc, loading, error] = useDocument(doc(firestore, 'courses', params.courseId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading || authLoading) {
    return <div className="max-w-2xl mx-auto p-8"><Skeleton className="h-96 w-full" /></div>;
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
          courseId: params.courseId,
          courseTitle: course.title,
          screenshotDataUrl,
      });

      if (result.success) {
          toast({ title: 'Submitted!', description: 'Your enrollment is pending approval. We will notify you soon.' });
          router.push('/dashboard/courses');
      } else {
          throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: e.message || 'An unknown error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Enroll in: {course.title}</CardTitle>
          <CardDescription>Complete the payment and upload the screenshot to get access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-6 border rounded-lg bg-muted/50 flex flex-col items-center text-center">
            <h3 className="font-bold text-xl mb-2 flex items-center"><IndianRupee className="mr-1 h-5 w-5"/>Pay {course.price}</h3>
            <p className="text-muted-foreground mb-4">Scan the QR code below with any payment app.</p>
            <div className="relative w-52 h-52 bg-gray-200 rounded-lg flex items-center justify-center">
               <Image src="https://picsum.photos/300/300" alt="QR Code" width={208} height={208} data-ai-hint="qr code" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Step 2: Upload Screenshot</h3>
            <div className="flex items-center gap-4">
               <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                   <Upload className="mr-2 h-4 w-4" />
                   Choose Image
               </Button>
               {screenshotFile && <p className="text-sm text-muted-foreground">{screenshotFile.name}</p>}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg"
                />
            </div>
            {previewImage && (
              <div className="mt-4 border p-2 rounded-lg inline-block">
                <Image src={previewImage} alt="Screenshot preview" width={200} height={200} className="rounded-md object-contain" />
              </div>
            )}
          </div>
          
          <Button onClick={handleSubmit} disabled={isSubmitting || !screenshotFile} className="w-full text-lg" size="lg">
            {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Submitting...</> : 'Submit for Verification'}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
