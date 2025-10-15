
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const scrutinySchema = z.object({
    applicationNumber: z.string().length(5, 'Application number must be 5 digits.'),
});
type ScrutinyFormValues = z.infer<typeof scrutinySchema>;

export function ScrutinyForm() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const supportNumber = '918949814095';

    const form = useForm<ScrutinyFormValues>({ 
        resolver: zodResolver(scrutinySchema),
        defaultValues: {
            applicationNumber: '',
        }
    });

    const onSubmit = (data: ScrutinyFormValues) => {
        setIsLoading(true);
        const message = `Hello, I would like to request my OMR sheet for review. My application number is ${data.applicationNumber}.`;
        const whatsappUrl = `https://wa.me/${supportNumber}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');
        
        toast({
            title: "Redirecting to WhatsApp",
            description: "Please send the pre-filled message to request your OMR sheet.",
        });

        setIsLoading(false);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Check Your OMR Sheet</CardTitle>
                <CardDescription>Enter your application number to send a request on WhatsApp to view your OMR sheet.</CardDescription>
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
                            Send Request on WhatsApp
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
