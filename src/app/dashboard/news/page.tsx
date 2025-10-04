'use client';

import { Newspaper } from "lucide-react";

export default function NewsPage() {
    return (
        <div className="space-y-8 p-4 md:p-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline flex items-center gap-3">
                    <Newspaper className="h-10 w-10 text-primary" />
                    Latest News
                </h1>
                <p className="text-muted-foreground mt-2">Your daily dose of current affairs and news updates.</p>
            </div>

            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Newspaper className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">News Coming Soon</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Please provide a News API key to the developer to enable this feature.
                </p>
                <p className="text-xs text-muted-foreground mt-4">You can get a free API key from sites like NewsAPI.org.</p>
            </div>
        </div>
    );
}
