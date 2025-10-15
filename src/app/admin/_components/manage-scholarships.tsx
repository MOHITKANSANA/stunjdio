'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, updateDoc, getDoc, setDoc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DatePicker } from './date-picker';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Loader2, PlusCircle, Trash2, Calendar, Download } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';


const settingsSchema = z.object({
  applicationStartDate: z.date().optional(),
  applicationEndDate: z.date().optional(),
  resultDate: z.date().optional(),
});
type SettingsFormValues = z.infer<typeof settingsSchema>;

const ScholarshipSettings = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [docData, setDocData] = useDocumentData(doc(firestore, 'settings', 'scholarship'));

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema)
    });
    
    useEffect(() => {
        if (docData) {
            form.reset({
                applicationStartDate: docData.applicationStartDate?.toDate(),
                applicationEndDate: docData.applicationEndDate?.toDate(),
                resultDate: docData.resultDate?.toDate(),
            });
             setIsLoading(false);
        } else {
             setIsLoading(false);
        }
    }, [docData, form]);


    const onSubmit = async (data: SettingsFormValues) => {
        try {
            await setDoc(doc(firestore, 'settings', 'scholarship'), data, { merge: true });
            toast({ title: 'Success', description: 'Scholarship settings updated.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update settings.' });
        }
    };

    if (isLoading) {
        return <Skeleton className="h-64 w-full" />;
    }

    return (
         <Card>
            <CardHeader><CardTitle>Manage Scholarship Dates</CardTitle></CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="applicationStartDate" render={({ field }) => (
                                <FormItem><FormLabel>Application Start Date</FormLabel><FormControl><DatePicker date={field.value} setDate={field.onChange} /></FormControl></FormItem>
                            )} />
                             <FormField control={form.control} name="applicationEndDate" render={({ field }) => (
                                <FormItem><FormLabel>Application End Date</FormLabel><FormControl><DatePicker date={field.value} setDate={field.onChange} /></FormControl></FormItem>
                            )} />
                             <FormField control={form.control} name="resultDate" render={({ field }) => (
                                <FormItem><FormLabel>Result Declaration Date</FormLabel><FormControl><DatePicker date={field.value} setDate={field.onChange} /></FormControl></FormItem>
                            )} />
                        </div>
                        <Button type="submit">Save Settings</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

const ManageCenters = () => {
    const { toast } = useToast();
    const [centersCollection, centersLoading] = useCollection(query(collection(firestore, 'scholarshipCenters'), orderBy('state', 'asc')));
    const [newState, setNewState] = useState('');
    const [newCity, setNewCity] = useState('');
    const [newCenterName, setNewCenterName] = useState('');
    const [examDate, setExamDate] = useState<Date|undefined>();
    const [admitCardDate, setAdmitCardDate] = useState<Date|undefined>();
    const [isSaving, setIsSaving] = useState(false);

    const handleAddCenter = async () => {
        if (!newState || !newCity || !newCenterName || !examDate || !admitCardDate) {
            toast({ variant: 'destructive', title: 'All fields are required.' });
            return;
        }
        setIsSaving(true);
        try {
            await addDoc(collection(firestore, 'scholarshipCenters'), {
                state: newState,
                city: newCity,
                name: newCenterName,
                examDate,
                admitCardDate
            });
            setNewState('');
            setNewCity('');
            setNewCenterName('');
            setExamDate(undefined);
            setAdmitCardDate(undefined);
            toast({ title: 'Center Added!' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Could not add center.' });
        }
        setIsSaving(false);
    }
    
    return (
         <Card>
            <CardHeader><CardTitle>Manage Test Centers</CardTitle></CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Input placeholder="State" value={newState} onChange={e => setNewState(e.target.value)} />
                    <Input placeholder="City" value={newCity} onChange={e => setNewCity(e.target.value)} />
                    <Input placeholder="Center Name / Address" value={newCenterName} onChange={e => setNewCenterName(e.target.value)} />
                     <DatePicker date={examDate} setDate={setExamDate} />
                    <DatePicker date={admitCardDate} setDate={setAdmitCardDate} />
                    <Button onClick={handleAddCenter} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Center
                    </Button>
                </div>
                 {centersLoading && <Skeleton className="h-48 w-full" />}
                 {!centersLoading && (
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Center</TableHead>
                                <TableHead>Exam Date</TableHead>
                                <TableHead>Admit Card Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {centersCollection?.docs.map(doc => {
                                const center = doc.data();
                                return (
                                    <TableRow key={doc.id}>
                                        <TableCell>{center.name}, {center.city}, {center.state}</TableCell>
                                        <TableCell>{center.examDate?.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell>{center.admitCardDate?.toDate().toLocaleDateString()}</TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                     </Table>
                 )}
            </CardContent>
        </Card>
    );
}


export function ManageScholarships() {
    const { toast } = useToast();

    const [applications, loading, error] = useCollection(
        query(collection(firestore, 'scholarshipApplications'), orderBy('appliedAt', 'desc'))
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
                        <TableHead>Choices</TableHead>
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
                                 <TableCell className="text-xs">
                                     <ol className="list-decimal list-inside">
                                        {app.centerChoices?.map((c: string, i: number) => <li key={i}>{c}</li>)}
                                     </ol>
                                </TableCell>
                                <TableCell className="space-x-2">
                                     {status === 'applied' && (
                                        <>
                                            <Button size="sm" onClick={() => handleUpdateStatus(appDoc.id, 'status', 'approved')}>Approve</Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(appDoc.id, 'status', 'rejected')}>Reject</Button>
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
    
    return (
        <div className="space-y-8">
            <ScholarshipSettings />
            <ManageCenters />
             <Card>
                <CardHeader><CardTitle>Scholarship Applications</CardTitle></CardHeader>
                <CardContent>
                     <Tabs defaultValue="applied">
                        <TabsList>
                            <TabsTrigger value="applied">New Applications</TabsTrigger>
                            <TabsTrigger value="approved">Approved</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected</TabsTrigger>
                        </TabsList>
                        <TabsContent value="applied" className="mt-4">{renderApplicationsTable('applied')}</TabsContent>
                         <TabsContent value="approved" className="mt-4">{renderApplicationsTable('approved')}</TabsContent>
                         <TabsContent value="rejected" className="mt-4">{renderApplicationsTable('rejected')}</TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

    

    

