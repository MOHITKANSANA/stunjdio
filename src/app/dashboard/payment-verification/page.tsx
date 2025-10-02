

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
import { Loader2, Upload, Banknote, ShieldCheck, Tag, Ticket, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { addDoc, collection, serverTimestamp, query, orderBy, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const verificationFormSchema = z.object({
  enrollmentType: z.string().min(1, 'Please select an enrollment type.'),
  courseId: z.string().optional(), // Can be for a course or a test series
  couponCode: z.string().optional(),
  screenshotFile: z.instanceof(File, { message: 'A screenshot is required.' }),
}).refine(data => {
    if (data.enrollmentType === 'Course Enrollment' && !data.courseId) {
        return false;
    }
    if (data.enrollmentType === 'Test Series' && !data.courseId) {
        return false;
    }
    return true;
}, {
    message: 'Please select an item.',
    path: ['courseId'],
});

type VerificationFormValues = z.infer<typeof verificationFormSchema>;

function PaymentVerificationPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');
  const preselectedTestSeriesId = searchParams.get('testSeriesId');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [couponStatus, setCouponStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [discountInfo, setDiscountInfo] = useState<{ originalPrice: number, discount: number, newPrice: number } | null>(null);
  
  const [coursesCollection, coursesLoading] = useCollection(
    query(collection(firestore, 'courses'), where('isFree', '==', false), orderBy('title', 'asc'))
  );
  const [testSeriesCollection, testSeriesLoading] = useCollection(
    query(collection(firestore, 'testSeries'), where('isFree', '==', false), orderBy('title', 'asc'))
  );

  const [qrCodeDoc] = useCollection(collection(firestore, 'settings'));
  const qrCodeUrl = qrCodeDoc?.docs.find(d => d.id === 'paymentQrCode')?.data().url;


  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      enrollmentType: preselectedCourseId ? 'Course Enrollment' : (preselectedTestSeriesId ? 'Test Series' : ''),
      courseId: preselectedCourseId || preselectedTestSeriesId || '',
      couponCode: '',
      screenshotFile: undefined,
    },
  });

  const enrollmentType = form.watch('enrollmentType');
  const selectedItemId = form.watch('courseId');
  const enteredCouponCode = form.watch('couponCode');
  
  const itemDocRef = selectedItemId && enrollmentType
    ? doc(firestore, enrollmentType === 'Course Enrollment' ? 'courses' : 'testSeries', selectedItemId) 
    : null;

  const [itemData, itemDataLoading] = useDocumentData(itemDocRef);


  useEffect(() => {
    if (preselectedCourseId) {
      form.setValue('enrollmentType', 'Course Enrollment');
      form.setValue('courseId', preselectedCourseId);
    }
     if (preselectedTestSeriesId) {
      form.setValue('enrollmentType', 'Test Series');
      form.setValue('courseId', preselectedTestSeriesId);
    }
  }, [preselectedCourseId, preselectedTestSeriesId, form]);

  const handleApplyCoupon = async () => {
    if (!enteredCouponCode || !selectedItemId || !itemData) return;
    setCouponStatus('loading');
    setDiscountInfo(null);
    try {
        const q = query(
            collection(firestore, 'coupons'),
            where('code', '==', enteredCouponCode.toUpperCase()),
            where('courseId', '==', selectedItemId), // Assuming coupons are tied to courses/tests by ID
            where('isActive', '==', true)
        );
        const couponSnapshot = await getDocs(q);
        if (couponSnapshot.empty) {
            toast({ variant: 'destructive', title: 'Invalid Coupon' });
            setCouponStatus('invalid');
            return;
        }

        const coupon = couponSnapshot.docs[0].data();
        if (new Date(coupon.expiryDate.toDate()) < new Date()) {
            toast({ variant: 'destructive', title: 'Coupon Expired' });
            setCouponStatus('invalid');
            return;
        }
        
        const originalPrice = itemData.price;
        let discount = 0;

        if (coupon.discountType === 'percentage') {
            discount = (originalPrice * coupon.discountValue) / 100;
        } else {
            discount = coupon.discountValue;
        }

        const newPrice = Math.max(0, originalPrice - discount);
        setDiscountInfo({ originalPrice, discount, newPrice });
        setCouponStatus('valid');
        toast({ title: 'Coupon Applied!', description: `You saved ₹${discount.toFixed(2)}` });

    } catch (e) {
        toast({ variant: 'destructive', title: 'Error applying coupon' });
        setCouponStatus('invalid');
    }
  };

  if (authLoading || coursesLoading || testSeriesLoading) {
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
    let collection;
    if (data.enrollmentType === 'Course Enrollment') {
        collection = coursesCollection;
    } else if (data.enrollmentType === 'Test Series') {
        collection = testSeriesCollection;
    }
    const selectedItem = collection?.docs.find(doc => doc.id === data.courseId);
    return selectedItem?.data().title || 'Unknown Item';
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
          couponCode: data.couponCode || null,
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
                 {enrollmentType === 'Test Series' && (
                    <FormField
                      control={form.control}
                      name="courseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Test Series</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a test series" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {testSeriesCollection?.docs.map(doc => (
                                  <SelectItem key={doc.id} value={doc.id}>{doc.data().title}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                )}

                {itemData && (
                    <Card className='bg-muted/50'>
                        <CardContent className='p-4 space-y-3'>
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">Price Details</h4>
                                <p className="font-bold text-xl">₹{discountInfo ? discountInfo.newPrice.toFixed(2) : (itemData.price || 0).toFixed(2)}</p>
                            </div>
                            {discountInfo && (
                                <>
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span>Original Price</span>
                                        <span className='line-through'>₹{discountInfo.originalPrice.toFixed(2)}</span>
                                    </div>
                                     <div className="flex justify-between items-center text-sm text-green-600 font-medium">
                                        <span>Discount</span>
                                        <span>- ₹{discountInfo.discount.toFixed(2)}</span>
                                    </div>
                                </>
                            )}
                             <div className="flex gap-2">
                                <FormField
                                    control={form.control}
                                    name="couponCode"
                                    render={({ field }) => (
                                        <FormItem className='flex-grow'>
                                            <FormControl>
                                                <div className="relative">
                                                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input placeholder="Enter coupon code" className="pl-10" {...field} />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <Button type="button" onClick={handleApplyCoupon} disabled={!enteredCouponCode || couponStatus === 'loading'}>
                                    {couponStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Apply'}
                                </Button>
                            </div>
                            {couponStatus === 'valid' && (
                                <Alert variant="default" className="border-green-500 text-green-700 [&>svg]:text-green-700">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>Coupon Applied!</AlertTitle>
                                    <AlertDescription>Your discount has been applied to the total price.</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
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

    
