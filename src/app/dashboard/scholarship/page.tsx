
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ApplyForm } from "./_components/apply-form";
import { OnlineTest } from "./_components/online-test";
import { ViewResult } from "./_components/view-result";
import { ScrutinyForm } from "./_components/scrutiny-form";
import { Award } from "lucide-react";

export default function ScholarshipPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
      <div className="text-center">
        <Award className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Student Scholarship Portal</h1>
        <p className="text-muted-foreground mt-2">Apply for scholarships, take tests, and view your results.</p>
      </div>
      
      <Tabs defaultValue="apply" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="apply">Apply for Scholarship</TabsTrigger>
          <TabsTrigger value="test">Online Test</TabsTrigger>
          <TabsTrigger value="result">View Result</TabsTrigger>
          <TabsTrigger value="review">Scrutiny/Review</TabsTrigger>
        </TabsList>
        <TabsContent value="apply">
          <Card>
            <CardHeader>
              <CardTitle>Scholarship Application</CardTitle>
              <CardDescription>Fill out your details to apply for the scholarship program.</CardDescription>
            </CardHeader>
            <CardContent>
              <ApplyForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Online Scholarship Test</CardTitle>
              <CardDescription>Enter your registration number to begin the test.</CardDescription>
            </CardHeader>
            <CardContent>
              <OnlineTest />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="result">
          <Card>
            <CardHeader>
              <CardTitle>Check Your Result</CardTitle>
              <CardDescription>Enter your registration number to see your test score.</CardDescription>
            </CardHeader>
            <CardContent>
              <ViewResult />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Answer Sheet Scrutiny</CardTitle>
              <CardDescription>If you believe there was an error in your test evaluation, please submit a review request.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrutinyForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
