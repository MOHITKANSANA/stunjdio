
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Rss } from 'lucide-react';

export default function FeedPage() {

    return (
        <div className="p-4 md:p-8">
             <div className="text-center">
                <Rss className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-3xl font-bold mt-4">Feed</h1>
                <p className="text-muted-foreground mt-2">See what's new in the community.</p>
            </div>

            <div className="max-w-2xl mx-auto mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Coming Soon!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">The community feed is under construction. Stay tuned for updates where you can share posts, polls, and more!</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
