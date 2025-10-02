
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddCourseForm } from "./_components/add-course-form";
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
                            <CardTitle>Add New Live Class</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ManageLiveClass />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                   {/* Other management components will go here once implemented */}
                </div>

            </div>
        </div>
    );
}
