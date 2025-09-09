
'use client';

import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

const regSchema = z.object({
    applicationNumber: z.string().length(5, 'Application number must be 5 digits.'),
});
type RegFormValues = z.infer<typeof regSchema>;

const paymentSchema = z.object({
    paymentScreenshot: z.instanceof(File, { message: 'Screenshot is required.' }).refine(file => file.size < 2 * 1024 * 1024, 'Image must be less than 2MB.'),
});
type PaymentFormValues = z.infer<typeof paymentSchema>;

const testAnsweringSchema = z.object({
    answers: z.array(z.object({
        questionId: z.string(),
        questionText: z.string(),
        selectedOption: z.string().optional(),
    }))
});
type TestAnsweringValues = z.infer<typeof testAnsweringSchema>;

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
};

export function OnlineTest() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [applicant, setApplicant] = useState<any>(null);
    const [stage, setStage] = useState<'verify' | 'payment' | 'pending_approval' | 'test' | 'submitted'>('verify');
    
    const [questionsCollection, questionsLoading] = useCollection(
        query(collection(firestore, 'scholarshipTest'), orderBy('createdAt', 'asc'))
    );
     const [qrCodeDoc, qrCodeLoading] = useCollection(collection(firestore, 'settings'));
     const qrCodeUrl = qrCodeDoc?.docs.find(d => d.id === 'paymentQrCode')?.data().url;

    const regForm = useForm<RegFormValues>({ resolver: zodResolver(regSchema) });
    const paymentForm = useForm<PaymentFormValues>({ resolver: zodResolver(paymentSchema) });
    const answeringForm = useForm<TestAnsweringValues>({
        resolver: zodResolver(testAnsweringSchema),
    });

    const { fields, replace } = useFieldArray({
        control: answeringForm.control,
        name: "answers",
    });

    const onVerify = async (data: RegFormValues) => {
        setIsLoading(true);
        try {
            const q = query(collection(firestore, 'scholarshipApplications'), where('applicationNumber', '==', data.applicationNumber));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                toast({ variant: 'destructive', title: 'Not Found', description: 'This application number does not exist.' });
                setApplicant(null);
            } else {
                const applicantData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
                setApplicant(applicantData);
                
                if (applicantData.status === 'test_taken') {
                    setStage('submitted');
                } else if (applicantData.status === 'payment_approved') {
                    if (questionsCollection) {
                        replace(questionsCollection.docs.map(doc => ({
                            questionId: doc.id,
                            questionText: doc.data().text,
                            selectedOption: undefined
                        })));
                    }
                    setStage('test');
                } else if (applicantData.status === 'payment_pending') {
                    setStage('pending_approval');
                } else if (applicantData.status === 'payment_rejected') {
                    toast({ variant: 'destructive', title: 'Payment Rejected', description: 'Your previous payment was rejected. Please re-upload a valid screenshot.' });
                    setStage('payment'); 
                } else {
                    setStage('payment');
                }
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not verify application number.' });
        } finally {
            setIsLoading(false);
        }
    }

    const onPaymentSubmit = async (data: PaymentFormValues) => {
        setIsLoading(true);
        try {
            const storage = getStorage();
            const screenshotRef = ref(storage, `scholarship_payments/${applicant.id}-${Date.now()}`);
            const dataUrl = await fileToDataUrl(data.paymentScreenshot);
            const uploadResult = await uploadString(screenshotRef, dataUrl, 'data_url');
            const downloadUrl = await getDownloadURL(uploadResult.ref);

            await updateDoc(doc(firestore, 'scholarshipApplications', applicant.id), {
                paymentScreenshotUrl: downloadUrl,
                status: 'payment_pending',
            });
            setStage('pending_approval');
            toast({ title: 'Screenshot Uploaded!', description: 'Your payment is pending approval.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not upload screenshot.' });
        } finally {
            setIsLoading(false);
        }
    }

    const onTestSubmit = async (data: TestAnsweringValues) => {
        setIsLoading(true);
        try {
            let score = 0;
            const submittedAnswers = data.answers.map(ans => {
                const question = questionsCollection?.docs.find(q => q.id === ans.questionId)?.data();
                const isCorrect = question?.correctAnswer === ans.selectedOption;
                if (isCorrect) score++;
                return { ...ans, isCorrect, correctAnswer: question?.correctAnswer };
            });
            
            await addDoc(collection(firestore, 'scholarshipTestResults'), {
                applicantId: applicant.id,
                applicationNumber: applicant.applicationNumber,
                applicantName: applicant.name,
                score,
                totalQuestions: questionsCollection?.docs.length,
                answers: submittedAnswers,
                submittedAt: serverTimestamp(),
            });

             await updateDoc(doc(firestore, 'scholarshipApplications', applicant.id), { status: 'test_taken' });

            toast({ title: 'Test Submitted!', description: `Thank you for completing the test.` });
            setStage('submitted');
            
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your test.' });
        } finally {
            setIsLoading(false);
        }
    }
    
    if (stage === 'submitted') {
        return (
            <Card>
                <CardHeader><CardTitle>Test Submitted</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-center p-4">Thank you for taking the test! You can check your result in the "View Result" tab after the result declaration date.</p>
                </CardContent>
            </Card>
        )
    }
    
    if (stage === 'pending_approval') {
        return (
            <Card>
                <CardHeader><CardTitle>Payment Pending Approval</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-center p-4">Your payment screenshot has been submitted. Please wait for an admin to approve it. You can check back later to take the test.</p>
                </CardContent>
            </Card>
        )
    }

    if (stage === 'test' && applicant) {
        if (questionsLoading) return <Skeleton className="w-full h-64" />
        
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Scholarship Test</CardTitle>
                    <CardDescription>Welcome, <span className="font-bold">{applicant.name}</span>. Please answer all questions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...answeringForm}>
                        <form onSubmit={answeringForm.handleSubmit(onTestSubmit)} className="space-y-8 mt-6">
                            {fields.map((field, index) => {
                                const question = questionsCollection?.docs[index]?.data();
                                if (!question) return null;
                                return (
                                <FormField
                                    key={field.id}
                                    control={answeringForm.control}
                                    name={`answers.${index}.selectedOption`}
                                    render={({ field }) => (
                                    <FormItem className="space-y-3 p-4 border rounded-lg bg-muted/30">
                                        <FormLabel className="font-semibold text-base">{index + 1}. {question.text}</FormLabel>
                                        <FormControl>
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                            {question.options.map((option: string, optionIndex: number) => (
                                                <FormItem key={optionIndex} className="flex items-center space-x-3 space-y-0">
                                                <FormControl><RadioGroupItem value={option} /></FormControl>
                                                <FormLabel className="font-normal">{option}</FormLabel>
                                                </FormItem>
                                            ))}
                                        </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            )})}
                            <div className="flex justify-between items-center">
                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Finish & Submit Test
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        )
    }

    if (stage === 'payment' && applicant) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Step 2: Payment Verification</CardTitle>
                    <CardDescription>Welcome, <span className="font-bold">{applicant.name}</span>. Please complete the payment to proceed to the test.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...paymentForm}>
                        <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
                            <div className="p-4 border rounded-lg bg-muted/50 flex flex-col items-center text-center">
                                <p className="text-muted-foreground mb-4">Scan the QR code to pay the test fee.</p>
                                {qrCodeLoading ? (
                                     <Skeleton className="w-52 h-52" />
                                ) : qrCodeUrl ? (
                                    <Image src={qrCodeUrl} alt="QR Code" width={208} height={208} data-ai-hint="qr code" />
                                ) : (
                                    <p>QR Code not available.</p>
                                )}
                            </div>
                            <FormField
                                control={paymentForm.control}
                                name="paymentScreenshot"
                                render={({ field: { onChange, value, ...rest } }) => (
                                    <FormItem>
                                        <FormLabel>Upload Payment Screenshot</FormLabel>
                                        <FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...rest} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading} className="w-full">
                                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Submitting Screenshot...</> : <><Upload className="mr-2 h-4 w-4"/>Submit for Approval</>}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        )
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Take the Online Test</CardTitle>
                <CardDescription>Enter your 5-digit application number to begin.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...regForm}>
                    <form onSubmit={regForm.handleSubmit(onVerify)} className="space-y-4">
                        <FormField control={regForm.control} name="applicationNumber" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Application Number</FormLabel>
                                <FormControl><Input placeholder="e.g. 12345" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify & Proceed
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
       
    )
}
