
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Check, X, Upload, Video, FileText, StickyNote, PlusCircle, Save } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Image from 'next/image';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const courseFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(3, 'Category must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  imageFile: z.instanceof(File).optional(),
});
type CourseFormValues = z.infer<typeof courseFormSchema>;

const liveClassFormSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    youtubeUrl: z.string().url('Must be a valid YouTube URL'),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date format' }),
});
type LiveClassFormValues = z.infer<typeof liveClassFormSchema>;

const qrCodeFormSchema = z.object({
    imageFile: z.instanceof(File, { message: 'Please upload an image file.' }),
});
type QrCodeFormValues = z.infer<typeof qrCodeFormSchema>;

const courseContentSchema = z.object({
    courseId: z.string().min(1, "Please select a course."),
    contentType: z.enum(['video', 'pdf', 'note']),
    title: z.string().min(3, 'Content title is required.'),
    url: z.string().url('A valid URL is required.'),
});
type CourseContentValues = z.infer<typeof courseContentSchema>;

const scholarshipSettingsSchema = z.object({
    startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
    endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid date' }),
});
type ScholarshipSettingsValues = z.infer<typeof scholarshipSettingsSchema>;

const scholarshipQuestionSchema = z.object({
    text: z.string().min(5, 'Question text is required'),
    options: z.array(z.string().min(1)).length(4, 'There must be 4 options'),
    correctAnswer: z.string().min(1, 'Please select the correct answer'),
});
type ScholarshipQuestionValues = z.infer<typeof scholarshipQuestionSchema>;

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
};

