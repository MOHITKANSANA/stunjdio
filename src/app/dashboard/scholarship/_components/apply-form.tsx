
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Check, Checkbox } from 'lucide-react';
import { addDoc, collection, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection } from 'react-firebase-hooks/firestore';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';


const applyFormSchema = z.object({
    name: z.string().min(2, 'Name is required.'),
    email: z.string().email(),
    phone: z.string().min(10, 'Enter a valid phone number.').regex(/^\d{10,15}$/, 'Enter a valid phone number.'),
    address: z.string().min(5, 'Address is required.'),
    scholarshipType: z.string().min(1, 'Please select a scholarship type.'),
    courseId: z.string().optional(),
    photo: z.any().optional(),
    signature: z.any().optional(),
    centerChoices: z.array(z.string()).length(3, 'Please select exactly 3 center choices.'),
}).refine(data => {
    if (data.scholarshipType === 'Specific Course' && !data.courseId) {
        return false;
    }
    return true;
}, {
    message: 'Please select a course.',
    path: ['courseId'],
});


type ApplyFormValues = z.infer<typeof applyFormSchema>;

const STEPS = {
  PERSONAL_DETAILS: 1,
  SCHOLARSHIP_CHOICE: 2,
  CENTER_CHOICE: 3,
  UPLOADS: 4,
  CONFIRMATION_REVIEW: 5,
  SUCCESS: 6,
};

function getCroppedImg(image: HTMLImageElement, crop: Crop, fileName: string): Promise<string> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return Promise.reject(new Error('Canvas context is not available'));
    }

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );

    return new Promise((resolve) => {
        resolve(canvas.toDataURL('image/jpeg', 0.8));
    });
}


