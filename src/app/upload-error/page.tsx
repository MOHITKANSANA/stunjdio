
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function UploadErrorPage() {
    const supportNumber = '8949814095';
    const message = "Hello, I'm having trouble uploading a screenshot because the file size is too large. Can you please help?";
    const whatsappUrl = `https://wa.me/${supportNumber}?text=${encodeURIComponent(message)}`;

    return (
        <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center shadow-lg">
                <CardHeader>
                    <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <CardTitle className="text-2xl">Upload Failed: File Too Large</CardTitle>
                    <CardDescription>The screenshot you tried to upload is larger than 2MB.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>To continue, please either compress the image to a smaller size or contact our support team on WhatsApp for manual verification.</p>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-4">
                    <Button asChild className="w-full" variant="outline">
                       <Link href="/dashboard/payment-verification">Try Again</Link>
                    </Button>
                     <Button asChild className="w-full">
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                           <MessageCircle className="mr-2" /> WhatsApp Support
                        </a>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
