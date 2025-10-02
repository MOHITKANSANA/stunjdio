
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


export default function AdminPage() {

    return (
        <div className="space-y-8 p-4 md:p-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">Manage your application content and users.</p>
            </div>
            
             <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
                    <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
                    <TabsTrigger value="kids_tube">Kids Tube</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="mt-6">
                    <div className="grid gap-8 lg:grid-cols-2">
                        <div className="space-y-8">
                            <Card>
                                <CardHeader><CardTitle>Add New Course</CardTitle></CardHeader>
                                <CardContent><AddCourseForm /></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Add New E-Book</CardTitle></CardHeader>
                                <CardContent><AddEbookForm /></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Add New Test Series</CardTitle></CardHeader>
                                <CardContent><AddTestSeriesForm /></CardContent>
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

                <TabsContent value="enrollments" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Manage Enrollments</CardTitle>
                            <CardDescription>Approve or reject student course enrollment requests.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ManageEnrollments />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="scholarships" className="mt-6">
                    <ManageScholarships />
                </TabsContent>

                <TabsContent value="kids_tube" className="mt-6">
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

            </Tabs>
        </div>
    );
}
