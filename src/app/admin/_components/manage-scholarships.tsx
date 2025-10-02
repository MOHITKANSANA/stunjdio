
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
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
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';


const settingsSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  testStartDate: z.date().optional(),
  testEndDate: z.date().optional(),
  resultDate: z.date().optional(),
  isTestFree: z.boolean().default(false),
});
type SettingsFormValues = z.infer<typeof settingsSchema>;

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required.'),
  options: z.array(z.string().min(1, 'Option cannot be empty.')).length(4, 'There must be exactly 4 options.'),
  correctAnswer: z.string().min(1, 'Please specify the correct answer.'),
});

const testCreationSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    questions: z.array(questionSchema).min(1, 'Add at least one question.'),
});
type TestCreationFormValues = z.infer<typeof testCreationSchema>;


const ScholarshipSettings = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            isTestFree: false,
        }
    });
    
    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const settingsDoc = await getDoc(doc(firestore, 'settings', 'scholarship'));
                if (settingsDoc.exists()) {
                    const data = settingsDoc.data();
                    form.reset({
                        startDate: data.startDate?.toDate(),
                        endDate: data.endDate?.toDate(),
                        testStartDate: data.testStartDate?.toDate(),
                        testEndDate: data.testEndDate?.toDate(),
                        resultDate: data.resultDate?.toDate(),
                        isTestFree: data.isTestFree || false,
                    });
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch settings.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [form, toast]);


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
            <CardHeader><CardTitle>Manage Scholarship Dates & Settings</CardTitle></CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <FormField
                            control={form.control}
                            name="isTestFree"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                    Make Test Free for All
                                    </FormLabel>
                                    <FormDescription>
                                    If enabled, any user can take the scholarship test without payment approval.
                                    </FormDescription>
                                </div>
                                <FormControl>
                                    <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                </FormItem>
                            )}
                        />
                        <Button type="submit">Save Settings</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

const ScholarshipTestCreator = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TestCreationFormValues>({
    resolver: zodResolver(testCreationSchema),
    defaultValues: {
      title: 'Go Swami National Scholarship Test (GSNST)',
      questions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const onSubmit = async (data: TestCreationFormValues) => {
    setIsLoading(true);
    try {
      const testRef = doc(firestore, 'settings', 'scholarshipTest');
      await setDoc(testRef, {
        ...data,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'Scholarship Test saved successfully.' });
    } catch (error) {
      console.error('Error saving test:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save the test.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create/Manage Scholarship Test</CardTitle>
        <CardDescription>Add or edit questions for the scholarship test.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Title</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Questions</h3>
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-3 relative bg-muted/50">
                  <FormField
                    control={form.control}
                    name={`questions.${index}.text`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question {index + 1}</FormLabel>
                        <FormControl><Textarea {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {Array(4).fill(0).map((_, optionIndex) => (
                    <FormField
                      key={optionIndex}
                      control={form.control}
                      name={`questions.${index}.options.${optionIndex}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Option {optionIndex + 1}</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  <FormField
                    control={form.control}
                    name={`questions.${index}.correctAnswer`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correct Answer</FormLabel>
                        <FormControl><Input placeholder="Copy one of the options above" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 h-7 w-7">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => append({ text: '', options: ['', '', '', ''], correctAnswer: '' })}>
                <PlusCircle className="mr-2" />Add Question
              </Button>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Scholarship Test
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};


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
            <ScholarshipTestCreator />

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

    

    