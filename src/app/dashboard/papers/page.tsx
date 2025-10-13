
'use client';
import { useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Newspaper, FileText, Download, Eye } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PapersPage() {
  const [papersCollection, loading, error] = useCollection(
    query(collection(firestore, 'previousPapers'), orderBy('year', 'desc'))
  );

  const handleViewPdf = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Previous Year Papers</h1>
        <p className="text-muted-foreground mt-2">Practice with papers from previous years to understand the exam pattern.</p>
      </div>

       <Tabs defaultValue="download">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="download">Download PDFs</TabsTrigger>
          <TabsTrigger value="test">Take Online Test</TabsTrigger>
        </TabsList>
        <TabsContent value="download" className="mt-6">
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
                    <Card key={doc.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <CardTitle>{paper.title}</CardTitle>
                                <Newspaper className="h-6 w-6 text-primary shrink-0" />
                            </div>
                            <CardDescription>Year: {paper.year}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileText className="h-4 w-4"/>
                                <span>Click the button to open the paper.</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                           <Button className="w-full" onClick={() => handleViewPdf(paper.fileUrl)}>
                                <Eye className="mr-2 h-4 w-4" /> View Paper
                           </Button>
                        </CardFooter>
                    </Card>
                );
                })}
            </div>

            {papersCollection?.docs.length === 0 && !loading && (
                 <div className="text-center py-12">
                    <Newspaper className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No Papers Available</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Previous year papers will be added here soon.</p>
                </div>
            )}
        </TabsContent>
        <TabsContent value="test" className="mt-6">
             <div className="text-center p-8 text-muted-foreground border rounded-lg">
                <FileText className="mx-auto h-12 w-12" />
                <p className="mt-4 font-semibold">Coming Soon</p>
                <p className="text-sm">Online test feature for previous year papers will be available here soon.</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
