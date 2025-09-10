
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, AlertTriangle } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Certificate from '@/components/certificate';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const resultSchema = z.object({
    applicationNumber: z.string().length(5, 'Application number must be 5 digits.'),
});
type ResultFormValues = z.infer<typeof resultSchema>;

export function ViewResult() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [applicant, setApplicant] = useState<any>(null);
    const [isResultAvailable, setIsResultAvailable] = useState(true); // Default to true, check on load

    useEffect(() => {
        const checkResultDate = async () => {
            try {
                const settingsDoc = await getDoc(doc(firestore, 'settings', 'scholarship'));
                if (settingsDoc.exists()) {
                    const settings = settingsDoc.data();
                    const resultDate = settings.resultDate?.toDate();
                    if (resultDate && new Date() < resultDate) {
                        setIsResultAvailable(false);
                    }
                }
            } catch (error) {
                console.error("Error fetching result date settings: ", error);
            }
        };
        checkResultDate();
    }, []);

    const form = useForm<ResultFormValues>({
        resolver: zodResolver(resultSchema),
        defaultValues: {
            applicationNumber: '',
        }
    });

    const onCheckResult = async (data: ResultFormValues) => {
        setIsLoading(true);
        setResult(null);
        setApplicant(null);
        try {
             // 1. Find the applicant to check their resultStatus
            const applicantQuery = query(
                collection(firestore, 'scholarshipApplications'), 
                where('applicationNumber', '==', data.applicationNumber)
            );
            const applicantSnapshot = await getDocs(applicantQuery);

            if (applicantSnapshot.empty) {
                toast({ variant: 'destructive', title: 'Not Found', description: 'This application number does not exist.' });
                setIsLoading(false);
                return;
            }
            const applicantData = applicantSnapshot.docs[0].data();
            setApplicant(applicantData);
            
            // 2. Check the resultStatus
            if (applicantData.resultStatus === 'pass' || applicantData.resultStatus === 'fail') {
                // 3. If passed/failed, fetch the detailed test result
                const resultQuery = query(
                    collection(firestore, 'scholarshipTestResults'), 
                    where('applicationNumber', '==', data.applicationNumber),
                    orderBy('submittedAt', 'desc'),
                    limit(1)
                );
                const resultSnapshot = await getDocs(resultQuery);
                if (resultSnapshot.empty) {
                     toast({ variant: 'destructive', title: 'Result Missing', description: 'Your result status is updated, but detailed test data is missing. Please contact support.' });
                } else {
                    const resultData = resultSnapshot.docs[0].data();
                    setResult(resultData);
                }
            } else {
                 toast({ title: 'Result Pending', description: 'Your result is still pending. Please check back later.' });
            }

        } catch (error) {
            console.error("Error fetching result: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch result. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleDownloadCertificate = () => {
        const certificate = document.getElementById('certificate');
        if (certificate) {
          const a = document.createElement('a');
          const certificateHTML = certificate.outerHTML;
          const blob = new Blob([
              `<html>
                 <head>
                    <title>Certificate</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                 </head>
                 <body class="bg-gray-100 flex items-center justify-center min-h-screen">${certificateHTML}</body>
               </html>`
          ], { type: 'text/html' });
          a.href = URL.createObjectURL(blob);
          a.download = `scholarship-certificate-${result.applicationNumber}.html`;
          a.click();
        }
      };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Check Your Result</CardTitle>
                <CardDescription>Enter your application number to see your test score.</CardDescription>
            </CardHeader>
            <CardContent>
                {!isResultAvailable ? (
                     <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Results Not Declared</AlertTitle>
                        <AlertDescription>
                           Results are not yet available. Please check back after the official result declaration date.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onCheckResult)} className="space-y-4">
                            <FormField control={form.control} name="applicationNumber" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Application Number</FormLabel>
                                    <FormControl><Input placeholder="e.g. 12345" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Check Result
                            </Button>
                        </form>
                    </Form>
                )}
            </CardContent>
            {result && applicant && isResultAvailable && (
                 <CardContent>
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Your Scholarship Test Result</CardTitle>
                            <CardDescription>Application No: {result.applicationNumber}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div id="certificate-wrapper" className='bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto'>
                                <Certificate
                                    studentName={result.applicantName || 'Student'}
                                    courseName="Scholarship Eligibility Test"
                                    score={(result.score / result.totalQuestions) * 100}
                                    date={result.submittedAt?.toDate()?.toLocaleDateString() || new Date().toLocaleDateString()}
                                    status={applicant.resultStatus}
                                />
                            </div>
                        </CardContent>
                         {applicant.resultStatus === 'pass' && (
                            <CardFooter>
                                <Button onClick={handleDownloadCertificate}><Download className="mr-2"/>Download Certificate</Button>
                            </CardFooter>
                         )}
                    </Card>
                </CardContent>
            )}
        </Card>
    )
}
