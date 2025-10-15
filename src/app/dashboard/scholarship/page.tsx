
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Award, FileText, PenSquare, Eye, Search, AlertTriangle, FileSignature, Ticket, Loader2 } from "lucide-react";
import { cn } from '@/lib/utils';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApplyForm } from './_components/apply-form';
import { OnlineTest } from './_components/online-test';
import { ViewResult } from './_components/view-result';
import { ScrutinyForm } from './_components/scrutiny-form';
import { ScholarshipHistory } from './_components/scholarship-history';


type ActiveTab = 'apply' | 'admit-card' | 'result' | 'scrutiny';


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
    if (tab && ['apply', 'admit-card', 'result', 'scrutiny'].includes(tab)) {
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
  };
  
 const tabItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'apply', label: 'Apply', icon: PenSquare },
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
        case 'admit-card': return <p className="text-center text-muted-foreground p-8">Admit cards will be available for download here once released.</p>;
        case 'result': return <ViewResult />;
        case 'scrutiny': return <ScrutinyForm />;
        default: return null;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
      <div className="text-center">
        <Award className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Go Swami National Scholarship Test</h1>
        <p className="text-muted-foreground mt-2">(GSNST)</p>
      </div>
      
       <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
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
