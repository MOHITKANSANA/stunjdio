
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const scrutinySchema = z.object({
    applicationNumber: z.string().length(5, 'Application number must be 5 digits.'),
});
type ScrutinyFormValues = z.infer<typeof scrutinySchema>;

export function ScrutinyForm() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const form = useForm<ScrutinyFormValues>({ 
        resolver: zodResolver(scrutinySchema),
        defaultValues: {
            applicationNumber: '',
        }
    });

    const onSubmit = async (data: ScrutinyFormValues) => {
        setIsLoading(true);
        setResult(null);
        try {
            const q = query(
                collection(firestore, 'scholarshipTestResults'),
                where('applicationNumber', '==', data.applicationNumber)
            );
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                toast({ variant: 'destructive', title: 'Not Found', description: 'No test result found for this application number. Cannot submit scrutiny.' });
                setIsLoading(false);
                return;
            }

            const resultDoc = querySnapshot.docs[0];
            setResult(resultDoc.data());

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch your test answers.' });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Answer Sheet Scrutiny</CardTitle>
                <CardDescription>Enter your application number to review your submitted answers.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="applicationNumber" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Application Number</FormLabel>
                                <FormControl><Input placeholder="e.g. 12345" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            View My Answers
                        </Button>
                    </form>
                </Form>

                {result && (
                    <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-bold">Your Submitted Answers</h3>
                        {result.answers.map((answer: any, index: number) => (
                            <div key={index} className={`p-4 rounded-lg border ${answer.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                                <p className="font-semibold">{index + 1}. {answer.questionText}</p>
                                <p className="text-sm">Your answer: <span className="font-medium">{answer.selectedOption || "Not Answered"}</span></p>
                                {!answer.isCorrect && (
                                     <p className="text-sm">Correct answer: <span className="font-medium text-green-700">{answer.correctAnswer}</span></p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

            </CardContent>
        </Card>
    )
}
