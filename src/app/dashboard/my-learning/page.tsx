

'use client';

import { BookOpenCheck, Trophy, Library, BookMarked, BellDot, Newspaper, Trash2, Eye, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/use-auth';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, updateDoc, doc, getDocs, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const PDFViewer = ({ pdfUrl, title, onOpenChange }: { pdfUrl: string, title: string, onOpenChange: (open: boolean) => void }) => {
    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] p-4 flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow">
                    <iframe
                        src={pdfUrl}
                        width="100%"
                        height="100%"
                        className="rounded-lg border"
                        title={title}
                    ></iframe>
                </div>
            </DialogContent>
        </Dialog>
    );
};


const CourseCard = ({ course, courseId, enrollmentId, onUnenroll }: { course: any, courseId: string, enrollmentId: string, onUnenroll: (id: string, title: string) => void }) => {
    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-48 w-full">
                <Image src={course.imageUrl || `https://picsum.photos/seed/${courseId}/600/400`} alt={course.title} fill style={{objectFit: "cover"}} data-ai-hint="online course" />
            </div>
            <CardHeader>
                <CardTitle className="text-xl">{course.title}</CardTitle>
                <CardDescription>{course.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow" />
            <CardFooter className="flex flex-col sm:flex-row gap-2">
                 <Button asChild className="w-full">
                    <Link href={`/dashboard/courses/${courseId}`}>
                       <Eye className="mr-2 h-4 w-4" /> View Course
                    </Link>
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => onUnenroll(enrollmentId, course.title)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Un-enroll
                </Button>
            </CardFooter>
        </Card>
    );
};

const EBookCard = ({ ebook, onClick }: { ebook: any, onClick: () => void }) => {
    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={onClick}>
            <div className="relative h-48 w-full">
                <Image src={ebook.thumbnailUrl || `https://picsum.photos/seed/${ebook.id}/600/400`} alt={ebook.title} fill style={{objectFit: "cover"}} data-ai-hint="book cover" />
            </div>
            <CardHeader>
                <CardTitle className="text-xl">{ebook.title}</CardTitle>
                <CardDescription>{ebook.description}</CardDescription>
            </CardHeader>
        </Card>
    );
}

