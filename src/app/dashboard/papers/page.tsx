
'use client';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, FileText } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

export default function PapersPage() {
  const [papersCollection, loading, error] = useCollection(
    query(collection(firestore, 'previousPapers'), orderBy('year', 'desc'))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Previous Year Papers</h1>
        <p className="text-muted-foreground mt-2">Practice with papers from previous years to understand the exam pattern.</p>
      </div>
      
      {loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      )}

      {error && <p className="text-destructive">Error: {error.message}</p>}
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {papersCollection?.docs.map((doc) => {
          const paper = doc.data();
          return (
            <a href={paper.fileUrl} target="_blank" rel="noopener noreferrer" key={doc.id}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{paper.title}</CardTitle>
                        <Newspaper className="h-6 w-6 text-primary" />
                    </div>
                  <CardDescription>Year: {paper.year}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4"/>
                      <span>Click to view and download the paper.</span>
                    </div>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>

       {papersCollection?.docs.length === 0 && !loading && (
        <p className="text-muted-foreground text-center">No previous year papers have been uploaded yet.</p>
      )}

    </div>
  );
}
