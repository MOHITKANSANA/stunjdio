
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ApplyForm } from "./_components/apply-form";
import { OnlineTest } from "./_components/online-test";
import { ViewResult } from "./_components/view-result";
import { ScrutinyForm } from "./_components/scrutiny-form";
import { Award, FileText, PenSquare, Eye, Search, AlertTriangle, Clock } from "lucide-react";
import { cn } from '@/lib/utils';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ActiveTab = 'apply' | 'test' | 'result' | 'review';

const tabItems: { id: ActiveTab; label: string; icon: React.ElementType, color: string }[] = [
    { id: 'apply', label: 'Apply for Scholarship', icon: PenSquare, color: 'bg-blue-500' },
    { id: 'test', label: 'Online Test', icon: FileText, color: 'bg-green-500' },
    { id: 'result', label: 'View Result', icon: Eye, color: 'bg-yellow-500' },
    { id: 'review', label: 'Scrutiny/Review', icon: Search, color: 'bg-purple-500' },
];

const CountdownTimer = ({ targetDate, onEnd }: { targetDate: Date; onEnd?: () => void }) => {
    const calculateTimeLeft = () => {
        const difference = +targetDate - +new Date();
        let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        } else {
           if (onEnd) onEnd();
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    return (
        <div className="flex justify-center gap-4 text-center">
            {Object.entries(timeLeft).map(([interval, value]) => (
                <div key={interval} className="flex flex-col p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg w-20">
                    <span className="text-3xl font-bold">{String(value).padStart(2, '0')}</span>
                    <span className="text-xs uppercase text-muted-foreground">{interval}</span>
                </div>
            ))}
        </div>
    );
};


export default function ScholarshipPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('apply');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<'closed' | 'open' | 'upcoming'>('closed');
  const [testStatus, setTestStatus] = useState<'closed' | 'open' | 'upcoming'>('closed');

  const fetchSettings = async () => {
        try {
            const settingsDoc = await getDoc(doc(firestore, 'settings', 'scholarship'));
            if (settingsDoc.exists()) {
                const data = settingsDoc.data();
                setSettings(data);
                const now = new Date();

                const appStartDate = data.startDate?.toDate();
                const appEndDate = data.endDate?.toDate();
                if (appStartDate && appEndDate) {
                    if (now < appStartDate) setApplicationStatus('upcoming');
                    else if (now >= appStartDate && now <= appEndDate) setApplicationStatus('open');
                    else setApplicationStatus('closed');
                }

                const testStartDate = data.testStartDate?.toDate();
                const testEndDate = data.testEndDate?.toDate();
                if (testStartDate && testEndDate) {
                    if (now < testStartDate) setTestStatus('upcoming');
                    else if (now >= testStartDate && now <= testEndDate) setTestStatus('open');
                    else setTestStatus('closed');
                }
            }
        } catch (error) {
            console.error("Failed to fetch scholarship settings:", error);
        } finally {
            setLoading(false);
        }
    };
  
  useEffect(() => {
    fetchSettings();
  }, []);

  const renderContent = () => {
    if (loading) {
        return <Skeleton className="w-full h-96" />;
    }

    const renderApplicationContent = () => {
        if (applicationStatus === 'upcoming' && settings?.startDate) {
            return (
                <Card className="text-center">
                    <CardHeader><CardTitle>Applications Open Soon!</CardTitle></CardHeader>
                    <CardContent>
                        <p className="mb-4">Applications will open on {settings.startDate.toDate().toLocaleString()}.</p>
                        <CountdownTimer targetDate={settings.startDate.toDate()} onEnd={fetchSettings} />
                    </CardContent>
                </Card>
            );
        }
        if (applicationStatus === 'closed') {
             return (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Applications Closed</AlertTitle>
                    <AlertDescription>
                        Scholarship applications are not open at this time. Please check back later.
                    </AlertDescription>
                </Alert>
            );
        }
        return <ApplyForm />;
    };

    const renderTestContent = () => {
        if (testStatus === 'upcoming' && settings?.testStartDate) {
            return (
                <Card className="text-center">
                    <CardHeader><CardTitle>Online Test Starts Soon!</CardTitle></CardHeader>
                    <CardContent>
                        <p className="mb-4">The online test will be available from {settings.testStartDate.toDate().toLocaleString()}.</p>
                         <CountdownTimer targetDate={settings.testStartDate.toDate()} onEnd={fetchSettings} />
                    </CardContent>
                </Card>
            );
        }
        if (testStatus === 'closed') {
             return (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Test Window Closed</AlertTitle>
                    <AlertDescription>The online test is no longer available.</AlertDescription>
                </Alert>
            );
        }
        return <OnlineTest />;
    };


    switch (activeTab) {
        case 'apply': return renderApplicationContent();
        case 'test': return renderTestContent();
        case 'result': return <ViewResult />;
        case 'review': return (
            <Card>
                <CardHeader>
                    <CardTitle>Answer Sheet Scrutiny</CardTitle>
                    <CardDescription>If you believe there was an error in your test evaluation, please submit a review request.</CardDescription>
                </CardHeader>
                <CardContent><ScrutinyForm /></CardContent>
            </Card>
        );
        default: return null;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
      <div className="text-center">
        <Award className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Student Scholarship Portal</h1>
        <p className="text-muted-foreground mt-2">Apply for scholarships, take tests, and view your results.</p>
      </div>
      
       <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {tabItems.map(item => (
            <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                    "flex flex-col items-center justify-center text-white p-4 rounded-lg shadow-md transition-all transform hover:-translate-y-1 aspect-square",
                    item.color,
                    activeTab === item.id ? 'ring-4 ring-offset-2 ring-blue-500 dark:ring-blue-400' : 'hover:shadow-lg'
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
