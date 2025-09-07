
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
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';

// Demo test data
const demoTest = {
    id: 'DEMO01',
    title: 'General Knowledge Scholarship Test',
    questions: [
        { id: 'Q1', text: 'What is the capital of India?', options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'], correctAnswer: 'New Delhi' },
        { id: 'Q2', text: 'Which planet is known as the Red Planet?', options: ['Earth', 'Mars', 'Jupiter', 'Venus'], correctAnswer: 'Mars' },
        { id: 'Q3', text: 'Who wrote the Indian National Anthem?', options: ['Bankim Chandra Chatterjee', 'Rabindranath Tagore', 'Sarojini Naidu', 'Swami Vivekananda'], correctAnswer: 'Rabindranath Tagore' },
    ]
};

const regSchema = z.object({
    registrationNumber: z.string().startsWith('SCHOLAR', 'Invalid registration number.'),
});
type RegFormValues = z.infer<typeof regSchema>;

const testAnsweringSchema = z.object({
    answers: z.array(z.object({
        questionId: z.string(),
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

    const regForm = useForm<RegFormValues>({ resolver: zodResolver(regSchema) });
    const answeringForm = useForm<TestAnsweringValues>({
        resolver: zodResolver(testAnsweringSchema),
        defaultValues: {
            answers: demoTest.questions.map(q => ({ questionId: q.id, selectedOption: undefined }))
        }
    });

    const { fields } = useFieldArray({
        control: answeringForm.control,
        name: "answers",
    });
    
    const onVerify = async (data: RegFormValues) => {
        setIsLoading(true);
        try {
            const q = query(collection(firestore, 'scholarshipApplications'), where('registrationNumber', '==', data.registrationNumber));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                toast({ variant: 'destructive', title: 'Not Found', description: 'This registration number does not exist.' });
                setApplicant(null);
            } else {
                setApplicant({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
                setTestStarted(true);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not verify registration.' });
        } finally {
            setIsLoading(false);
        }
    }

    const onTestSubmit = async (data: TestAnsweringValues) => {
        setIsLoading(true);
        try {
            let score = 0;
            const submittedAnswers = data.answers.map(ans => {
                const question = demoTest.questions.find(q => q.id === ans.questionId);
                const isCorrect = question?.correctAnswer === ans.selectedOption;
                if (isCorrect) score++;
                return { ...ans, isCorrect };
            });
            
            await addDoc(collection(firestore, 'scholarshipTestResults'), {
                applicantId: applicant.id,
                registrationNumber: applicant.registrationNumber,
                testId: demoTest.id,
                score,
                totalQuestions: demoTest.questions.length,
                answers: submittedAnswers,
                submittedAt: serverTimestamp(),
            });

            toast({ title: 'Test Submitted!', description: `You scored ${score} out of ${demoTest.questions.length}.` });
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
        return (
            <div>
                 <CardTitle>{demoTest.title}</CardTitle>
                 <CardDescription>Welcome, {applicant.name}. Please answer all questions.</CardDescription>
                 <Form {...answeringForm}>
                    <form onSubmit={answeringForm.handleSubmit(onTestSubmit)} className="space-y-8 mt-6">
                        {fields.map((field, index) => (
                             <FormField
                                key={field.id}
                                control={answeringForm.control}
                                name={`answers.${index}.selectedOption`}
                                render={({ field }) => (
                                <FormItem className="space-y-3 p-4 border rounded-lg">
                                    <FormLabel className="font-semibold text-base">{index + 1}. {demoTest.questions[index].text}</FormLabel>
                                    <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                        {demoTest.questions[index].options.map((option, optionIndex) => (
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
                        ))}
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
                <FormField control={regForm.control} name="registrationNumber" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl><Input placeholder="SCHOLAR..." {...field} /></FormControl>
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
