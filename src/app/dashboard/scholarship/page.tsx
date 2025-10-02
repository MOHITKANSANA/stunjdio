

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ApplyForm } from "./_components/apply-form";
import { OnlineTest } from "./_components/online-test";
import { ViewResult } from "./_components/view-result";
import { ScrutinyForm } from "./_components/scrutiny-form";
import { Award, FileText, PenSquare, Eye, Search, AlertTriangle, FileSignature } from "lucide-react";
import { cn } from '@/lib/utils';
import { doc, getDoc, collection, query, where, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Button } from '@/components/ui/button';

type ActiveTab = 'apply' | 'test' | 'result' | 'review' | 'history';

const CountdownTimer = ({ targetDate, onEnd }: { targetDate: Date; onEnd: () => void; }) => {
    const calculateTimeLeft = useCallback(() => {
        const difference = +targetDate - +new Date();
        if (difference > 0) {
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        } else {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        if (+targetDate < +new Date()) {
            onEnd();
            return;
        }

        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);
            if (newTimeLeft.days === 0 && newTimeLeft.hours === 0 && newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
                onEnd();
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate, onEnd, calculateTimeLeft]);


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

const ScholarshipHistory = () => {
    const { user } = useAuth();
    // Corrected query: Firestore requires the orderBy field to be the first field in a composite index.
    // To avoid this, we can order by appliedAt and filter on the client, or create the index.
    // A simpler query that avoids the index is to just query by userId.
    const [applications, loading, error] = useCollection(
        user ? query(collection(firestore, 'scholarshipApplications'), where('userId', '==', user.uid)) : null
    );

    const sortedApplications = applications?.docs.sort((a, b) => {
        const dateA = a.data().appliedAt?.toDate() || 0;
        const dateB = b.data().appliedAt?.toDate() || 0;
        return dateB - dateA; // Sort descending
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Applications</CardTitle>
                <CardDescription>View your past scholarship applications.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading && <Skeleton className="h-24 w-full" />}
                {error && <Alert variant="destructive"><AlertDescription>Could not load your applications: {error.message}</AlertDescription></Alert>}
                {!loading && (!sortedApplications || sortedApplications.length === 0) && (
                    <p className="text-muted-foreground text-center">You have not applied for any scholarships yet.</p>
                )}
                <div className="space-y-4">
                    {sortedApplications?.map(doc => {
                        const app = doc.data();
                        return (
                            <div key={doc.id} className="p-4 border rounded-lg">
                                <p className="font-bold">Application Number: {app.applicationNumber}</p>
                                <p className="text-sm">Applied for: {app.scholarshipType}</p>
                                {app.courseTitle && <p className="text-sm">Course: {app.courseTitle}</p>}
                                <p className="text-xs text-muted-foreground mt-2">Applied on: {app.appliedAt.toDate().toLocaleDateString()}</p>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
};


export default function ScholarshipPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('apply');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Use state to manage statuses derived from settings
  const [applicationStatus, setApplicationStatus] = useState<'closed' | 'open' | 'upcoming'>('closed');
  const [testStatus, setTestStatus] = useState<'closed' | 'open' | 'upcoming'>('closed');
  
  // Use a key to force re-render of history component
  const [historyKey, setHistoryKey] = useState(0);

  const fetchSettings = useCallback(async () => {
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
  }, []); // Empty dependency array means this is stable and won't change.


  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleFormSubmit = () => {
    // Increment key to force ScholarshipHistory to re-fetch data
    setHistoryKey(prev => prev + 1);
  };
  
  const tabItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'apply', label: 'Apply', icon: PenSquare },
    { id: 'test', label: 'Online Test', icon: FileText },
    { id: 'result', label: 'View Result', icon: Eye },
    { id: 'review', label: 'Scrutiny', icon: Search },
    { id: 'history', label: 'My Applications', icon: FileSignature },
];

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
        return <ApplyForm onFormSubmit={handleFormSubmit} />;
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
        case 'history': return <ScholarshipHistory key={historyKey} />;
        default: return null;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <Award className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Go Swami National Scholarship Test (GSNST)</h1>
        <p className="text-muted-foreground mt-2">Apply for scholarships, take tests, and view your results.</p>
      </div>
      
       <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-4">
        {tabItems.map(item => (
            <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'outline'}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                    "flex flex-col items-center justify-center h-24 text-center p-2 rounded-lg shadow-md transition-all transform hover:-translate-y-1"
                )}
            >
                <item.icon className="h-8 w-8 mb-2" />
                <span className="font-semibold text-xs leading-tight">{item.label}</span>
            </Button>
        ))}
      </div>

      <div className="mt-8">
        {renderContent()}
      </div>
    </div>
  )
}
