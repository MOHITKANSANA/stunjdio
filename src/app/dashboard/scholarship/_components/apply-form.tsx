
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

const applyFormSchema = z.intersection(personalDetailsSchema, z.intersection(scholarshipChoiceSchema, uploadsSchema));


type ApplyFormValues = z.infer<typeof applyFormSchema>;

const STEPS = {
  PERSONAL_DETAILS: 1,
  SCHOLARSHIP_CHOICE: 2,
  UPLOADS: 3,
  CONFIRMATION_REVIEW: 4,
  SUCCESS: 5,
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
        resolver: zodResolver(applyFormSchema),
        defaultValues: {
            name: user?.displayName || '',
            email: user?.email || '',
            phone: '',
            address: '',
            scholarshipType: '',
        },
        mode: 'onChange'
    });

    const scholarshipType = form.watch('scholarshipType');
    const formData = form.watch();

    const handleNext = async () => {
        let isValid = false;
        if (step === STEPS.PERSONAL_DETAILS) {
            isValid = await form.trigger(['name', 'email', 'phone', 'address']);
        } else if (step === STEPS.SCHOLARSHIP_CHOICE) {
            isValid = await form.trigger(['scholarshipType', 'courseId']);
        } else if (step === STEPS.UPLOADS) {
            isValid = true;
        }
        
        if (isValid) {
            setStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };
    
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
            setStep(STEPS.SUCCESS);

        } catch (error) {
            console.error("Application submission error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not submit application.' });
        }
    };

    const copyToClipboard = () => {
        if(applicationNumber) {
            navigator.clipboard.writeText(applicationNumber);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    if (step === STEPS.SUCCESS) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Application Submitted!</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                    <Check className="h-16 w-16 mx-auto bg-green-100 text-green-600 rounded-full p-3 mb-4" />
                    <h3 className="text-2xl font-bold">Thank You!</h3>
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
                </CardContent>
                <CardFooter className="justify-center">
                    <Button onClick={() => { form.reset(); setStep(STEPS.PERSONAL_DETAILS); }}>Apply Again</Button>
                </CardFooter>
            </Card>
        );
    }
    
    const renderStepContent = () => {
        switch (step) {
            case STEPS.PERSONAL_DETAILS:
                return (
                    <>
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email Address</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem><FormLabel>Full Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </>
                );
            case STEPS.SCHOLARSHIP_CHOICE:
                return (
                    <>
                        <FormField control={form.control} name="scholarshipType" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Scholarship For</FormLabel>
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
                        )} />
                        {scholarshipType === 'Specific Course' && (
                            <FormField control={form.control} name="courseId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Select Course</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {coursesLoading && <p className='p-2 text-xs text-muted-foreground'>Loading courses...</p>}
                                            {coursesCollection?.docs.map(doc => (
                                                <SelectItem key={doc.id} value={doc.id}>{doc.data().title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}
                    </>
                );
            case STEPS.UPLOADS:
                return (
                    <>
                        <FormField control={form.control} name="photo" render={({ field: { onChange, value, ...rest } }) => (
                            <FormItem>
                                <FormLabel>Your Photo</FormLabel>
                                <FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...rest} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="signature" render={({ field: { onChange, value, ...rest } }) => (
                            <FormItem>
                                <FormLabel>Your Signature</FormLabel>
                                <FormControl><Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} {...rest} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </>
                );
            case STEPS.CONFIRMATION_REVIEW:
                return (
                    <div className="space-y-4 rounded-lg border p-4">
                        <h4 className="font-semibold">Personal Details</h4>
                        <p><span className="font-medium">Name:</span> {formData.name}</p>
                        <p><span className="font-medium">Email:</span> {formData.email}</p>
                        <p><span className="font-medium">Phone:</span> {formData.phone}</p>
                        <p><span className="font-medium">Address:</span> {formData.address}</p>
                        <hr />
                        <h4 className="font-semibold">Scholarship Details</h4>
                        <p><span className="font-medium">Type:</span> {formData.scholarshipType}</p>
                        {formData.scholarshipType === 'Specific Course' && (
                            <p><span className="font-medium">Course:</span> {getCourseTitle(formData.courseId)}</p>
                        )}
                        <hr />
                        <h4 className="font-semibold">Uploads</h4>
                        <p><span className="font-medium">Photo:</span> {formData.photo?.name || 'Not provided'}</p>
                        <p><span className="font-medium">Signature:</span> {formData.signature?.name || 'Not provided'}</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
      <Card>
        <CardHeader>
            {step === STEPS.PERSONAL_DETAILS && <><CardTitle>Step 1: Personal Details</CardTitle><CardDescription>Please fill in your personal information.</CardDescription></>}
            {step === STEPS.SCHOLARSHIP_CHOICE && <><CardTitle>Step 2: Scholarship Choice</CardTitle><CardDescription>Tell us what you would like to avail for free.</CardDescription></>}
            {step === STEPS.UPLOADS && <><CardTitle>Step 3: Uploads (Optional)</CardTitle><CardDescription>You can upload your photo and signature if you wish.</CardDescription></>}
            {step === STEPS.CONFIRMATION_REVIEW && <><CardTitle>Step 4: Review and Confirm</CardTitle><CardDescription>Please review your details before submitting.</CardDescription></>}
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    {renderStepContent()}
                </CardContent>
                <CardFooter className="flex justify-between pt-6">
                    <div>
                        {step > STEPS.PERSONAL_DETAILS && (
                            <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
                        )}
                    </div>
                    <div>
                        {step < STEPS.CONFIRMATION_REVIEW ? (
                            <Button type="button" onClick={handleNext}>Next</Button>
                        ) : (
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Application
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </form>
        </Form>
      </Card>
    );
}
