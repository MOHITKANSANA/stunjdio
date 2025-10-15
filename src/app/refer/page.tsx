
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Gift, Copy, Check, Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

export default function ReferPage() {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);
    const [appLink, setAppLink] = useState('');
    const [points, setPoints] = useState(0);

    useEffect(() => {
        const unsub = onSnapshot(doc(firestore, 'settings', 'appConfig'), (doc) => {
            if (doc.exists()) {
                setAppLink(doc.data().referralLink || 'https://yourapp.com');
            }
        });

        if (user) {
            const userUnsub = onSnapshot(doc(firestore, 'users', user.uid), (doc) => {
                setPoints(doc.data()?.rewardPoints || 0);
            });
            return () => userUnsub();
        }

        return () => unsub();
    }, [user]);

    const referralCode = user?.referralCode || 'LOGINTOSEE';
    const referralMessage = `Join me on Learn with Munedra! Use my referral code ${referralCode} to get a special discount. Download the app here: ${appLink}`;

    const copyToClipboard = () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Please log in to get your referral code.' });
            return;
        }
        navigator.clipboard.writeText(referralCode);
        setIsCopied(true);
        toast({ title: "Copied!", description: "Referral code copied to clipboard." });
        setTimeout(() => setIsCopied(false), 3000);
    };

    const shareOnWhatsApp = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Please log in to share your referral code.' });
            return;
        }

        try {
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, { rewardPoints: increment(10) });
            toast({ title: "+10 Points!", description: "You earned 10 points for sharing." });
        } catch(e) {
            console.error("Failed to award points for sharing:", e);
        }

        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(referralMessage)}`;
        window.open(whatsappUrl, '_blank');
    };

    if (loading) {
        return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 p-4 md:p-6">
            <div className="text-center">
                <Gift className="mx-auto h-16 w-16 text-primary mb-4" />
                <h1 className="text-4xl font-bold font-headline">Refer &amp; Earn</h1>
                <p className="text-muted-foreground mt-2">Invite your friends and earn rewards when they join!</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Referral Code</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center gap-4 p-4 border-2 border-dashed rounded-lg">
                        <p className="text-3xl font-bold tracking-widest text-primary">{referralCode}</p>
                        <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                           {isCopied ? <Check className="h-6 w-6 text-green-500" /> : <Copy className="h-6 w-6" />}
                        </Button>
                    </div>
                </CardContent>
                 <CardFooter className="grid grid-cols-2 gap-4">
                    <Button onClick={shareOnWhatsApp} className="w-full text-lg">
                        <Share2 className="mr-2" /> Share
                    </Button>
                     <Button onClick={copyToClipboard} className="w-full text-lg" variant="outline">
                        <Copy className="mr-2" /> Copy Code
                    </Button>
                 </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Reward Points</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center">
                        <p className="text-6xl font-bold text-primary">{points}</p>
                        <p className="text-muted-foreground">points</p>
                    </div>
                    <div className="mt-4">
                        <Progress value={(points / 200) * 100} />
                        <p className="text-center text-sm text-muted-foreground mt-2">
                           {points < 200 ? `${200 - points} points needed to redeem a free e-book.` : "You can redeem a free e-book!"}
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button disabled={points < 200} className="w-full">Redeem Free E-Book</Button>
                </CardFooter>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>How it Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                    <p>1. Share your unique referral code and app link with your friends.</p>
                    <p>2. Your friend gets a 10% discount on their first purchase using your code.</p>
                    <p>3. You receive 10 reward points in your account once their purchase is complete.</p>
                    <p>4. Collect 200 points to redeem any e-book for free!</p>
                </CardContent>
            </Card>
        </div>
    )
}
