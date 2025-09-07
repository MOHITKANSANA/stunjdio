
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
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const resultSchema = z.object({
    registrationNumber: z.string().startsWith('SCHOLAR', 'Invalid registration number.'),
});
type ResultFormValues = z.infer<typeof resultSchema>;

export function ViewResult() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const form = useForm<ResultFormValues>({ resolver: zodResolver(resultSchema) });

    const onCheckResult = async (data: ResultFormValues) => {
        setIsLoading(true);
        setResult(null);
        try {
            const q = query(
                collection(firestore, 'scholarshipTestResults'), 
                where('registrationNumber', '==', data.registrationNumber),
                orderBy('submittedAt', 'desc'),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                toast({ variant: 'destructive', title: 'Not Found', description: 'No test result found for this registration number.' });
            } else {
                setResult(querySnapshot.docs[0].data());
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch result.' });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onCheckResult)} className="space-y-4">
                    <FormField control={form.control} name="registrationNumber" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Registration Number</FormLabel>
                            <FormControl><Input placeholder="SCHOLAR..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Check Result
                    </Button>
                </form>
            </Form>

            {result && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Your Test Result</CardTitle>
                        <CardDescription>Registration No: {result.registrationNumber}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">
                            Score: {result.score} / {result.totalQuestions}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
