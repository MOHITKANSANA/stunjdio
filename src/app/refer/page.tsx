
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Copy, Check } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function ReferPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isCopied, setIsCopied] = useState(false);

    // This would be generated and stored for the user in a real implementation
    const referralCode = user ? `REF${user.uid.substring(0, 5).toUpperCase()}` : 'LOGINTOSEE';
    const appLink = 'https://learn-with-munedra.web.app'; // This should be configured in admin settings
    const referralMessage = `Join me on Learn with Munedra! Use my referral code ${referralCode} to get a special discount. Download the app here: ${appLink}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralCode);
        setIsCopied(true);
        toast({ title: "Copied!", description: "Referral code copied to clipboard." });
        setTimeout(() => setIsCopied(false), 3000);
    };

    const shareOnWhatsApp = () => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(referralMessage)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
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
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>How it Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground">
                    <p>1. Share your unique referral code and app link with your friends.</p>
                    <p>2. Your friend gets a 10% discount on their first course purchase using your code.</p>
                    <p>3. You receive reward points in your account once their purchase is complete.</p>
                    <p>4. Use your reward points to get discounts on your future course enrollments!</p>
                </CardContent>
                 <CardContent>
                    <Button onClick={shareOnWhatsApp} className="w-full text-lg">Share on WhatsApp</Button>
                </CardContent>
            </Card>
        </div>
    )
}