const DownloadCard = ({ item }: { item: any }) => {
    const { toast } = useToast();
    
    const handleDownloadDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to remove this from your downloads?")) {
            try {
                await deleteDoc(doc(firestore, 'userDownloads', id));
                toast({ description: "Item removed from downloads." });
            } catch (error) {
                toast({ variant: 'destructive', description: "Failed to remove item." });
            }
        }
    };
    
    return (
         <Card>
            <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                 <CardDescription>Type: {item.type}</CardDescription>
            </CardHeader>
            <CardFooter className="gap-2">
                 <a href={item.url} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button className="w-full"><Eye className="mr-2"/>View</Button>
                 </a>
                 <Button variant="destructive" onClick={() => handleDownloadDelete(item.id)}>
                    <Trash2 className="mr-2"/> Remove
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function MyLearningPage() {
    const { user, loading: authLoading } = useAuth();
    const [selectedPdf, setSelectedPdf] = useState<{ url: string, title: string } | null>(null);
    const { toast } = useToast();
    
    const enrollmentsQuery = user 
        ? query(
            collection(firestore, 'enrollments'), 
            where('userId', '==', user.uid),
            where('status', '==', 'approved')
        )
        : null;
    const [enrollments, enrollmentsLoading, enrollmentsError] = useCollection(enrollmentsQuery);

    const enrolledCourseIds = enrollments?.docs.map(doc => doc.data().courseId).filter(Boolean) || [];

    const coursesQuery = user && enrolledCourseIds.length > 0
        ? query(
            collection(firestore, 'courses'),
            where('__name__', 'in', enrolledCourseIds)
        ) : null;
    const [myCourses, myCoursesLoading, myCoursesError] = useCollection(coursesQuery);
    
    const [ebooks, ebooksLoading, ebooksError] = useCollection(
        query(collection(firestore, 'ebooks'), orderBy('createdAt', 'desc'))
    );
    
    const [notifications, notificationsLoading, notificationsError] = useCollection(
        user ? query(collection(firestore, 'users', user.uid, 'notifications'), where('read', '==', false), orderBy('createdAt', 'desc')) : null
    );

    const hasNewReplies = notifications && !notifications.empty;

    
    const handleEbookClick = (ebookData: any) => {
        const pdfUrlWithViewer = `https://docs.google.com/gview?url=${encodeURIComponent(ebookData.fileUrl)}&embedded=true`;
        setSelectedPdf({ url: pdfUrlWithViewer, title: ebookData.title });
    };

    const markAllAsRead = async () => {
        if (!user || !notifications) return;
        const batch = await getDocs(query(collection(firestore, 'users', user.uid, 'notifications'), where('read', '==', false)));
        batch.forEach(async (docSnapshot) => {
            await updateDoc(doc(firestore, 'users', user.uid, 'notifications', docSnapshot.id), { read: true });
        });
    }

    const handleUnenroll = async (enrollmentId: string, courseTitle: string) => {
        if (window.confirm(`Are you sure you want to un-enroll from "${courseTitle}"?`)) {
            try {
                await deleteDoc(doc(firestore, 'enrollments', enrollmentId));
                toast({
                    title: "Un-enrolled successfully",
                    description: `You have been removed from ${courseTitle}.`,
                });
            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Un-enrollment failed",
                    description: "Could not remove you from the course. Please try again.",
                });
            }
        }
    };

    const courseIdToEnrollmentIdMap = enrollments?.docs.reduce((acc, doc) => {
        const data = doc.data();
        if (data.courseId) {
            acc[data.courseId] = doc.id;
        }
        return acc;
    }, {} as Record<string, string>);
    
    return (
        <div className="space-y-8">
             {selectedPdf && (
                <PDFViewer 
                    pdfUrl={selectedPdf.url}
                    title={selectedPdf.title}
                    onOpenChange={(isOpen) => !isOpen && setSelectedPdf(null)}
                />
            )}
            <div>
                 <div className="flex items-center gap-3">
                    <Library className="h-10 w-10 text-primary" />
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">
                        My Learning
                    </h1>
                     {hasNewReplies && (
                        <Badge variant="destructive" className="animate-pulse">
                            <BellDot className="h-4 w-4 mr-1.5"/> New Replies
                        </Badge>
                    )}
                 </div>
                <p className="text-muted-foreground mt-2">All your learning materials in one place.</p>
            </div>
             <Tabs defaultValue="courses" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="courses">My Courses</TabsTrigger>
                    <TabsTrigger value="ebooks">E-Books</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>
                <TabsContent value="courses" className="mt-6">
                    {(authLoading || enrollmentsLoading || myCoursesLoading) && (
                         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                        </div>
                    )}
                     {(enrollmentsError || myCoursesError) && <p className="text-destructive text-center">Could not load your courses.</p>}
                    
                    {!(myCoursesLoading || authLoading || enrollmentsLoading) && (!myCourses || myCourses.empty) && (
                         <div className="text-center py-12">
                            <BookOpenCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No Courses Here</h3>
                            <p className="mt-1 text-sm text-muted-foreground">You haven't enrolled in any courses yet.</p>
                        </div>
                    )}
                    
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {myCourses?.docs.map(doc => {
                             const enrollmentId = courseIdToEnrollmentIdMap?.[doc.id];
                             if (!enrollmentId) return null;
                            return (
                                <CourseCard key={doc.id} course={doc.data()} courseId={doc.id} enrollmentId={enrollmentId} onUnenroll={handleUnenroll}/>
                            )
                        })}
                    </div>
                </TabsContent>
                <TabsContent value="ebooks" className="mt-6">
                     {ebooksLoading && (
                         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                        </div>
                    )}
                    {ebooksError && <p className="text-destructive text-center">Could not load E-books.</p>}
                     {!(ebooksLoading) && (!ebooks || ebooks.empty) && (
                         <div className="text-center py-12">
                            <BookMarked className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No E-Books Available</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Please check back later for new e-books.</p>
                        </div>
                    )}
                     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {ebooks?.docs.map(doc => (
                            <EBookCard key={doc.id} ebook={{id: doc.id, ...doc.data()}} onClick={() => handleEbookClick(doc.data())} />
                        ))}
                    </div>
                </TabsContent>
                 <TabsContent value="notifications" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Notifications</CardTitle>
                                <CardDescription>Replies to your doubts and other updates.</CardDescription>
                            </div>
                            {hasNewReplies && <Button onClick={markAllAsRead}>Mark all as read</Button>}
                        </CardHeader>
                        <CardContent>
                            {notificationsLoading && <Skeleton className="h-24 w-full" />}
                            {notificationsError && <p className="text-destructive">Could not load notifications.</p>}
                            {notifications && !notifications.empty ? (
                                <div className="space-y-4">
                                    {notifications.docs.map(doc => {
                                        const notif = doc.data();
                                        return (
                                            <Link href={`/dashboard/courses/${notif.courseId}?tab=doubts`} key={doc.id}>
                                            <div className="p-3 border rounded-lg hover:bg-muted">
                                                <p><span className="font-bold">{notif.replierName}</span> replied to your doubt:</p>
                                                <p className="text-sm text-muted-foreground italic">"{notif.doubtText}"</p>
                                                <p className="text-xs text-muted-foreground mt-1">{notif.createdAt?.toDate().toLocaleString()}</p>
                                            </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <BellDot className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">No New Notifications</h3>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
