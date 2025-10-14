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
import { submitEnrollmentAction } from '@/app/actions/enrollment';

const verificationFormSchema = z.object({
  enrollmentType: z.string().min(1, 'Please select an enrollment type.'),
  itemId: z.string().min(1, 'Please select an item.'),
  couponCode: z.string().optional(),
  referralCode: z.string().optional(),
  screenshotFile: z.instanceof(File, { message: 'A screenshot is required.' }),
});

type VerificationFormValues = z.infer<typeof verificationFormSchema>;

function PaymentVerificationPageContent() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');
  const preselectedTestSeriesId = searchParams.get('testSeriesId');
  const preselectedEbookId = searchParams.get('ebookId');
  const preselectedPaperId = searchParams.get('paperId');


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [couponStatus, setCouponStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [finalPrice, setFinalPrice] = useState<number | null>(null);

  
  const [coursesCollection, coursesLoading] = useCollection(
    query(collection(firestore, 'courses'), where('isFree', '==', false), orderBy('title', 'asc'))
  );
  const [testSeriesCollection, testSeriesLoading] = useCollection(
    query(collection(firestore, 'testSeries'), where('isFree', '==', false), orderBy('title', 'asc'))
  );
  const [ebooksCollection, ebooksLoading] = useCollection(
    query(collection(firestore, 'ebooks'), where('price', '>', 0), orderBy('title', 'asc'))
  );
  const [papersCollection, papersLoading] = useCollection(
    query(collection(firestore, 'previousPapers'), where('price', '>', 0), orderBy('title', 'asc'))
  );

  const [settingsDoc] = useDocumentData(doc(firestore, 'settings', 'appConfig'));
  const qrCodeUrl = settingsDoc?.paymentQrCodeUrl;


  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      enrollmentType: '',
      itemId: '',
      couponCode: '',
      referralCode: '',
    },
  });

  const enrollmentType = form.watch('enrollmentType');
  const selectedItemId = form.watch('itemId');
  const enteredCouponCode = form.watch('couponCode');
  const enteredReferralCode = form.watch('referralCode');

  const getCollectionName = (type: string) => {
      switch (type) {
          case 'Course': return 'courses';
          case 'Test Series': return 'testSeries';
          case 'E-Book': return 'ebooks';
          case 'Previous Year Paper': return 'previousPapers';
          default: return '';
      }
  }
  
  const itemDocRef = selectedItemId && enrollmentType
    ? doc(firestore, getCollectionName(enrollmentType), selectedItemId) 
    : null;

  const [itemData, itemDataLoading] = useDocumentData(itemDocRef);

  useEffect(() => {
    if (itemData) {
        setFinalPrice(itemData.price);
    }
  }, [itemData]);

  useEffect(() => {
    let type = '';
    let id = '';
    if (preselectedCourseId) { type = 'Course'; id = preselectedCourseId; } 
    else if (preselectedTestSeriesId) { type = 'Test Series'; id = preselectedTestSeriesId; }
    else if (preselectedEbookId) { type = 'E-Book'; id = preselectedEbookId; }
    else if (preselectedPaperId) { type = 'Previous Year Paper'; id = preselectedPaperId; }
    
    if (type && id) {
        form.setValue('enrollmentType', type);
        form.setValue('itemId', id);
    }
  }, [preselectedCourseId, preselectedTestSeriesId, preselectedEbookId, preselectedPaperId, form]);

  const handleApplyCoupon = async () => {
    if (!enteredCouponCode || !selectedItemId || !itemData) return;
    setCouponStatus('loading');
    
    try {
        const q = query(
            collection(firestore, 'coupons'),
            where('code', '==', enteredCouponCode.toUpperCase()),
            where('courseId', '==', selectedItemId),
            where('isActive', '==', true)
        );
        const couponSnapshot = await getDocs(q);
        if (couponSnapshot.empty) {
            toast({ variant: 'destructive', title: 'Invalid Coupon' });
            setCouponStatus('invalid');
            setFinalPrice(itemData.price); // Reset price
            return;
        }

        const coupon = couponSnapshot.docs[0].data();
        if (new Date(coupon.expiryDate.toDate()) < new Date()) {
            toast({ variant: 'destructive', title: 'Coupon Expired' });
            setCouponStatus('invalid');
            setFinalPrice(itemData.price);
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
        setFinalPrice(newPrice);
        setCouponStatus('valid');
        toast({ title: 'Coupon Applied!', description: `You saved ₹${discount.toFixed(2)}` });

    } catch (e) {
        toast({ variant: 'destructive', title: 'Error applying coupon' });
        setCouponStatus('invalid');
    }
  };

  const handleApplyReferral = async () => {
    if (!enteredReferralCode || !itemData || !user) return;

    const referralUserQuery = query(collection(firestore, 'users'), where('referralCode', '==', enteredReferralCode.toUpperCase()));
    const referralUserSnapshot = await getDocs(referralUserQuery);

    if (referralUserSnapshot.empty) {
        toast({ variant: 'destructive', title: 'Invalid Referral Code' });
        return;
    }
    
    if (referralUserSnapshot.docs[0].id === user.uid) {
        toast({ variant: 'destructive', title: 'Cannot use your own referral code.' });
        return;
    }

    // Apply 10% discount
    const originalPrice = finalPrice ?? itemData.price;
    const discount = originalPrice * 0.10;
    const newPrice = Math.max(0, originalPrice - discount);
    setFinalPrice(newPrice);
    toast({ title: 'Referral Applied!', description: `You got a 10% discount!` });
  }

  if (authLoading || coursesLoading || testSeriesLoading || ebooksLoading || papersLoading) {
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

  const getEnrollmentTitle = () => {
    return itemData?.title || 'Unknown Item';
  }

  const onSubmit = async (data: VerificationFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Not logged in', description: 'Please log in to submit.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const screenshotDataUrl = await fileToDataUrl(data.screenshotFile);
      
      await submitEnrollmentAction({
          enrollmentType: data.enrollmentType,
          courseId: data.itemId,
          courseTitle: getEnrollmentTitle(),
          screenshotDataUrl,
          couponCode: data.couponCode || null,
          referralCode: data.referralCode || null,
          finalPrice: finalPrice ?? itemData?.price ?? 0,
      }, user);

      toast({ title: 'Submitted!', description: 'Your request is pending approval. We will notify you soon.' });
      router.push('/dashboard');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: e.message || 'An unknown error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderItemSelect = () => {
    let items;
    switch(enrollmentType) {
        case 'Course': items = coursesCollection?.docs; break;
        case 'Test Series': items = testSeriesCollection?.docs; break;
        case 'E-Book': items = ebooksCollection?.docs; break;
        case 'Previous Year Paper': items = papersCollection?.docs; break;
        default: items = [];
    }

    return (
         <FormField
            control={form.control}
            name="itemId"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Select {enrollmentType}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                    <SelectValue placeholder={`Select a ${enrollmentType}`} />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {items?.map(doc => (
                        <SelectItem key={doc.id} value={doc.id}>{doc.data().title}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
    )
  }

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
                          <SelectItem value="Course">Course</SelectItem>
                          <SelectItem value="Test Series">Test Series</SelectItem>
                          <SelectItem value="E-Book">E-Book</SelectItem>
                          <SelectItem value="Previous Year Paper">Previous Year Paper</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {enrollmentType && renderItemSelect()}

                {itemData && (
                    <Card className='bg-muted/50'>
                        <CardContent className='p-4 space-y-4'>
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">Price Details</h4>
                                <p className="font-bold text-xl">₹{finalPrice !== null ? finalPrice.toFixed(2) : (itemData.price || 0).toFixed(2)}</p>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Coupon Code</Label>
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
                            </div>
                             <div className="space-y-2">
                                <Label>Referral Code (Optional)</Label>
                                <div className="flex gap-2">
                                    <FormField
                                        control={form.control}
                                        name="referralCode"
                                        render={({ field }) => (
                                            <FormItem className='flex-grow'>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="Enter referral code" className="pl-10" {...field} />
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                     <Button type="button" onClick={handleApplyReferral} disabled={!enteredReferralCode}>
                                        Apply
                                    </Button>
                                </div>
                            </div>

                            {couponStatus === 'valid' && (
                                <Alert variant="default" className="border-green-500 text-green-700 [&gt;svg]:text-green-700">
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertTitle>Coupon Applied!</AlertTitle>
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
                  <span className="font-semibold">Secure Payment &amp; Verification</span>
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
