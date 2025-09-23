
'use client';

import { Download } from "lucide-react";

export default function DownloadsPage() {
    return (
        <div className="space-y-8 p-4 md:p-8">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline flex items-center gap-3">
                    <Download className="h-10 w-10 text-primary" />
                    My Downloads
                </h1>
                <p className="text-muted-foreground mt-2">All your downloaded materials in one place.</p>
            </div>

            <div className="text-center py-12">
                <Download className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Downloads Yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Your downloaded course materials will appear here.</p>
            </div>
        </div>
    );
}
