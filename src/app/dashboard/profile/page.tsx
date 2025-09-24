
"use client"

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Award, Pencil, Timer } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Certificate from "@/components/certificate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const KidsProfileExtras = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [screenTime, setScreenTime] = useState('');

    useEffect(() => {
        if (user) {
            const userDocRef = doc(firestore, 'users', user.uid);
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    setScreenTime(docSnap.data().screenTimeLimit || '');
                }
            });
        }
    }, [user]);

    const handleSaveScreenTime = async () => {
        if (!user) return;
        const timeInMinutes = parseInt(screenTime, 10);
        if (isNaN(timeInMinutes) || timeInMinutes < 0) {
            toast({ variant: 'destructive', title: 'Invalid time', description: 'Please enter a valid number for minutes.' });
            return;
        }
        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, { screenTimeLimit: timeInMinutes });
            toast({ title: 'Success', description: `Screen time limit set to ${timeInMinutes} minutes.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save screen time.' });
        }
    };

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Parental Controls</CardTitle>
                <CardDescription>Manage settings for your child's app usage.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <Label htmlFor="screen-time">Set Screen Time (minutes)</Label>
                        <p className="text-sm text-muted-foreground">App will lock after this duration.</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <Input 
                            id="screen-time" 
                            type="number" 
                            className="w-24"
                            value={screenTime}
                            onChange={(e) => setScreenTime(e.target.value)}
                            placeholder="e.g. 60"
                        />
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button>Save</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Screen Time Limit</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to set the daily screen time limit to {screenTime} minutes?
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSaveScreenTime}>Confirm</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Dummy data, replace with Firestore data
const userCourses = [
  { name: "Algebra Fundamentals", progress: 75 },
  { name: "World History", progress: 40 },
  { name: "English Grammar", progress: 95 },
];

const testHistory = [
  { name: "Maths Practice Test 1", score: "88%", date: "2023-10-15" },
  { name: "General Knowledge Quiz", score: "72%", date: "2023-10-12" },
];

const certificates = [
  {
    studentName: "Student Name",
    courseName: "Algebra Fundamentals - Final Test",
    score: 88,
    date: new Date().toLocaleDateString(),
    status: 'pass'
  },
   {
    studentName: "Student Name",
    courseName: "World History",
    score: 100,
    date: new Date().toLocaleDateString(),
    status: 'pass'
  }
];


export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isKidsMode, setIsKidsMode] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setIsKidsMode(data.ageGroup === '1-9');
        }
      });
    }
  }, [user]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "S";
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return names[0].charAt(0) + names[names.length - 1].charAt(0);
    }
    return name.charAt(0);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user?.photoURL || undefined} data-ai-hint="student" />
          <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <h1 className="text-3xl md:text-4xl font-bold font-headline">{user?.displayName || "Student Name"}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/complete-profile">
            <Pencil className="mr-2 h-4 w-4" />
            {t('edit_profile')}
          </Link>
        </Button>
      </div>

      {isKidsMode ? <KidsProfileExtras /> : (
        <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="courses">{t('my_courses')}</TabsTrigger>
            <TabsTrigger value="tests">{t('test_history')}</TabsTrigger>
            <TabsTrigger value="certificates">{t('certificates')}</TabsTrigger>
            </TabsList>
            <TabsContent value="courses" className="mt-6">
            <Card>
                <CardHeader>
                <CardTitle>{t('my_courses')}</CardTitle>
                <CardDescription>{t('your_enrolled_courses')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                {userCourses.map((course) => (
                    <div key={course.name}>
                    <div className="flex justify-between mb-2">
                        <h3 className="font-semibold">{t(course.name.toLowerCase().replace(/ /g, '_'))}</h3>
                        <p className="text-sm text-muted-foreground">{course.progress}% {t('complete')}</p>
                    </div>
                    <Progress value={course.progress} />
                    </div>
                ))}
                </CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="tests" className="mt-6">
            <Card>
                <CardHeader>
                <CardTitle>{t('test_history')}</CardTitle>
                <CardDescription>{t('review_past_scores')}</CardDescription>
                </CardHeader>
                <CardContent>
                <ul className="divide-y">
                    {testHistory.map((test) => (
                    <li key={test.name} className="flex items-center justify-between py-4">
                        <div>
                        <h3 className="font-semibold">{t(test.name.toLowerCase().replace(/ /g, '_'))}</h3>
                        <p className="text-sm text-muted-foreground">{t('completed_on')} {test.date}</p>
                        </div>
                        <Badge variant={parseInt(test.score) > 80 ? "default" : "secondary"}>{t('score')}: {test.score}</Badge>
                    </li>
                    ))}
                </ul>
                </CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="certificates" className="mt-6">
            <Card>
                <CardHeader>
                <CardTitle>{t('my_certificates')}</CardTitle>
                <CardDescription>{t('your_earned_certificates')}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-1">
                    {certificates.map((cert, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-muted/30">
                            <Certificate
                                studentName={user?.displayName || 'Student'}
                                courseName={cert.courseName}
                                score={cert.score}
                                date={cert.date}
                                status={cert.status}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>
            </TabsContent>
        </Tabs>
      )}

    </div>
  );
}

    