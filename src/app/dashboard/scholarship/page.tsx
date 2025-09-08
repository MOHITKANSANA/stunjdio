
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ApplyForm } from "./_components/apply-form";
import { OnlineTest } from "./_components/online-test";
import { ViewResult } from "./_components/view-result";
import { ScrutinyForm } from "./_components/scrutiny-form";
import { Award, FileText, PenSquare, Eye, Search } from "lucide-react";
import { cn } from '@/lib/utils';

type ActiveTab = 'apply' | 'test' | 'result' | 'review';

const tabItems: { id: ActiveTab; label: string; icon: React.ElementType, color: string }[] = [
    { id: 'apply', label: 'Apply for Scholarship', icon: PenSquare, color: 'bg-blue-500' },
    { id: 'test', label: 'Online Test', icon: FileText, color: 'bg-green-500' },
    { id: 'result', label: 'View Result', icon: Eye, color: 'bg-yellow-500' },
    { id: 'review', label: 'Scrutiny/Review', icon: Search, color: 'bg-purple-500' },
];

export default function ScholarshipPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('apply');

  const renderContent = () => {
    switch (activeTab) {
        case 'apply':
            return <ApplyForm />
        case 'test':
             return (
                 <Card>
                    <CardHeader>
                    <CardTitle>Online Scholarship Test</CardTitle>
                    <CardDescription>Enter your registration number to begin the test.</CardDescription>
                    </CardHeader>
                    <CardContent><OnlineTest /></CardContent>
                </Card>
             )
        case 'result':
             return (
                <Card>
                    <CardHeader>
                    <CardTitle>Check Your Result</CardTitle>
                    <CardDescription>Enter your registration number to see your test score.</CardDescription>
                    </CardHeader>
                    <CardContent><ViewResult /></CardContent>
                </Card>
             )
        case 'review':
             return (
                <Card>
                    <CardHeader>
                    <CardTitle>Answer Sheet Scrutiny</CardTitle>
                    <CardDescription>If you believe there was an error in your test evaluation, please submit a review request.</CardDescription>
                    </CardHeader>
                    <CardContent><ScrutinyForm /></CardContent>
                </Card>
             )
        default:
            return null;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
      <div className="text-center">
        <Award className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Student Scholarship Portal</h1>
        <p className="text-muted-foreground mt-2">Apply for scholarships, take tests, and view your results.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tabItems.map(item => (
            <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                    "flex flex-col items-center justify-center text-white p-4 rounded-lg shadow-md transition-all transform hover:-translate-y-1",
                    item.color,
                    activeTab === item.id ? 'ring-4 ring-offset-2 ring-blue-500' : 'hover:shadow-lg'
                )}
            >
                <item.icon className="h-8 w-8 mb-2" />
                <span className="font-semibold text-center text-sm">{item.label}</span>
            </button>
        ))}
      </div>

      <div className="mt-8">
        {renderContent()}
      </div>
    </div>
  )
}
