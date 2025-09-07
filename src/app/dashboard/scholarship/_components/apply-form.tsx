
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

const applySchema = z.object({
    name: z.string().min(2, 'Name is required.'),
    email: z.string().email(),
    phone: z.string().min(10, 'Enter a valid phone number.'),
    address: z.string().min(5, 'Address is required.'),
});

type ApplyFormValues = z.infer<typeof applySchema>;

export function ApplyForm() {
    const { toast } = useToast();
    const { user } = useAuth();
    
    const form = useForm<ApplyFormValues>({
        resolver: zodResolver(applySchema),
        defaultValues: {
            name: user?.displayName || '',
            email: user?.email || '',
            phone: '',
            address: '',
        }
    });

    const onSubmit = async (data: ApplyFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }
        try {
            const registrationNumber = `SCHOLAR${Date.now()}`;
            await addDoc(collection(firestore, 'scholarshipApplications'), {
                ...data,
                userId: user.uid,
                registrationNumber,
                status: 'applied',
                appliedAt: serverTimestamp(),
            });
            toast({
                title: 'Application Submitted!',
                description: `Your registration number is ${registrationNumber}. Please save it for the test.`
            });
            form.reset();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit application.' });
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input type="tel" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Full Address</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Application
                </Button>
            </form>
        </Form>
    )
}