export function ApplyForm({ onFormSubmit }: { onFormSubmit: () => void }) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [step, setStep] = useState(STEPS.PERSONAL_DETAILS);
    const [applicationNumber, setApplicationNumber] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    
    const [coursesCollection, coursesLoading] = useCollection(
        query(collection(firestore, 'courses'), orderBy('title', 'asc'))
    );
    const [centersCollection, centersLoading] = useCollection(
        query(collection(firestore, 'scholarshipCenters'), orderBy('state', 'asc'))
    );


    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const photoImgRef = useRef<HTMLImageElement>(null);
    const [photoCrop, setPhotoCrop] = useState<Crop>();
    const [croppedPhoto, setCroppedPhoto] = useState<string | null>(null);

    const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
    const signatureImgRef = useRef<HTMLImageElement>(null);
    const [signatureCrop, setSignatureCrop] = useState<Crop>();
    const [croppedSignature, setCroppedSignature] = useState<string | null>(null);

    
    const form = useForm<ApplyFormValues>({
        resolver: zodResolver(applyFormSchema),
        defaultValues: {
            name: user?.displayName || '',
            email: user?.email || '',
            phone: '',
            address: '',
            scholarshipType: '',
            centerChoices: [],
        },
        mode: 'onChange'
    });

    const scholarshipType = form.watch('scholarshipType');
    const formData = form.watch();
    const centerChoices = form.watch('centerChoices') || [];

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhotoPreview(URL.createObjectURL(e.target.files[0]));
        }
    };
    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSignaturePreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleNext = async () => {
        let isValid = false;
        if (step === STEPS.PERSONAL_DETAILS) {
            isValid = await form.trigger(['name', 'email', 'phone', 'address']);
        } else if (step === STEPS.SCHOLARSHIP_CHOICE) {
            isValid = await form.trigger(['scholarshipType', 'courseId']);
        } else if (step === STEPS.CENTER_CHOICE) {
            isValid = await form.trigger(['centerChoices']);
        } else if (step === STEPS.UPLOADS) {
            if (photoImgRef.current && photoCrop) {
                const cropped = await getCroppedImg(photoImgRef.current, photoCrop, 'photo.jpeg');
                setCroppedPhoto(cropped);
            }
             if (signatureImgRef.current && signatureCrop) {
                const cropped = await getCroppedImg(signatureImgRef.current, signatureCrop, 'signature.jpeg');
                setCroppedSignature(cropped);
            }
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

    const getCenterName = (centerId: string) => {
        const center = centersCollection?.docs.find(doc => doc.id === centerId);
        if (!center) return '';
        const data = center.data();
        return `${data.name}, ${data.city}, ${data.state}`;
    };

    const onSubmit = async (data: ApplyFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }
        try {
            const appNumber = String(Math.floor(10000 + Math.random() * 90000));
            
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
                centerChoices: data.centerChoices.map(getCenterName),
                photoUrl: croppedPhoto,
                signatureUrl: croppedSignature,
                status: 'applied',
                resultStatus: 'pending',
                appliedAt: serverTimestamp(),
            });
            
            setApplicationNumber(appNumber);
            setStep(STEPS.SUCCESS);
            onFormSubmit();

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
                    <p className="text-muted-foreground mt-2">Please save your application number for future reference.</p>
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
            case STEPS.CENTER_CHOICE:
                return (
                    <FormField
                        control={form.control}
                        name="centerChoices"
                        render={() => (
                            <FormItem>
                                <div className="mb-4">
                                <FormLabel className="text-base">Exam Center Choices</FormLabel>
                                <FormMessage />
                                </div>
                                <div className="space-y-2">
                                {[...Array(3)].map((_, index) => (
                                     <FormField
                                        key={index}
                                        control={form.control}
                                        name={`centerChoices.${index}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Choice {index + 1}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select a center" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {centersLoading && <p>Loading...</p>}
                                                    {centersCollection?.docs
                                                        .filter(doc => !centerChoices.includes(doc.id) || centerChoices[index] === doc.id)
                                                        .map(doc => (
                                                        <SelectItem key={doc.id} value={doc.id}>
                                                            {getCenterName(doc.id)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                     />
                                ))}
                                </div>
                            </FormItem>
                        )}
                        />
                );
            case STEPS.UPLOADS:
                return (
                    <div className="space-y-6">
                        <div>
                            <FormLabel>Your Photo (Optional)</FormLabel>
                            <Input type="file" accept="image/*" onChange={handlePhotoChange} />
                            {photoPreview && (
                                <div className="mt-2">
                                <ReactCrop crop={photoCrop} onChange={c => setPhotoCrop(c)} aspect={1}>
                                    <img ref={photoImgRef} src={photoPreview} alt="Photo Preview"/>
                                </ReactCrop>
                                </div>
                            )}
                        </div>
                         <div>
                            <FormLabel>Your Signature (Optional)</FormLabel>
                            <Input type="file" accept="image/*" onChange={handleSignatureChange} />
                            {signaturePreview && (
                                <div className="mt-2">
                                <ReactCrop crop={signatureCrop} onChange={c => setSignatureCrop(c)} aspect={2}>
                                    <img ref={signatureImgRef} src={signaturePreview} alt="Signature Preview" />
                                </ReactCrop>
                                </div>
                            )}
                        </div>
                    </div>
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
                        <h4 className="font-semibold">Center Choices</h4>
                        <ol className="list-decimal list-inside">
                           {centerChoices.map((id, i) => <li key={i}>{getCenterName(id)}</li>)}
                        </ol>
                        <hr />
                        <h4 className="font-semibold">Uploads</h4>
                        <p><span className="font-medium">Photo:</span> {croppedPhoto ? 'Provided' : 'Not provided'}</p>
                        <p><span className="font-medium">Signature:</span> {croppedSignature ? 'Provided' : 'Not provided'}</p>
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
            {step === STEPS.CENTER_CHOICE && <><CardTitle>Step 3: Choose Exam Centers</CardTitle><CardDescription>Select 3 preferred offline test centers.</CardDescription></>}
            {step === STEPS.UPLOADS && <><CardTitle>Step 4: Uploads (Optional)</CardTitle><CardDescription>You can upload your photo and signature if you wish.</CardDescription></>}
            {step === STEPS.CONFIRMATION_REVIEW && <><CardTitle>Step 5: Review and Confirm</CardTitle><CardDescription>Please review your details before submitting.</CardDescription></>}
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    {renderStepContent()}
                </CardContent>
                <CardFooter className="flex justify-between pt-6">
                    <div>
                        {step > STEPS.PERSONAL_DETAILS && step < STEPS.SUCCESS && (
                            <Button type="button" variant="outline" onClick={handleBack}>Back</Button>
                        )}
                    </div>
                    <div>
                        {step < STEPS.CONFIRMATION_REVIEW ? (
                            <Button type="button" onClick={handleNext}>Next</Button>
                        ) : step === STEPS.CONFIRMATION_REVIEW ? (
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Application
                            </Button>
                        ) : null}
                    </div>
                </CardFooter>
            </form>
        </Form>
      </Card>
    );
}
