
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddCourseForm } from "./_components/add-course-form";
import { AddTestSeriesForm } from "./_components/add-test-series-form";
import { AddEbookForm } from "./_components/add-ebook-form";
import { AddPaperForm } from "./_components/add-paper-form";
import { ManageEnrollments } from "./_components/manage-enrollments";
import { ManageScholarships } from "./_components/manage-scholarships";
import { ManageUsers } from "./_components/manage-users";
import { ManageLiveClass } from "./_components/manage-live-class";

export default function AdminPage() {

    return (
        <div className="space-y-8 p-4 md:p-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-2">Manage your application content and users.</p>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Course</CardTitle>
                            <CardDescription>Create a new course with details and pricing.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddCourseForm />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Test Series</CardTitle>
                            <CardDescription>Create a new test series with questions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddTestSeriesForm />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New E-Book</CardTitle>
                            <CardDescription>Upload a new e-book for students.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddEbookForm />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Add Previous Year Paper</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AddPaperForm />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Live Class</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ManageLiveClass />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                    <Card>
                         <CardHeader>
                            <CardTitle>Manage Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ManageUsers />
                        </CardContent>
                    </Card>
                     <Card>
                         <CardHeader>
                            <CardTitle>Manage Enrollments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ManageEnrollments />
                        </CardContent>
                    </Card>
                     <Card>
                         <CardHeader>
                            <CardTitle>Manage Scholarships</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ManageScholarships />
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
