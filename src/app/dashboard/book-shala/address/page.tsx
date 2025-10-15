'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { statesAndDistricts } from '@/lib/states-districts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';


const addressSchema = z.object({
    name: z.string().min(2, 'Please enter your full name.'),
    phone: z.string().min(10, 'Please enter a valid 10-digit phone number.').max(15),
    address: z.string().min(10, 'Please enter your full address (house/flat no, building, street, area).'),
    city: z.string().min(2, 'Please enter your city.'),
    state: z.string().min(2, 'Please select your state.'),
    postalCode: z.string().min(6, 'Please enter a valid 6-digit postal code.').max(6),
});

type AddressFormValues = z.infer<typeof addressSchema>;

function AddressPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const bookId = searchParams.get('bookId');

    const [bookDoc, bookLoading] = useDocumentData(bookId ? doc(firestore, 'bookShala', bookId) : null);
    
    const form = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            name: user?.displayName || '',
            phone: '',
            address: '',
            city: '',
            state: '',
            postalCode: '',
        },
    });

    const selectedState = form.watch("state");

    const onSubmit = (data: AddressFormValues) => {
        const params = new URLSearchParams();
        params.set('bookId', bookId || '');
        params.set('name', data.name);
        params.set('phone', data.phone);
        params.set('line1', data.address);
        params.set('city', data.city);
        params.set('state', data.state);
        params.set('postalCode', data.postalCode);
        router.push(`/dashboard/payment-verification?${params.toString()}`);
    };

    if (authLoading || bookLoading) {
        return <Skeleton className="h-96 w-full max-w-lg mx-auto" />
    }

    return (
        <div className="max-w-lg mx-auto p-4 md:p-8">
            <Card>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Delivery Details</CardTitle>
                            <CardDescription>Enter your address to proceed with the order for <span className="font-bold text-primary">{bookDoc?.title}</span>.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your full name" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input type="tel" placeholder="Your 10-digit mobile number" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem><FormLabel>Full Address</FormLabel><FormControl><Textarea placeholder="House No, Building, Street, Area, Landmark" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-4">
                                 <FormField control={form.control} name="city" render={({ field }) => (
                                    <FormItem><FormLabel>Town/City</FormLabel><FormControl><Input placeholder="e.g., Mumbai" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                 <FormField control={form.control} name="postalCode" render={({ field }) => (
                                    <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input placeholder="e.g., 400001" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name="state" render={({ field }) => (
                                <FormItem><FormLabel>State</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {Object.keys(statesAndDistricts).map(state => (<SelectItem key={state} value={state}>{state}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                                <FormMessage /></FormItem>
                            )} />
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">
                                Proceed to Payment
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}

export default function AddressPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="animate-spin h-8 w-8"/></div>}>
            <AddressPageContent />
        </Suspense>
    )
}
