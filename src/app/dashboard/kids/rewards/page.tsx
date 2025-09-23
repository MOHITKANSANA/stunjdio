
'use client';

import { useAuth } from '@/hooks/use-auth';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Trophy, Gift, Banknote } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { redeemRewardsAction, requestExtraPointsAction } from '@/app/actions/kids-tube';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MyRewardsPage() {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [points, setPoints] = useState(0);
    const [paytmNumber, setPaytmNumber] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        if (user) {
            const userDocRef = doc(firestore, 'users', user.uid);
            const unsubscribe = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    setPoints(doc.data().rewardPoints || 0);
                }
            });
            return () => unsubscribe();
        }
    }, [user]);
    
    const handleRedeem = async () => {
        if (!user) return;
        if (paytmNumber.length < 10) {
            toast({ variant: 'destructive', title: 'Invalid Paytm Number' });
            return;
        }
        setIsRedeeming(true);
        const result = await redeemRewardsAction(user.uid, user.displayName || 'N/A', user.email || 'N/A', paytmNumber);
        if (result.success) {
            toast({ title: 'Success!', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Redemption Failed', description: result.error });
        }
        setIsRedeeming(false);
    };
    
    const handleRequestPoints = async () => {
        if (!user) return;
        setIsRequesting(true);
        const result = await requestExtraPointsAction(user.uid, user.displayName || 'N/A', user.email || 'N/A');
        if (result.success) {
            toast({ title: 'Request Sent!', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Request Failed', description: result.error });
        }
        setIsRequesting(false);
    };

    const progress = Math.min((points / 1000) * 100, 100);

    if (loading) {
        return <div>Loading...</div>
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
                <Trophy className="mx-auto h-12 w-12 text-yellow-500" />
                <h1 className="text-3xl font-bold mt-4">My Rewards</h1>
                <p className="text-muted-foreground mt-2">Earn points and redeem them for exciting rewards!</p>
            </div>

            <Card className="text-center">
                <CardHeader>
                    <CardTitle>Your Points Balance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-6xl font-bold text-primary">{points}</p>
                    <p className="text-muted-foreground">points</p>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                     <Button variant="outline" onClick={handleRequestPoints} disabled={isRequesting}>
                        {isRequesting ? 'Requesting...' : 'Request Extra Points'}
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift /> Redeem for Cash</CardTitle>
                    <CardDescription>Redeem 1000 points for ₹10 in your Paytm wallet.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span>Progress</span>
                            <span>{points} / 1000</span>
                        </div>
                        <Progress value={progress} />
                        <p className="text-xs text-muted-foreground text-center">You need {Math.max(0, 1000 - points)} more points to redeem.</p>
                    </div>
                </CardContent>
                <CardFooter>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button className="w-full" disabled={points < 1000}>Redeem Now</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Redemption</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will use 1000 points. Please enter your Paytm number to receive ₹10. Payment will be processed within 24-48 hours.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="grid gap-2">
                                <Label htmlFor="paytm">Paytm Number</Label>
                                <Input id="paytm" type="tel" value={paytmNumber} onChange={(e) => setPaytmNumber(e.target.value)} placeholder="Enter your 10-digit Paytm number" />
                            </div>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleRedeem} disabled={isRedeeming || paytmNumber.length < 10}>
                                {isRedeeming ? "Redeeming..." : "Confirm"}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </div>
    );
}
