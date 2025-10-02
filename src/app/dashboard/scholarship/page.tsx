
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ApplyForm } from "./_components/apply-form";
import { OnlineTest } from "./_components/online-test";
import { ViewResult } from "./_components/view-result";
import { ScrutinyForm } from "./_components/scrutiny-form";
import { Award, FileText, PenSquare, Eye, Search, AlertTriangle, FileSignature, Ticket, Loader2 } from "lucide-react";
import { cn } from '@/lib/utils';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ActiveTab = 'apply' | 'test' | 'result' | 'review' | 'history' | 'admit-card';

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
                clearInterval(timer);
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

const AdmitCardDownloader = () => {
    const [applicationNumber, setApplicationNumber] = useState('');
    const [applicantData, setApplicantData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFetchApplicant = async () => {
        if (applicationNumber.length !== 5) return;
        setIsLoading(true);
        const q = query(collection(firestore, 'scholarshipApplications'), where('applicationNumber', '==', applicationNumber));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            setApplicantData(snapshot.docs[0].data());
        } else {
            alert("Application number not found.");
            setApplicantData(null);
        }
        setIsLoading(false);
    };

    const handlePrint = () => {
        const printContent = document.getElementById('admit-card');
        if (printContent) {
            const WinPrint = window.open('', '', 'width=900,height=650');
            WinPrint?.document.write(`<html><head><title>Admit Card</title><script src="https://cdn.tailwindcss.com"></script></head><body>`);
            WinPrint?.document.write(printContent.innerHTML);
            WinPrint?.document.write('</body></html>');
            WinPrint?.document.close();
            WinPrint?.focus();
            WinPrint?.print();
            WinPrint?.close();
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Download Admit Card</CardTitle>
                <CardDescription>Enter your application number to download your admit card.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Input value={applicationNumber} onChange={(e) => setApplicationNumber(e.target.value)} placeholder="Enter 5-digit Application Number" />
                    <Button onClick={handleFetchApplicant} disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : "Fetch"}
                    </Button>
                </div>
                {applicantData && (
                    <div className="mt-6">
                        <div id="admit-card" className="p-6 border rounded-lg bg-white text-black">
                            <div className="text-center pb-4 border-b">
                                <h2 className="text-2xl font-bold">Go Swami National Scholarship Test (GSNST)</h2>
                                <h3 className="text-xl font-semibold">Admit Card</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="col-span-2 space-y-2">
                                    <p><strong>Application No:</strong> {applicantData.applicationNumber}</p>
                                    <p><strong>Candidate's Name:</strong> {applicantData.name}</p>
                                    <p><strong>Email:</strong> {applicantData.email}</p>
                                </div>
                                <div className="w-24 h-32 border bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                    {applicantData.photoUrl ? <img src={applicantData.photoUrl} alt="Candidate" className="w-full h-full object-cover" /> : 'Affix Photo Here'}
                                </div>
                            </div>
                             <div className="mt-4 border-t pt-4">
                                <h4 className="font-bold mb-2">Instructions:</h4>
                                <ol className="list-decimal list-inside text-sm space-y-1">
                                    <li>Bring a printed copy of this admit card to the test center.</li>
                                    <li>If your photo is not visible, please affix a recent passport-sized photograph.</li>
                                    <li>Bring a valid photo ID (Aadhaar, Passport, etc.).</li>
                                    <li>You must use your application number to appear for the online test.</li>
                                    <li>No electronic devices are allowed in the examination hall.</li>
                                </ol>
                            </div>
                        </div>
                        <Button onClick={handlePrint} className="mt-4 w-full">Print Admit Card</Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


export default function ScholarshipPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('apply');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [applicationStatus, setApplicationStatus] = useState<'closed' | 'open' | 'upcoming'>('closed');
  const [testStatus, setTestStatus] = useState<'closed' | 'open' | 'upcoming'>('closed');
  
  const [historyKey, setHistoryKey] = useState(0);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
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
            } else {
                setApplicationStatus('open'); // Default to open if dates not set
            }

            const testStartDate = data.testStartDate?.toDate();
            const testEndDate = data.testEndDate?.toDate();
            if (testStartDate && testEndDate) {
                if (now < testStartDate) setTestStatus('upcoming');
                else if (now >= testStartDate && now <= testEndDate) setTestStatus('open');
                else setTestStatus('closed');
            } else {
                setTestStatus('open'); // Default to open if dates not set
            }
        }
    } catch (error) {
        console.error("Failed to fetch scholarship settings:", error);
    } finally {
        setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleFormSubmit = () => {
    setHistoryKey(prev => prev + 1);
  };
  
  const tabItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'apply', label: 'Apply', icon: PenSquare },
    { id: 'admit-card', label: 'Admit Card', icon: Ticket },
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
        if (testStatus === 'closed' && settings?.isTestFree !== true) {
             return (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Test Window Closed</AlertTitle>
                    <AlertDescription>The online test is no longer available.</AlertDescription>
                </Alert>
            );
        }
        return <OnlineTest settings={settings} />;
    };


    switch (activeTab) {
        case 'apply': return renderApplicationContent();
        case 'admit-card': return <AdmitCardDownloader />;
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
      
       <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4">
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

    