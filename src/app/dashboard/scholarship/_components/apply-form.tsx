
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Check } from 'lucide-react';
import { addDoc, collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection } from 'react-firebase-hooks/firestore';

const personalDetailsSchema = z.object({
    name: z.string().min(2, 'Name is required.'),
    email: z.string().email(),
    phone: z.string().min(10, 'Enter a valid phone number.'),
    address: z.string().min(5, 'Address is required.'),
});

const scholarshipChoiceSchema = z.object({
    scholarshipType: z.string().min(1, 'Please select a scholarship type.'),
    courseId: z.string().optional(),
}).refine(data => {
    if (data.scholarshipType === 'Specific Course' && !data.courseId) {
        return false;
    }
    return true;
}, {
    message: 'Please select a course.',
    path: ['courseId'],
});

const uploadsSchema = z.object({
    photo: z.instanceof(File).optional(),
    signature: z.instanceof(File).optional(),
});

const combinedSchema = personalDetailsSchema.merge(scholarshipChoiceSchema).merge(uploadsSchema);

type ApplyFormValues = z.infer<typeof combinedSchema>;

const STEPS = {
  PERSONAL_DETAILS: 1,
  SCHOLARSHIP_CHOICE: 2,
  UPLOADS: 3,
  CONFIRMATION: 4,
};

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
};


export function ApplyForm() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [step, setStep] = useState(STEPS.PERSONAL_DETAILS);
    const [applicationNumber, setApplicationNumber] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    
    const [coursesCollection, coursesLoading] = useCollection(
        query(collection(firestore, 'courses'), orderBy('title', 'asc'))
    );
    
    const form = useForm<ApplyFormValues>({
        resolver: zodResolver(combinedSchema),
        defaultValues: {
            name: user?.displayName || '',
            email: user?.email || '',
            phone: '',
            address: '',
            scholarshipType: '',
        }
    });

    const scholarshipType = form.watch('scholarshipType');

    const handleNext = async () => {
        let isValid = false;
        if (step === STEPS.PERSONAL_DETAILS) {
            isValid = await form.trigger(['name', 'email', 'phone', 'address']);
        } else if (step === STEPS.SCHOLARSHIP_CHOICE) {
            isValid = await form.trigger(['scholarshipType', 'courseId']);
        }
        
        if (isValid) {
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    }
    
    const getCourseTitle = (courseId: string | undefined) => {
        if (!courseId) return '';
        const course = coursesCollection?.docs.find(doc => doc.id === courseId);
        return course?.data().title || '';
    };

    const onSubmit = async (data: ApplyFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }
        try {
            const appNumber = String(Math.floor(10000 + Math.random() * 90000));
            
            const photoUrl = data.photo ? await fileToDataUrl(data.photo) : null;
            const signatureUrl = data.signature ? await fileToDataUrl(data.signature) : null;

            await addDoc(collection(firestore, 'scholarshipApplications'), {
                userId: user.uid,
                applicationNumber: appNumber,
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                scholarshipType: data.scholarshipType,
                courseId: data.courseId || null,
                courseTitle: getCourseTitle(data.courseId),
                photoUrl,
                signatureUrl,
                status: 'applied',
                appliedAt: serverTimestamp(),
            });
            
            setApplicationNumber(appNumber);
            setStep(STEPS.CONFIRMATION);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit application.' });
        }
    }

    const copyToClipboard = () => {
        if(applicationNumber) {
            navigator.clipboard.writeText(applicationNumber);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    }

    if (step === STEPS.CONFIRMATION) {
        return (
            <div className="text-center py-8">
                <Check className="h-16 w-16 mx-auto bg-green-100 text-green-600 rounded-full p-3 mb-4" />
                <h3 className="text-2xl font-bold">Application Submitted!</h3>
                <p className="text-muted-foreground mt-2">Please save your application number for the online test.</p>
                <div className="my-6">
                    <p className="text-sm text-muted-foreground">Your Application Number is:</p>
                    <div className="flex items-center justify-center gap-4 mt-2">
                        <p className="text-3xl font-bold tracking-widest bg-muted p-3 rounded-lg">{applicationNumber}</p>
                        <Button variant="outline" size="icon" onClick={copyToClipboard}>
                           {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
                <Button onClick={() => setStep(STEPS.PERSONAL_DETAILS)}>Apply Again</Button>
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {step === STEPS.PERSONAL_DETAILS && (
                     <CardContent className="space-y-4">
                        <CardTitle>Step 1: Personal Details</CardTitle>
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
                    </CardContent>
                )}

                {step === STEPS.SCHOLARSHIP_CHOICE && (
                     <CardContent className="space-y-4">
                        <CardTitle>Step 2: Scholarship Choice</CardTitle>
                         <FormField
                            control={form.control}
                            name="scholarshipType"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>What do you want to avail for free?</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Full App Access">Full App Access</SelectItem>
                                        <SelectItem value="Specific Course">Specific Course</SelectItem>
                                        <SelectItem value="Test Series">Test Series</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        {scholarshipType === 'Specific Course' && (
                            <FormField
                                control={form.control}
                                name="courseId"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Select Course</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger>
                                        <SelectValue placeholder="Select a course" />
                                    </SelectTrigger></FormControl>
                                    <SelectContent>
                                        {coursesLoading && <p className='p-2 text-xs text-muted-foreground'>Loading courses...</p>}
                                        {coursesCollection?.docs.map(doc => (
                                            <SelectItem key={doc.id} value={doc.id}>{doc.data().title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )}
                    </CardContent>
                )}

                {step === STEPS.UPLOADS && (
                     <CardContent className="space-y-4">
                        <CardTitle>Step 3: Uploads (Optional)</CardTitle>
                        <FormField control={form.control} name="photo" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Your Photo</FormLabel>
                                <FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files?.[0])} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="signature" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Your Signature</FormLabel>
                                <FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files?.[0])} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </CardContent>
                )}

                <CardFooter className="flex justify-between">
                    {step > STEPS.PERSONAL_DETAILS && (
                        <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
                    )}
                    {step < STEPS.UPLOADS && (
                        <Button type="button" onClick={handleNext} className="ml-auto">Next</Button>
                    )}
                     {step === STEPS.UPLOADS && (
                        <Button type="submit" disabled={form.formState.isSubmitting} className="ml-auto">
                            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Application
                        </Button>
                    )}
                </CardFooter>
            </form>
        </Form>
    )
}
