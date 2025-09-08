
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

const scrutinySchema = z.object({
    applicationNumber: z.string().length(5, 'Application number must be 5 digits.'),
    reason: z.string().min(10, 'Please provide a detailed reason for the review.').max(500, 'Reason cannot exceed 500 characters.'),
});
type ScrutinyFormValues = z.infer<typeof scrutinySchema>;

export function ScrutinyForm() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<ScrutinyFormValues>({ resolver: zodResolver(scrutinySchema) });

    const onSubmit = async (data: ScrutinyFormValues) => {
        setIsLoading(true);
        try {
            // First, verify the application number and that a test was submitted
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

            await addDoc(collection(firestore, 'scrutinyRequests'), {
                ...data,
                testResultId: resultDoc.id,
                applicantId: resultDoc.data().applicantId,
                status: 'pending',
                requestedAt: serverTimestamp(),
            });

            toast({ title: 'Request Submitted!', description: 'Your scrutiny request has been received and will be reviewed.' });
            form.reset();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit your request.' });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="applicationNumber" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Application Number</FormLabel>
                        <FormControl><Input placeholder="e.g. 12345" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="reason" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Reason for Review</FormLabel>
                        <FormControl><Textarea placeholder="Explain why you think there was an error..." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Request
                </Button>
            </form>
        </Form>
    )
}

    