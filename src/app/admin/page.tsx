
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddCourseForm } from "./_components/add-course-form";
import { ManageLiveClass } from "./_components/manage-live-class";
import { AddEbookForm } from "./_components/add-ebook-form";
import { AddPaperForm } from "./_components/add-paper-form";
import { AddTestSeriesForm } from "./_components/add-test-series-form";
import { ManageEnrollments } from "./_components/manage-enrollments";
import { ManageScholarships } from "./_components/manage-scholarships";
import { ManagePointRequests } from "./_components/manage-point-requests";
import { AddKidsVideoForm } from "./_components/add-kids-video-form";
import { AddContentToCourseForm } from "./_components/add-content-to-course-form";
import { HtmlEditor } from "./_components/html-editor";
import { AddEducatorForm } from "./_components/add-educator-form";
import { ManageTestSeriesEnrollments } from "./_components/manage-test-series-enrollment";
import { AppSettingsForm } from "./_components/app-settings-form";
import { ManageUsers } from "./_components/manage-users";
import { ManagePromotions } from "./_components/manage-promotions";
import { SendNotificationsForm } from "./_components/send-notifications-form";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, query, where, doc, deleteDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ManageCoupons } from "./_components/manage-coupons";
import { ManageEbookEnrollments } from "./_components/manage-ebook-enrollments";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EditContentForm } from "./_components/edit-content-form";
import { RevenueDashboard } from "./_components/revenue-dashboard";
import { ManagePaperEnrollments } from "./_components/manage-paper-enrollments";


