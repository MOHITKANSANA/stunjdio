
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Award, FileText, PenSquare, Eye, Search, AlertTriangle, FileSignature, Ticket, Loader2, UserCheck } from "lucide-react";
import { cn } from '@/lib/utils';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApplyForm } from './_components/apply-form';
import { ViewResult } from './_components/view-result';
import { ScrutinyForm } from './_components/scrutiny-form';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { Input } from '@/components/ui/input';


type ActiveTab = 'apply' | 'admit-card' | 'result' | 'scrutiny' | 'my-application';


const AdmitCard = ({ applicant }: { applicant: any }) => {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admit Card - Learn with Munedra Scholarship</CardTitle>
          <CardDescription>
            Application Number: {applicant.applicationNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <p><strong>Name:</strong> {applicant.name}</p>
            <p><strong>Exam Center:</strong> {applicant.allottedCenter || 'To be announced'}</p>
            <p><strong>Exam Date:</strong> {applicant.examDate?.toDate().toLocaleDateString() || 'To be announced'}</p>
            <p><strong>Reporting Time:</strong> {applicant.reportingTime || 'To be announced'}</p>
            <p><strong>Exam Time:</strong> {applicant.examTime || 'To be announced'}</p>
          </div>
          <div className="flex flex-col items-center gap-4">
             {applicant.photoUrl && <Image src={applicant.photoUrl} alt="Applicant Photo" width={100} height={100} className="border rounded-md" />}
             {applicant.signatureUrl && <Image src={applicant.signatureUrl} alt="Applicant Signature" width={150} height={50} className="border rounded-md bg-white p-1" />}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4 p-6 bg-muted rounded-b-lg">
            <h4 className="font-bold">Instructions (निर्देश):</h4>
            <ul className="list-disc list-inside text-sm space-y-2 text-muted-foreground">
                <li>कृपया परीक्षा देने आते समय ₹60 साथ लाएँ। (Please bring ₹60 when you come for the exam.)</li>
                <li>Admit card and a valid photo ID are mandatory.</li>
                <li>Reach the exam center by the reporting time.</li>
                <li>Electronic devices are not allowed inside the exam hall.</li>
            </ul>
        </CardFooter>
      </Card>
    );
};


const AdmitCardTab = () => {
    const [applicationNumber, setApplicationNumber] = useState('');
    const [applicant, setApplicant] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [settingsDoc] = useCollection(query(collection(firestore, 'scholarshipCenters')));

    const findApplicant = async () => {
        if (!applicationNumber) return;
        setLoading(true);
        setError('');
        setApplicant(null);
        try {
            const q = query(collection(firestore, 'scholarshipApplications'), where('applicationNumber', '==', applicationNumber));
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                setError('Application number not found.');
            } else {
                const appData = snapshot.docs[0].data();
                if (appData.allottedCenterId && settingsDoc) {
                    const centerDoc = settingsDoc.docs.find(d => d.id === appData.allottedCenterId);
                    if(centerDoc) {
                        const centerData = centerDoc.data();
                        appData.examDate = centerData.examDate;
                        appData.admitCardDate = centerData.admitCardDate;
                        appData.reportingTime = centerData.reportingTime;
                        appData.examTime = centerData.examTime;
                        appData.allottedCenter = `${centerData.name}, ${centerData.city}`;

                        if (centerData.admitCardDate && centerData.admitCardDate.toDate() > new Date()) {
                            setError('Admit card for your center is not yet available for download.');
                        } else {
                            setApplicant(appData);
                        }
                    } else {
                        setError('Your allotted center details could not be found. Please contact support.');
                    }
                } else {
                     setError('Your admit card has not been generated yet. Please check back later.');
                }
            }
        } catch (e) {
            setError('An error occurred while fetching your details.');
        }
        setLoading(false);
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Download Admit Card</CardTitle>
                <CardDescription>Enter your application number to download your admit card.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input value={applicationNumber} onChange={(e) => setApplicationNumber(e.target.value)} placeholder="Enter 5-digit application number" />
                    <Button onClick={findApplicant} disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : 'Find'}</Button>
                </div>
                 {error && <p className="text-destructive text-sm">{error}</p>}
                 {applicant && <AdmitCard applicant={applicant} />}
            </CardContent>
        </Card>
    );
};


