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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';

const AdmitCardSchema = z.object({
  applicationNumber: z.string().length(5, 'Application number must be 5 digits.'),
});
type AdmitCardFormValues = z.infer<typeof AdmitCardSchema>;

const AdmitCardDisplay = ({ applicant }: { applicant: any }) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admit Card - GSNST</CardTitle>
          <CardDescription>
            Application Number: {applicant.applicationNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <p><strong>Name:</strong> {applicant.name}</p>
            <p><strong>Exam Center:</strong> {applicant.allottedCenter || 'To be announced'}</p>
            <p><strong>Exam Date:</strong> {applicant.examDate?.toDate().toLocaleDateString() || 'To be announced'}</p>
            <p><strong>Reporting Time:</strong> {applicant.reportingTime || 'To be announced'}</p>
            <p><strong>Exam Time:</strong> {applicant.examTime || 'To be announced'}</p>
          </div>
          <div className="flex flex-col items-center gap-4">
             {applicant.photoUrl && <Image src={applicant.photoUrl} alt="Applicant Photo" width={100} height={100} className="border rounded-md" />}
             {applicant.signatureUrl && <Image src={applicant.signatureUrl} alt="Applicant Signature" width={150} height={50} className="border rounded-md bg-white p-1" />}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4 p-6 bg-muted rounded-b-lg">
            <h4 className="font-bold">Instructions (निर्देश):</h4>
            <ul className="list-disc list-inside text-sm space-y-2 text-muted-foreground">
                <li>कृपया परीक्षा देने आते समय ₹60 साथ लाएँ। (Please bring ₹60 when you come for the exam.)</li>
                <li>Admit card and a valid photo ID are mandatory.</li>
                <li>Reach the exam center by the reporting time.</li>
                <li>Electronic devices are not allowed inside the exam hall.</li>
            </ul>
        </CardFooter>
      </Card>
    );
};

export function AdmitCardTab() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [applicant, setApplicant] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<AdmitCardFormValues>({
        resolver: zodResolver(AdmitCardSchema)
    });

    const onSubmit = async (data: AdmitCardFormValues) => {
        setIsLoading(true);
        setError(null);
        setApplicant(null);
        try {
            const q = query(collection(firestore, 'scholarshipApplications'), where('applicationNumber', '==', data.applicationNumber));
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                setError('Application number not found.');
            } else {
                const appData = snapshot.docs[0].data();
                
                if (appData.allottedCenterId) {
                    const centerDoc = await getDocs(query(collection(firestore, 'scholarshipCenters'), where('__name__', '==', appData.allottedCenterId)));
                    if (!centerDoc.empty) {
                        const centerData = centerDoc.docs[0].data();
                        
                        if (centerData.admitCardDate && centerData.admitCardDate.toDate() > new Date()) {
                            setError('Admit card for your center is not yet available for download.');
                            return;
                        }

                        appData.examDate = centerData.examDate;
                        appData.reportingTime = centerData.reportingTime;
                        appData.examTime = centerData.examTime;
                        appData.allottedCenter = `${centerData.name}, ${centerData.city}`;
                        setApplicant(appData);

                    } else {
                         setError('Your allotted center details could not be found. Please contact support.');
                    }
                } else {
                    setError('Your admit card has not been generated yet. Please check back later.');
                }
            }
        } catch (e: any) {
            setError(e.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Download Admit Card</CardTitle>
                <CardDescription>Enter your application number to view and download your admit card.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="applicationNumber" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Application Number</FormLabel>
                                <FormControl><Input placeholder="Enter 5-digit application number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Find Admit Card
                        </Button>
                    </form>
                </Form>
                 {error && <p className="text-destructive text-sm mt-4">{error}</p>}
                 {applicant && (
                     <div className="mt-6">
                        <AdmitCardDisplay applicant={applicant} />
                     </div>
                 )}
            </CardContent>
        </Card>
    );
}