const PwaInstallations = () => {
    const [users, loading, error] = useCollection(
        query(collection(firestore, 'users'), where('pwaInstalled', '==', true))
    );
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>PWA Installations</CardTitle>
                <CardDescription>Users who have installed the app on their device.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading && <Skeleton className="h-48 w-full" />}
                {error && <p className="text-destructive">Error: {error.message}</p>}
                {!loading && users && (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Installed At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.docs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                                        No PWA installations recorded yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {users.docs.map(doc => {
                                const user = doc.data();
                                return (
                                    <TableRow key={doc.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={user.photoURL} />
                                                    <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.displayName}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {user.pwaInstalledAt ? new Date(user.pwaInstalledAt.seconds * 1000).toLocaleString() : 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}

const ManageAllContent = () => {
    const { toast } = useToast();
    const [courses, coursesLoading] = useCollection(collection(firestore, 'courses'));
    const [liveClasses, liveClassesLoading] = useCollection(collection(firestore, 'live_classes'));
    const [ebooks, ebooksLoading] = useCollection(collection(firestore, 'ebooks'));
    const [testSeries, testSeriesLoading] = useCollection(collection(firestore, 'testSeries'));
    const [previousPapers, previousPapersLoading] = useCollection(collection(firestore, 'previousPapers'));


    const [editItem, setEditItem] = useState<{ id: string; collection: string; } | null>(null);

    const handleDelete = async (collectionName: string, docId: string, title: string) => {
        if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
            try {
                await deleteDoc(doc(firestore, collectionName, docId));
                toast({ description: `"${title}" has been deleted.` });
            } catch (error: any) {
                toast({ variant: 'destructive', description: `Failed to delete: ${error.message}` });
            }
        }
    };
    
    const handleEditClose = (wasUpdated: boolean) => {
        if (wasUpdated) {
            // Potentially re-fetch data here if needed, though Firestore real-time updates should handle it.
        }
        setEditItem(null);
    }

    const renderTable = (title: string, data: any, loading: boolean, collectionName: string) => (
        <Card>
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent>
                {loading && <Skeleton className="h-24 w-full" />}
                {!loading && (
                    <Table>
                        <TableHeader>
                            <TableRow><TableHead>Title</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.docs.length === 0 ? (
                                <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No content found.</TableCell></TableRow>
                            ) : data?.docs.map((d: any) => (
                                <TableRow key={d.id}>
                                    <TableCell>{d.data().title}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {['courses', 'ebooks', 'testSeries', 'previousPapers'].includes(collectionName) && (
                                            <Button variant="outline" size="icon" onClick={() => setEditItem({ id: d.id, collection: collectionName })}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(collectionName, d.id, d.data().title)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            {editItem && (
                 <Dialog open={!!editItem} onOpenChange={(isOpen) => !isOpen && setEditItem(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Content</DialogTitle>
                            <DialogDescription>
                                Modify the price and availability of the selected item.
                            </DialogDescription>
                        </DialogHeader>
                        <EditContentForm 
                            collectionName={editItem.collection}
                            docId={editItem.id}
                            onClose={handleEditClose}
                        />
                    </DialogContent>
                </Dialog>
            )}
            {renderTable("Manage Courses", courses, coursesLoading, 'courses')}
            {renderTable("Manage Live Classes", liveClasses, liveClassesLoading, 'live_classes')}
            {renderTable("Manage E-Books", ebooks, ebooksLoading, 'ebooks')}
            {renderTable("Manage Test Series", testSeries, testSeriesLoading, 'testSeries')}
            {renderTable("Manage Previous Year Papers", previousPapers, previousPapersLoading, 'previousPapers')}
        </div>
    );
};


export default function AdminPage() {
    return (
        <div className="space-y-8 p-4 md:p-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">Manage your application content and users.</p>
            </div>
            
             <Tabs defaultValue="revenue" className="w-full" orientation="vertical">
                <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 md:w-48 lg:w-56 shrink-0 h-max">
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="manage_content">Manage Content</TabsTrigger>
                    <TabsTrigger value="users">Manage Users</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="course_enrollments">Course Enrollments</TabsTrigger>
                    <TabsTrigger value="test_enrollments">Test Enrollments</TabsTrigger>
                    <TabsTrigger value="ebook_enrollments">E-Book Enrollments</TabsTrigger>
                    <TabsTrigger value="paper_enrollments">Paper Enrollments</TabsTrigger>
                    <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
                    <TabsTrigger value="kids_tube">Kids Tube</TabsTrigger>
                    <TabsTrigger value="coupons">Coupons</TabsTrigger>
                    <TabsTrigger value="promotions">Promotions</TabsTrigger>
                    <TabsTrigger value="pwa">PWA Installations</TabsTrigger>
                    <TabsTrigger value="html_editor">HTML Editor</TabsTrigger>
                    <TabsTrigger value="settings">App Settings</TabsTrigger>
                </TabsList>
                
                 <TabsContent value="revenue" className="mt-6 md:mt-0">
                   <RevenueDashboard />
                </TabsContent>

                <TabsContent value="content" className="mt-6 md:mt-0">
                    <div className="grid gap-8 lg:grid-cols-2">
                        <div className="space-y-8">
                            <Card>
                                <CardHeader><CardTitle>Add New Course</CardTitle></CardHeader>
                                <CardContent><AddCourseForm /></CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Add Content to Existing Course</CardTitle></CardHeader>
                                <CardContent><AddContentToCourseForm /></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Add New E-Book</CardTitle></CardHeader>
                                <CardContent><AddEbookForm /></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Add New Test Series</CardTitle></CardHeader>
                                <CardContent><AddTestSeriesForm /></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Add New Educator</CardTitle></CardHeader>
                                <CardContent><AddEducatorForm /></CardContent>
                            </Card>
                        </div>
                        <div className="space-y-8">
                            <Card>
                                <CardHeader><CardTitle>Add New Live Class</CardTitle></CardHeader>
                                <CardContent><ManageLiveClass /></CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle>Add Previous Paper</CardTitle></CardHeader>
                                <CardContent><AddPaperForm /></CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="manage_content" className="mt-6 md:mt-0">
                    <ManageAllContent />
                </TabsContent>

                <TabsContent value="users" className="mt-6 md:mt-0">
                    <ManageUsers />
                </TabsContent>

                 <TabsContent value="notifications" className="mt-6 md:mt-0">
                    <Card>
                        <CardHeader>
                            <CardTitle>Send Push Notifications</CardTitle>
                            <CardDescription>Send a notification to all subscribed users.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SendNotificationsForm />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="course_enrollments" className="mt-6 md:mt-0">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Course Enrollments</CardTitle>
                            <CardDescription>Approve or reject student course enrollment requests.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ManageEnrollments />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="test_enrollments" className="mt-6 md:mt-0">
                     <Card>
                        <CardHeader>
                            <CardTitle>Manage Test Series Enrollments</CardTitle>
                            <CardDescription>Approve or reject student test series enrollment requests.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ManageTestSeriesEnrollments />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ebook_enrollments" className="mt-6 md:mt-0">
                     <Card>
                        <CardHeader>
                            <CardTitle>Manage E-Book Enrollments</CardTitle>
                            <CardDescription>Approve or reject student E-Book purchase requests.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ManageEbookEnrollments />
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="paper_enrollments" className="mt-6 md:mt-0">
                     <Card>
                        <CardHeader>
                            <CardTitle>Manage Paper Enrollments</CardTitle>
                            <CardDescription>Approve or reject student paper purchase requests.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ManagePaperEnrollments />
                        </CardContent>
                    </Card>
                </TabsContent>


                <TabsContent value="scholarships" className="mt-6 md:mt-0">
                    <ManageScholarships />
                </TabsContent>

                <TabsContent value="kids_tube" className="mt-6 md:mt-0">
                     <div className="grid gap-8 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Add New Kids Tube Video</CardTitle>
                                <CardDescription>Add a new video to the Kids Tube section.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <AddKidsVideoForm />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Kids Tube Point Requests</CardTitle>
                                <CardDescription>Award extra points to kids.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ManagePointRequests />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="coupons" className="mt-6 md:mt-0">
                    <ManageCoupons />
                </TabsContent>

                 <TabsContent value="promotions" className="mt-6 md:mt-0">
                    <ManagePromotions />
                </TabsContent>

                <TabsContent value="pwa" className="mt-6 md:mt-0">
                    <PwaInstallations />
                </TabsContent>

                <TabsContent value="html_editor" className="mt-6 md:mt-0">
                    <HtmlEditor />
                </TabsContent>

                <TabsContent value="settings" className="mt-6 md:mt-0">
                    <AppSettingsForm />
                </TabsContent>

            </Tabs>
        </div>
    );
}

    