const MyApplicationTab = () => {
    const { user } = useAuth();
    const [applications, loading, error] = useCollection(user ? query(collection(firestore, 'scholarshipApplications'), where('userId', '==', user.uid), orderBy('appliedAt', 'desc')) : null);

    if(loading) return <Skeleton className="h-48 w-full" />
    if(error) return <p className="text-destructive">Could not load your applications.</p>
    if(!applications || applications.empty) return <p className="text-muted-foreground text-center p-8">You have not applied for any scholarships yet.</p>

    return (
        <div className="space-y-4">
            {applications.docs.map(doc => {
                const app = doc.data();
                return (
                    <Card key={doc.id}>
                        <CardHeader>
                            <CardTitle>Application #{app.applicationNumber}</CardTitle>
                            <CardDescription>Status: <span className="font-bold">{app.status}</span></CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p><strong>Applied for:</strong> {app.scholarshipType}</p>
                            {app.courseTitle && <p><strong>Course:</strong> {app.courseTitle}</p>}
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}


function ScholarshipPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<ActiveTab>('apply');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<'closed' | 'open' | 'upcoming'>('closed');
  
  const [historyKey, setHistoryKey] = useState(0);

  useEffect(() => {
    const tab = searchParams.get('tab') as ActiveTab;
    if (tab && ['apply', 'admit-card', 'result', 'scrutiny', 'my-application'].includes(tab)) {
        setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: ActiveTab) => {
      setActiveTab(tab);
      router.push(`/dashboard/scholarship?tab=${tab}`);
  }

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
        const settingsDoc = await getDoc(doc(firestore, 'settings', 'scholarship'));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            setSettings(data);
            const now = new Date();

            const appStartDate = data.applicationStartDate?.toDate();
            const appEndDate = data.applicationEndDate?.toDate();
            if (appStartDate && appEndDate) {
                if (now < appStartDate) setApplicationStatus('upcoming');
                else if (now >= appStartDate && now <= appEndDate) setApplicationStatus('open');
                else setApplicationStatus('closed');
            } else {
                setApplicationStatus('open'); // Default to open if dates not set
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
    handleTabChange('my-application');
  };
  
 const tabItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'apply', label: 'Apply', icon: PenSquare },
    { id: 'my-application', label: 'My Application', icon: UserCheck },
    { id: 'admit-card', label: 'Admit Card', icon: Ticket },
    { id: 'result', label: 'View Result', icon: Eye },
    { id: 'scrutiny', label: 'Check OMR', icon: Search },
];

  const renderContent = () => {
    if (loading) {
        return <Skeleton className="w-full h-96" />;
    }

    const renderApplicationContent = () => {
        if (applicationStatus === 'upcoming' && settings?.applicationStartDate) {
            return (
                <Card className="text-center">
                    <CardHeader><CardTitle>Applications Open Soon!</CardTitle></CardHeader>
                    <CardContent>
                        <p className="mb-4">Applications will open on {settings.applicationStartDate.toDate().toLocaleString()}.</p>
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

    switch (activeTab) {
        case 'apply': return renderApplicationContent();
        case 'my-application': return <MyApplicationTab />;
        case 'admit-card': return <AdmitCardTab />;
        case 'result': return <ViewResult />;
        case 'scrutiny': return <ScrutinyForm />;
        default: return null;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
      <div className="text-center">
        <Award className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Learn with Munedra Scholarship</h1>
      </div>
      
       <div className="grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-4">
        {tabItems.map(item => (
            <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'outline'}
                onClick={() => handleTabChange(item.id)}
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

export default function ScholarshipPage() {
    return (
        <Suspense fallback={<div className="p-8"><Skeleton className="h-96 w-full" /></div>}>
            <ScholarshipPageContent />
        </Suspense>
    )
}
