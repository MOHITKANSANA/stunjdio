
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


const PwaInstallations = () => {
    // This is a placeholder. Actual implementation requires a backend mechanism
    // to track which users have installed the PWA, likely by having the app
    // report back to the server upon successful installation.
    return (
        <Card>
            <CardHeader>
                <CardTitle>PWA Installations</CardTitle>
                <CardDescription>Users who have installed the app on their device.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center p-8">This feature is under construction.</p>
            </CardContent>
        </Card>
    )
}

export default function AdminPage() {
    return (
        <div className="space-y-8 p-4 md:p-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">Manage your application content and users.</p>
            </div>
            
             <Tabs defaultValue="content" className="w-full" orientation="vertical">
                <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 md:w-48 lg:w-56 shrink-0 h-max">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="users">Manage Users</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="course_enrollments">Course Enrollments</TabsTrigger>
                    <TabsTrigger value="test_enrollments">Test Enrollments</TabsTrigger>
                    <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
                    <TabsTrigger value="kids_tube">Kids Tube</TabsTrigger>
                    <TabsTrigger value="promotions">Promotions</TabsTrigger>
                    <TabsTrigger value="pwa">PWA Installations</TabsTrigger>
                    <TabsTrigger value="html_editor">HTML Editor</TabsTrigger>
                    <TabsTrigger value="settings">App Settings</TabsTrigger>
                </TabsList>
                
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
