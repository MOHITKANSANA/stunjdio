
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Skeleton } from '@/components/ui/skeleton';

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


export function OnlineTest() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [applicant, setApplicant] = useState<any>(null);
    const [testStarted, setTestStarted] = useState(false);
    const [testSubmitted, setTestSubmitted] = useState(false);

    const [questionsCollection, questionsLoading] = useCollection(
        query(collection(firestore, 'scholarshipTest'), orderBy('createdAt', 'asc'))
    );

    const regForm = useForm<RegFormValues>({ resolver: zodResolver(regSchema) });
    
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
                
                if (questionsCollection) {
                    replace(questionsCollection.docs.map(doc => ({
                        questionId: doc.id,
                        questionText: doc.data().text,
                        selectedOption: undefined
                    })));
                }

                setTestStarted(true);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not verify application number.' });
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

            toast({ title: 'Test Submitted!', description: `You scored ${score} out of ${questionsCollection?.docs.length}.` });
            setTestSubmitted(true);
            
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your test.' });
        } finally {
            setIsLoading(false);
        }
    }

    if (testSubmitted) {
        return (
            <div className="text-center">
                <h3 className="text-xl font-bold">Thank you for taking the test!</h3>
                <p>You can check your result in the "View Result" tab.</p>
            </div>
        )
    }

    if (testStarted && applicant) {
        if (questionsLoading) {
            return <Skeleton className="w-full h-64" />
        }
        
        const testTitle = "Scholarship Test";

        return (
            <div>
                 <CardTitle>{testTitle}</CardTitle>
                 <CardDescription>Welcome, {applicant.name}. Please answer all questions.</CardDescription>
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
                                <FormItem className="space-y-3 p-4 border rounded-lg">
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
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Test
                        </Button>
                    </form>
                 </Form>
            </div>
        )
    }

    return (
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
                    Start Test
                </Button>
            </form>
        </Form>
    )
}

    