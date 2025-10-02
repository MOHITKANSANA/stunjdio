
'use client';

import { useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DatePicker } from './date-picker';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';


const settingsSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  testStartDate: z.date().optional(),
  testEndDate: z.date().optional(),
  resultDate: z.date().optional(),
});
type SettingsFormValues = z.infer<typeof settingsSchema>;

const ScholarshipSettings = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
    });

    useState(() => {
        const fetchSettings = async () => {
            const settingsDoc = await getDoc(doc(firestore, 'settings', 'scholarship'));
            if (settingsDoc.exists()) {
                const data = settingsDoc.data();
                form.reset({
                    startDate: data.startDate?.toDate(),
                    endDate: data.endDate?.toDate(),
                    testStartDate: data.testStartDate?.toDate(),
                    testEndDate: data.testEndDate?.toDate(),
                    resultDate: data.resultDate?.toDate(),
                });
            }
            setIsLoading(false);
        };
        fetchSettings();
    });

    const onSubmit = async (data: SettingsFormValues) => {
        try {
            await setDoc(doc(firestore, 'settings', 'scholarship'), data, { merge: true });
            toast({ title: 'Success', description: 'Scholarship settings updated.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update settings.' });
        }
    };

    if (isLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    return (
         <Card>
            <CardHeader><CardTitle>Manage Scholarship Dates</CardTitle></CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="startDate" render={({ field }) => (
                                <FormItem><FormLabel>Application Start</FormLabel><FormControl><DatePicker date={field.value} setDate={field.onChange} /></FormControl></FormItem>
                            )} />
                             <FormField control={form.control} name="endDate" render={({ field }) => (
                                <FormItem><FormLabel>Application End</FormLabel><FormControl><DatePicker date={field.value} setDate={field.onChange} /></FormControl></FormItem>
                            )} />
                             <FormField control={form.control} name="testStartDate" render={({ field }) => (
                                <FormItem><FormLabel>Test Start</FormLabel><FormControl><DatePicker date={field.value} setDate={field.onChange} /></FormControl></FormItem>
                            )} />
                             <FormField control={form.control} name="testEndDate" render={({ field }) => (
                                <FormItem><FormLabel>Test End</FormLabel><FormControl><DatePicker date={field.value} setDate={field.onChange} /></FormControl></FormItem>
                            )} />
                             <FormField control={form.control} name="resultDate" render={({ field }) => (
                                <FormItem><FormLabel>Result Declaration</FormLabel><FormControl><DatePicker date={field.value} setDate={field.onChange} /></FormControl></FormItem>
                            )} />
                        </div>
                        <Button type="submit">Save Settings</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

export function ManageScholarships() {
    const { toast } = useToast();

    const [applications, loading, error] = useCollection(
        query(collection(firestore, 'scholarshipApplications'), orderBy('appliedAt', 'desc'))
    );
    
    const [results, resultsLoading, resultsError] = useCollection(
        query(collection(firestore, 'scholarshipTestResults'), orderBy('submittedAt', 'desc'))
    );

    const handleUpdateStatus = async (id: string, field: string, status: string) => {
        try {
            await updateDoc(doc(firestore, 'scholarshipApplications', id), { [field]: status });
            toast({ title: 'Success', description: `Status updated to ${status}.` });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update status.' });
        }
    };
    
    const renderApplicationsTable = (status: string) => {
        const filtered = applications?.docs.filter(doc => doc.data().status === status);
        if (loading) return <Skeleton className="h-48 w-full" />;
        if (!filtered || filtered.length === 0) return <p className="text-center text-muted-foreground p-8">No applications found with status: {status}</p>;

        return (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Applied For</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filtered.map(appDoc => {
                        const app = appDoc.data();
                        return (
                            <TableRow key={appDoc.id}>
                                <TableCell>
                                    <p>{app.name}</p>
                                    <p className="text-xs text-muted-foreground">{app.applicationNumber}</p>
                                </TableCell>
                                <TableCell>{app.scholarshipType}</TableCell>
                                <TableCell>
                                    {app.paymentScreenshotDataUrl ? (
                                        <a href={app.paymentScreenshotDataUrl} target="_blank" rel="noopener noreferrer">View</a>
                                    ) : "N/A"}
                                </TableCell>
                                <TableCell className="space-x-2">
                                    {status === 'payment_pending' && (
                                        <>
                                            <Button size="sm" onClick={() => handleUpdateStatus(appDoc.id, 'status', 'payment_approved')}>Approve</Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(appDoc.id, 'status', 'payment_rejected')}>Reject</Button>
                                        </>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        )
    };
    
    const renderResultsTable = () => {
         if (resultsLoading) return <Skeleton className="h-48 w-full" />;
         if (!results || results.docs.length === 0) return <p className="text-center text-muted-foreground p-8">No test results found.</p>;
         
         return (
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Applicant</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {results.docs.map(resDoc => {
                        const res = resDoc.data();
                        const applicant = applications?.docs.find(a => a.id === res.applicantId)?.data();
                        return (
                            <TableRow key={resDoc.id}>
                                <TableCell>
                                    <p>{res.applicantName}</p>
                                    <p className="text-xs text-muted-foreground">{res.applicationNumber}</p>
                                </TableCell>
                                <TableCell>{res.score} / {res.totalQuestions}</TableCell>
                                 <TableCell><Badge variant={applicant?.resultStatus === 'pass' ? 'default' : (applicant?.resultStatus === 'fail' ? 'destructive' : 'secondary')}>{applicant?.resultStatus || 'pending'}</Badge></TableCell>
                                <TableCell className="space-x-2">
                                     <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(res.applicantId, 'resultStatus', 'pass')}>Pass</Button>
                                     <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(res.applicantId, 'resultStatus', 'fail')}>Fail</Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
         )
    }

    return (
        <div className="space-y-8">
            <ScholarshipSettings />

             <Tabs defaultValue="applications">
                <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="applications">Applications</TabsTrigger>
                    <TabsTrigger value="results">Test Results</TabsTrigger>
                </TabsList>
                <TabsContent value="applications" className="mt-4">
                     <Card>
                        <CardHeader><CardTitle>Scholarship Applications</CardTitle></CardHeader>
                        <CardContent>
                             <Tabs defaultValue="payment_pending">
                                <TabsList>
                                    <TabsTrigger value="payment_pending">Payment Pending</TabsTrigger>
                                    <TabsTrigger value="payment_approved">Payment Approved</TabsTrigger>
                                </TabsList>
                                <TabsContent value="payment_pending" className="mt-4">
                                    {renderApplicationsTable('payment_pending')}
                                </TabsContent>
                                 <TabsContent value="payment_approved" className="mt-4">
                                    {renderApplicationsTable('payment_approved')}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="results" className="mt-4">
                     <Card>
                        <CardHeader><CardTitle>Test Results</CardTitle></CardHeader>
                        <CardContent>
                            {renderResultsTable()}
                        </CardContent>
                    </Card>
                </TabsContent>
             </Tabs>
        </div>
    );
}
