'use client';

import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, ArrowRight, ArrowLeft } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, updateDoc, doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDocument } from 'react-firebase-hooks/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

const regSchema = z.object({
    applicationNumber: z.string().length(5, 'Application number must be 5 digits.'),
});
type RegFormValues = z.infer<typeof regSchema>;

const testAnsweringSchema = z.object({
    answers: z.array(z.object({
        questionId: z.string(),
        questionText: z.string(),
        selectedOption: z.string().optional(),
    }))
});
type TestAnsweringValues = z.infer<typeof testAnsweringSchema>;


export function OnlineTest({ settings }: { settings: any }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [applicant, setApplicant] = useState<any>(null);
    const [stage, setStage] = useState<'verify' | 'details' | 'payment' | 'pending_approval' | 'test' | 'submitted'>('verify');
    
    const [questionsDoc, questionsLoading] = useDocument(doc(firestore, 'settings', 'scholarshipTest'));
    const questions = questionsDoc?.data()?.questions;

    const [qrCodeDoc] = useDocument(doc(firestore, 'settings', 'appConfig'));
    const qrCodeUrl = qrCodeDoc?.data()?.paymentQrCodeUrl;

    const regForm = useForm<RegFormValues>({ resolver: zodResolver(regSchema) });
    const answeringForm = useForm<TestAnsweringValues>({ resolver: zodResolver(testAnsweringSchema) });
    const { fields, replace } = useFieldArray({ control: answeringForm.control, name: "answers" });
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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
                setStage('details');
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not verify application number.' });
        } finally {
            setIsLoading(false);
        }
    }

    const startTest = () => {
        if (!applicant) return;

        if (applicant.status === 'test_taken') {
            setStage('submitted');
            return;
        }

        if (settings?.isTestFree) {
            if (questions) replace(questions.map((q: any, i: number) => ({ questionId: `q-${i}`, questionText: q.text, selectedOption: undefined })));
            setStage('test');
            return;
        }

        if (applicant.status === 'payment_approved') {
            if (questions) replace(questions.map((q: any, i: number) => ({ questionId: `q-${i}`, questionText: q.text, selectedOption: undefined })));
            setStage('test');
        } else {
            toast({ variant: 'destructive', title: 'Payment Not Approved', description: 'Your payment for the test fee has not been approved yet. Please wait or contact support.' });
        }
    };


    const onTestSubmit = async (data: TestAnsweringValues) => {
        setIsLoading(true);
        try {
            let score = 0;
            const submittedAnswers = data.answers.map((ans, index) => {
                const question = questions[index];
                const isCorrect = question?.correctAnswer === ans.selectedOption;
                if (isCorrect) score++;
                return { ...ans, isCorrect, correctAnswer: question?.correctAnswer };
            });
            
            await addDoc(collection(firestore, 'scholarshipTestResults'), {
                applicantId: applicant.id,
                applicationNumber: applicant.applicationNumber,
                applicantName: applicant.name,
                score,
                totalQuestions: questions.length,
                answers: submittedAnswers,
                submittedAt: serverTimestamp(),
            });

             await updateDoc(doc(firestore, 'scholarshipApplications', applicant.id), { status: 'test_taken' });

            toast({ title: 'टेस्ट सबमिट हो गया!', description: `आपका टेस्ट सफलतापूर्वक सबमिट हो गया है। परिणाम घोषित होने पर आप अपना रिजल्ट देख सकते हैं।` });
            setStage('submitted');
            
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your test.' });
        } finally {
            setIsLoading(false);
        }
    }

    const goToNextQuestion = () => {
        if (questions && currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const goToPreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };
    
    if (stage === 'submitted') {
        return (
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-green-600">टेस्ट सफलतापूर्वक सबमिट हुआ!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center p-4 text-muted-foreground">परिणाम घोषणा की तारीख के बाद आप "View Result" टैब में अपना परिणाम देख सकते हैं। आपके भविष्य के लिए शुभकामनाएँ!</p>
                </CardContent>
            </Card>
        )
    }

    if (stage === 'test' && applicant) {
        if (questionsLoading || !questions) return <Skeleton className="w-full h-64" />
        
        const currentQuestion = questions[currentQuestionIndex];
        const isLastQuestion = currentQuestionIndex === questions.length - 1;
        const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
        
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{questionsDoc?.data()?.title || 'Scholarship Test'}</CardTitle>
                     <div className="pt-4">
                        <Progress value={progress} />
                        <p className="text-sm text-muted-foreground text-center mt-2">Question {currentQuestionIndex + 1} of {questions.length}</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...answeringForm}>
                        <form onSubmit={answeringForm.handleSubmit(onTestSubmit)} className="space-y-8 mt-6">
                            <FormField
                              control={answeringForm.control}
                              name={`answers.${currentQuestionIndex}.selectedOption`}
                              render={({ field }) => (
                                <FormItem className="space-y-3 p-4 border rounded-lg bg-muted/30 min-h-[250px]">
                                  <FormLabel className="font-semibold text-base">{currentQuestionIndex + 1}. {currentQuestion.text}</FormLabel>
                                  <FormControl>
                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-1">
                                      {currentQuestion.options.map((option: string, optionIndex: number) => (
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
                            
                            <div className="flex justify-between items-center">
                                <Button type="button" variant="outline" onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0}>
                                    <ArrowLeft className="mr-2"/> Previous
                                </Button>
                                
                                {isLastQuestion ? (
                                    <Button type="submit" disabled={isLoading}>
                                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Finish & Submit Test
                                    </Button>
                                ) : (
                                    <Button type="button" onClick={goToNextQuestion}>
                                        Next <ArrowRight className="ml-2"/>
                                    </Button>
                                )}
                             </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        )
    }

    if(stage === 'details' && applicant) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Confirm Your Details</CardTitle>
                    <CardDescription>Please confirm your details before starting the test.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p><strong>Application Number:</strong> {applicant.applicationNumber}</p>
                    <p><strong>Name:</strong> {applicant.name}</p>
                    <p><strong>Email:</strong> {applicant.email}</p>
                </CardContent>
                <CardFooter className="flex justify-between">
                     <Button variant="outline" onClick={() => setStage('verify')}>Back</Button>
                     <Button onClick={startTest}>Take Test</Button>
                </CardFooter>
            </Card>
        )
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Start Your Online Test</CardTitle>
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