export default function AdminPage() {
  const [enrollmentsCollection, enrollmentsLoading] = useCollection(query(collection(firestore, 'enrollments'), orderBy('createdAt', 'desc')));
  const [liveClassesCollection, liveClassesLoading] = useCollection(query(collection(firestore, 'live_classes'), orderBy('startTime', 'desc')));
  const [coursesCollection] = useCollection(query(collection(firestore, 'courses'), orderBy('title', 'asc')));
  const [qrCodeDoc] = useCollection(collection(firestore, 'settings'));
  const [scholarshipSettingsDoc, scholarshipSettingsLoading] = useCollection(collection(firestore, 'settings'));
  const [scholarshipQuestionsCollection, scholarshipQuestionsLoading] = useCollection(query(collection(firestore, 'scholarshipTest'), orderBy('createdAt', 'asc')));
  const [scholarshipApplicants, scholarshipApplicantsLoading] = useCollection(query(collection(firestore, 'scholarshipApplications'), orderBy('appliedAt', 'desc')));

  const qrCodeUrl = qrCodeDoc?.docs.find(d => d.id === 'paymentQrCode')?.data().url;
  const scholarshipSettings = scholarshipSettingsDoc?.docs.find(d => d.id === 'scholarship')?.data();


  const { toast } = useToast();
  
  const courseForm = useForm<CourseFormValues>({ resolver: zodResolver(courseFormSchema) });
  const liveClassForm = useForm<LiveClassFormValues>({ resolver: zodResolver(liveClassFormSchema) });
  const qrCodeForm = useForm<QrCodeFormValues>({ resolver: zodResolver(qrCodeFormSchema) });
  const courseContentForm = useForm<CourseContentValues>({ resolver: zodResolver(courseContentSchema) });
  const scholarshipSettingsForm = useForm<ScholarshipSettingsValues>({
    resolver: zodResolver(scholarshipSettingsSchema),
    values: {
      startDate: scholarshipSettings?.startDate?.toDate()?.toISOString().substring(0, 16) || '',
      endDate: scholarshipSettings?.endDate?.toDate()?.toISOString().substring(0, 16) || '',
    },
  });
  const scholarshipQuestionForm = useForm<ScholarshipQuestionValues>({ resolver: zodResolver(scholarshipQuestionSchema) });


  const handleEnrollmentAction = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(firestore, 'enrollments', id), { status: newStatus });
      toast({ title: 'Success', description: `Enrollment has been ${newStatus}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update enrollment status.' });
    }
  };
  
  const uploadImage = async (file: File, path: string): Promise<string> => {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    const dataUrl = await fileToDataUrl(file);
    await uploadString(storageRef, dataUrl, 'data_url');
    return getDownloadURL(storageRef);
  };

  const onCourseSubmit = async (data: CourseFormValues) => {
    try {
      let imageUrl = 'https://picsum.photos/600/400';
      if (data.imageFile) {
        imageUrl = await uploadImage(data.imageFile, `courses/${Date.now()}-${data.imageFile.name}`);
      }
      
      await addDoc(collection(firestore, 'courses'), { ...data, imageUrl, createdAt: serverTimestamp() });
      toast({ title: 'Success', description: 'Course created successfully.' });
      courseForm.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create course.' });
    }
  };

  const onLiveClassSubmit = async (data: LiveClassFormValues) => {
    try {
        await addDoc(collection(firestore, 'live_classes'), { ...data, startTime: new Date(data.startTime), createdAt: serverTimestamp() });
        toast({ title: 'Success', description: 'Live class added.' });
        liveClassForm.reset();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add live class.' });
    }
  };

  const onCourseContentSubmit = async (data: CourseContentValues) => {
    try {
        await addDoc(collection(firestore, 'courses', data.courseId, 'content'), { type: data.contentType, title: data.title, url: data.url, createdAt: serverTimestamp() });
        toast({ title: 'Success', description: 'Content added to course.' });
        courseContentForm.reset();
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not add content.' });
    }
  };

  const deleteLiveClass = async (id: string) => {
    if(window.confirm('Are you sure you want to delete this class?')) {
        await deleteDoc(doc(firestore, 'live_classes', id));
        toast({ description: 'Live class deleted.' });
    }
  }
  
  const onQrCodeSubmit = async (data: QrCodeFormValues) => {
    try {
      const imageUrl = await uploadImage(data.imageFile, `settings/qr-code.jpg`);
      await setDoc(doc(firestore, 'settings', 'paymentQrCode'), { url: imageUrl });
      toast({ title: 'Success', description: 'QR Code updated.' });
      qrCodeForm.reset();
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Could not update QR code.' });
    }
  };

  const onScholarshipSettingsSubmit = async (data: ScholarshipSettingsValues) => {
    try {
      await setDoc(doc(firestore, 'settings', 'scholarship'), {
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });
      toast({ title: 'Success', description: 'Scholarship settings saved.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save settings.' });
    }
  };

  const onScholarshipQuestionSubmit = async (data: ScholarshipQuestionValues) => {
    try {
      await addDoc(collection(firestore, 'scholarshipTest'), { ...data, createdAt: serverTimestamp() });
      toast({ title: 'Success', description: 'Question added.' });
      scholarshipQuestionForm.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add question.' });
    }
  };

  const deleteScholarshipQuestion = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      await deleteDoc(doc(firestore, 'scholarshipTest', id));
      toast({ description: 'Question deleted.' });
    }
  };
  
  const handleScholarshipApplicantAction = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(firestore, 'scholarshipApplications', id), { status: newStatus });
      toast({ title: 'Success', description: `Applicant has been ${newStatus}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update applicant status.' });
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6">
      <h1 className="text-3xl font-semibold font-headline">Administration</h1>
      <Tabs defaultValue="enrollments">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="content">Content Management</TabsTrigger>
          <TabsTrigger value="scholarship">Scholarship</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="enrollments">
           <Card>
            <CardHeader><CardTitle>Enrollment Requests</CardTitle><CardDescription>Review and approve student course enrollments.</CardDescription></CardHeader>
            <CardContent>
              <div className="max-h-[800px] overflow-y-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Request</TableHead><TableHead>Screenshot</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {enrollmentsLoading && Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-12 w-full" /></TableCell></TableRow>
                    ))}
                    {enrollmentsCollection?.docs.map((doc) => {
                      const enrollment = doc.data();
                      return (
                        <TableRow key={doc.id}>
                          <TableCell><div className="font-medium">{enrollment.userDisplayName}</div><div className="text-sm text-muted-foreground">{enrollment.userEmail}</div></TableCell>
                          <TableCell>{enrollment.courseTitle}</TableCell>
                          <TableCell>
                            <Link href={enrollment.screenshotDataUrl} target="_blank" rel="noopener noreferrer">
                              <Image src={enrollment.screenshotDataUrl} alt="Payment Screenshot" width={80} height={80} className="rounded-md object-cover" />
                            </Link>
                          </TableCell>
                          <TableCell><Badge variant={enrollment.status === 'pending' ? 'secondary' : enrollment.status === 'approved' ? 'default' : 'destructive'}>{enrollment.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            {enrollment.status === 'pending' && (
                              <div className="flex gap-2 justify-end">
                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEnrollmentAction(doc.id, 'approved')}><Check className="h-4 w-4 text-green-500" /></Button>
                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEnrollmentAction(doc.id, 'rejected')}><X className="h-4 w-4 text-red-500" /></Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="content">
          <div className="grid md:grid-cols-2 gap-6">
             <Card>
              <CardHeader><CardTitle>Create New Course</CardTitle><CardDescription>Fill out the details below to add a new course.</CardDescription></CardHeader>
              <CardContent><Form {...courseForm}><form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="grid gap-6">
                  <FormField control={courseForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Course Title</FormLabel><FormControl><Input placeholder="e.g. Algebra Fundamentals" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={courseForm.control} name="category" render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g. Maths" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={courseForm.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price (INR)</FormLabel><FormControl><Input type="number" placeholder="e.g. 499" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <FormField control={courseForm.control} name="imageFile" render={({ field }) => (
                    <FormItem><FormLabel>Cover Image</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files?.[0])} /></FormControl><FormMessage /></FormItem>
                  )}/>
                  <FormField control={courseForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A short description of the course content." className="min-h-32" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                  <Button type="submit" disabled={courseForm.formState.isSubmitting}>{courseForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creating...</> : "Create Course"}</Button>
              </form></Form></CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Manage Course Content</CardTitle><CardDescription>Add videos, PDFs, and notes to your courses.</CardDescription></CardHeader>
                    <CardContent>
                        <Form {...courseContentForm}><form onSubmit={courseContentForm.handleSubmit(onCourseContentSubmit)} className="grid gap-4">
                            <FormField control={courseContentForm.control} name="courseId" render={({ field }) => (<FormItem><FormLabel>Select Course</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Choose a course" /></SelectTrigger></FormControl>
                                <SelectContent>{coursesCollection?.docs.map(doc => (<SelectItem key={doc.id} value={doc.id}>{doc.data().title}</SelectItem>))}</SelectContent>
                            </Select><FormMessage /></FormItem>)}/>
                             <FormField control={courseContentForm.control} name="contentType" render={({ field }) => (<FormItem><FormLabel>Content Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Choose a content type" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="video"><div className="flex items-center"><Video className="mr-2 h-4 w-4" />Video (YouTube)</div></SelectItem>
                                    <SelectItem value="pdf"><div className="flex items-center"><FileText className="mr-2 h-4 w-4" />PDF Document</div></SelectItem>
                                    <SelectItem value="note"><div className="flex items-center"><StickyNote className="mr-2 h-4 w-4" />Note</div></SelectItem>
                                </SelectContent>
                            </Select><FormMessage /></FormItem>)}/>
                            <FormField control={courseContentForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Content Title</FormLabel><FormControl><Input placeholder="e.g. Chapter 1: Introduction" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={courseContentForm.control} name="url" render={({ field }) => (<FormItem><FormLabel>URL</FormLabel><FormControl><Input placeholder="https://youtube.com/watch?v=... or https://..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                             <Button type="submit" disabled={courseContentForm.formState.isSubmitting}>{courseContentForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Adding...</> : "Add Content"}</Button>
                        </form></Form>
                    </CardContent>
                </Card>

                 <Card>
                  <CardHeader><CardTitle>Live Class Management</CardTitle><CardDescription>Add, view, and manage live classes.</CardDescription></CardHeader>
                  <CardContent><Form {...liveClassForm}><form onSubmit={liveClassForm.handleSubmit(onLiveClassSubmit)} className="grid gap-4 mb-6">
                      <FormField control={liveClassForm.control} name="title" render={({ field }) => (<FormItem><FormLabel>Class Title</FormLabel><FormControl><Input placeholder="e.g. Maths Special Session" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={liveClassForm.control} name="youtubeUrl" render={({ field }) => (<FormItem><FormLabel>YouTube URL</FormLabel><FormControl><Input placeholder="https://www.youtube.com/watch?v=..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={liveClassForm.control} name="startTime" render={({ field }) => (<FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <Button type="submit" disabled={liveClassForm.formState.isSubmitting}>{liveClassForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Adding...</> : "Add Live Class"}</Button>
                  </form></Form>
                  <h4 className="font-semibold mb-2">Scheduled Classes</h4>
                  <div className="max-h-60 overflow-y-auto pr-2"><Table><TableBody>
                      {liveClassesLoading && <TableRow><TableCell><Skeleton className="h-9 w-full" /></TableCell></TableRow>}
                      {liveClassesCollection?.docs.map(doc => {
                          const liveClass = doc.data();
                          const startTime = liveClass.startTime?.toDate();
                          return (<TableRow key={doc.id}><TableCell>
                              <p className="font-medium">{liveClass.title}</p>
                              <p className="text-sm text-muted-foreground">{startTime ? startTime.toLocaleString() : 'Invalid Date'}</p>
                          </TableCell><TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => deleteLiveClass(doc.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                          </TableCell></TableRow>)
                      })}
                  </TableBody></Table></div></CardContent>
                </Card>
            </div>
           
          </div>
        </TabsContent>
        <TabsContent value="scholarship">
            <div className="grid md:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Scholarship Settings</CardTitle><CardDescription>Set the application start and end dates.</CardDescription></CardHeader>
                        <CardContent>
                            <Form {...scholarshipSettingsForm}><form onSubmit={scholarshipSettingsForm.handleSubmit(onScholarshipSettingsSubmit)} className="grid gap-4">
                                <FormField control={scholarshipSettingsForm.control} name="startDate" render={({ field }) => (<FormItem><FormLabel>Application Start Date</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={scholarshipSettingsForm.control} name="endDate" render={({ field }) => (<FormItem><FormLabel>Application End Date</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <Button type="submit" disabled={scholarshipSettingsForm.formState.isSubmitting}><Save className="mr-2"/>{scholarshipSettingsForm.formState.isSubmitting ? 'Saving...' : 'Save Settings'}</Button>
                            </form></Form>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Scholarship Test Questions</CardTitle><CardDescription>Manage the questions for the online test.</CardDescription></CardHeader>
                        <CardContent>
                             <Form {...scholarshipQuestionForm}><form onSubmit={scholarshipQuestionForm.handleSubmit(onScholarshipQuestionSubmit)} className="grid gap-4 mb-6">
                                <FormField control={scholarshipQuestionForm.control} name="text" render={({ field }) => (<FormItem><FormLabel>Question</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={scholarshipQuestionForm.control} name="options.0" render={({ field }) => (<FormItem><FormLabel>Option 1</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={scholarshipQuestionForm.control} name="options.1" render={({ field }) => (<FormItem><FormLabel>Option 2</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={scholarshipQuestionForm.control} name="options.2" render={({ field }) => (<FormItem><FormLabel>Option 3</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={scholarshipQuestionForm.control} name="options.3" render={({ field }) => (<FormItem><FormLabel>Option 4</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                 <FormField control={scholarshipQuestionForm.control} name="correctAnswer" render={({ field }) => (<FormItem><FormLabel>Correct Answer</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select the correct option" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {scholarshipQuestionForm.watch('options')?.map((opt, i) => opt && (<SelectItem key={i} value={opt}>Option {i + 1}: {opt}</SelectItem>))}
                                        </SelectContent>
                                    </Select><FormMessage /></FormItem>
                                )}/>
                                <Button type="submit" disabled={scholarshipQuestionForm.formState.isSubmitting}><PlusCircle className="mr-2"/>{scholarshipQuestionForm.formState.isSubmitting ? 'Adding...' : 'Add Question'}</Button>
                            </form></Form>
                            <h4 className="font-semibold mb-2">Current Questions</h4>
                            <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
                                {scholarshipQuestionsLoading && <Skeleton className="h-9 w-full" />}
                                {scholarshipQuestionsCollection?.docs.map((doc, i) => (
                                    <div key={doc.id} className="text-sm p-2 border rounded flex justify-between items-center">
                                        <span>{i+1}. {doc.data().text}</span>
                                        <Button variant="ghost" size="icon" onClick={() => deleteScholarshipQuestion(doc.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                 <Card>
                    <CardHeader><CardTitle>Scholarship Applicants</CardTitle><CardDescription>Review and manage scholarship applications.</CardDescription></CardHeader>
                    <CardContent>
                         <div className="max-h-[800px] overflow-y-auto">
                            <Table>
                                <TableHeader><TableRow><TableHead>Applicant</TableHead><TableHead>App#</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {scholarshipApplicantsLoading && <TableRow><TableCell colSpan={5}><Skeleton className="h-12 w-full"/></TableCell></TableRow>}
                                    {scholarshipApplicants?.docs.map(doc => {
                                        const app = doc.data();
                                        return (
                                            <TableRow key={doc.id}>
                                                <TableCell><div className="font-medium">{app.name}</div><div className="text-sm text-muted-foreground">{app.email}</div></TableCell>
                                                <TableCell>{app.applicationNumber}</TableCell>
                                                <TableCell>{app.scholarshipType}</TableCell>
                                                <TableCell><Badge variant={app.status === 'applied' ? 'secondary' : app.status === 'approved' ? 'default' : 'destructive'}>{app.status}</Badge></TableCell>
                                                <TableCell className="text-right">
                                                    {app.status === 'applied' && (
                                                        <div className="flex gap-2 justify-end">
                                                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleScholarshipApplicantAction(doc.id, 'approved')}><Check className="h-4 w-4 text-green-500" /></Button>
                                                            <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleScholarshipApplicantAction(doc.id, 'rejected')}><X className="h-4 w-4 text-red-500" /></Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                         </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader><CardTitle>Payment QR Code</CardTitle><CardDescription>Upload or update the QR code for payments.</CardDescription></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6 items-start">
              <Form {...qrCodeForm}>
                <form onSubmit={qrCodeForm.handleSubmit(onQrCodeSubmit)} className="space-y-4">
                   <FormField control={qrCodeForm.control} name="imageFile" render={({ field }) => (
                      <FormItem><FormLabel>New QR Code Image</FormLabel><FormControl><Input type="file" accept="image/*" onChange={(e) => field.onChange(e.target.files?.[0])} /></FormControl><FormMessage /></FormItem>
                    )}/>
                  <Button type="submit" disabled={qrCodeForm.formState.isSubmitting}>
                    {qrCodeForm.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Uploading...</> : <><Upload className="mr-2 h-4 w-4"/>Upload QR Code</>}
                  </Button>
                </form>
              </Form>
              <div>
                <h4 className="font-semibold mb-2">Current QR Code</h4>
                {qrCodeUrl ? (
                  <Image src={qrCodeUrl} alt="Payment QR Code" width={200} height={200} className="rounded-md border p-2" />
                ) : (
                  <p className="text-muted-foreground">No QR code uploaded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    