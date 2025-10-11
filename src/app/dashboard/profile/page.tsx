
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { firestore, messaging } from '@/lib/firebase';
import { getToken } from "firebase/messaging";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Pencil, Phone, MessageCircle, Bell } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    if (user) {
      const userDocRef = doc(firestore, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
        }
      });
      return () => unsubscribe();
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
      
       <HelplineSection />
    </div>
  );
}
