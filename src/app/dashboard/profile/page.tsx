
"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { firestore, messaging } from '@/lib/firebase';
import { getToken } from "firebase/messaging";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Pencil, Phone, MessageCircle, Bell, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

const HelplineSection = () => {
    const helplineNumber = '9327175729';
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Helpline</CardTitle>
                <CardDescription>Contact us for any support or queries.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a href={`tel:${helplineNumber}`} className="block">
                    <Button variant="outline" className="w-full h-16 text-lg">
                        <Phone className="mr-3"/> Call Now
                    </Button>
                </a>
                <a href={`https://wa.me/${helplineNumber}`} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full h-16 text-lg">
                        <MessageCircle className="mr-3"/> WhatsApp
                    </Button>
                </a>
            </CardContent>
        </Card>
    )
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [userData, setUserData] = useState<any>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isTokenCopied, setIsTokenCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const userDocRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          if (data.fcmTokens && data.fcmTokens.length > 0) {
            setFcmToken(data.fcmTokens[data.fcmTokens.length - 1]);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleNotificationPermission = async () => {
    if (!messaging || !user) {
      toast({
        variant: "destructive",
        title: "Unsupported",
        description: "Notifications are not supported on this browser or you are not logged in.",
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        if (currentToken) {
          setFcmToken(currentToken);
          const userDocRef = doc(firestore, 'users', user.uid);
          await updateDoc(userDocRef, {
            fcmTokens: arrayUnion(currentToken)
          });
          toast({
            title: "Notifications Enabled",
            description: "You will now receive notifications.",
          });
        } else {
          throw new Error("No registration token available. Request permission to generate one.");
        }
      } else {
         throw new Error("Notification permission denied.");
      }
    } catch (err: any) {
      console.error('An error occurred while getting token. ', err);
      toast({
        variant: "destructive",
        title: "Token Error",
        description: err.message,
      });
    }
  };

  const copyTokenToClipboard = () => {
    if (fcmToken) {
        navigator.clipboard.writeText(fcmToken);
        setIsTokenCopied(true);
        toast({ title: "Copied!", description: "FCM token copied to clipboard." });
        setTimeout(() => setIsTokenCopied(false), 3000);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "S";
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return names[0].charAt(0) + names[names.length - 1].charAt(0);
    }
    return name.charAt(0);
  }

  return (
    <div className="space-y-8 p-4 md:p-6">
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

       <Card>
            <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your push notification settings.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleNotificationPermission} disabled={!!fcmToken}>
                    <Bell className="mr-2"/>
                    {fcmToken ? 'Notifications Enabled' : 'Enable Notifications'}
                </Button>
                {fcmToken && (
                    <div className="mt-4 p-3 border rounded-lg bg-muted flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold">Your Notification Token:</p>
                            <p className="text-xs text-muted-foreground break-all">{fcmToken}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={copyTokenToClipboard}>
                           {isTokenCopied ? <Check className="text-green-500" /> : <Copy />}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
      
       <HelplineSection />
    </div>
  );
}
