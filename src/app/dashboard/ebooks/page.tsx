
'use client';

import { useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { BookCopy, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const PDFViewer = ({ pdfUrl, title, onOpenChange }: { pdfUrl: string, title: string, onOpenChange: (open: boolean) => void }) => {
    
    let effectiveUrl = pdfUrl;

    if (pdfUrl.includes('drive.google.com/file')) {
        const fileId = pdfUrl.split('/d/')[1].split('/')[0];
        effectiveUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    } else if (pdfUrl.includes('workdrive.zoho.in/file')) {
        const fileId = pdfUrl.split('/file/')[1];
        effectiveUrl = `https://workdrive.zoho.in/embed/${fileId}`;
    } else if (!pdfUrl.includes('embed') && !pdfUrl.startsWith('https://docs.google.com/gview')) {
        effectiveUrl = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
    }


    return (
        <Dialog open={true} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] p-2 sm:p-4 flex flex-col">
                <DialogHeader className="p-2">
                    <DialogTitle className="truncate">{title}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow rounded-lg overflow-hidden">
                    <iframe
                        src={effectiveUrl}
                        width="100%"
                        height="100%"
                        className="border-0"
                        title={title}
                        allow="fullscreen"
                    ></iframe>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const EBookCard = ({ ebook, onClick }: { ebook: any, onClick: () => void }) => {
    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={onClick}>
            <div className="relative h-56 w-full bg-muted">
                <Image src={ebook.thumbnailUrl || `https://picsum.photos/seed/${ebook.id}/600/800`} alt={ebook.title} fill style={{objectFit: "cover"}} data-ai-hint="book cover" />
            </div>
            <CardHeader>
                <CardTitle className="text-xl line-clamp-2">{ebook.title}</CardTitle>
                <CardDescription className="line-clamp-3">{ebook.description}</CardDescription>
            </CardHeader>
        </Card>
    );
}

export default function EbooksPage() {
    const [ebooks, ebooksLoading, ebooksError] = useCollection(
        query(collection(firestore, 'ebooks'), orderBy('createdAt', 'desc'))
    );
    const [selectedPdf, setSelectedPdf] = useState<{ url: string, title: string } | null>(null);

    const handleEbookClick = (ebookData: any) => {
        if (ebookData.viewType === 'browser') {
            window.open(ebookData.fileUrl, '_blank');
        } else {
            setSelectedPdf({ url: ebookData.fileUrl, title: ebookData.title });
        }
    };
    
    return (
        <div className="space-y-8">
            {selectedPdf && (
                <PDFViewer 
                    pdfUrl={selectedPdf.url}
                    title={selectedPdf.title}
                    onOpenChange={(isOpen) => !isOpen && setSelectedPdf(null)}
                />
            )}
            <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline flex items-center gap-3">
                    <BookCopy className="h-8 w-8 text-primary" />
                    E-Books
                </h1>
                <p className="text-muted-foreground mt-2">Browse our library of digital books.</p>
            </div>
            {ebooksLoading && (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
                </div>
            )}
            {ebooksError && <p className="text-destructive text-center">Could not load E-books.</p>}
            
            {!ebooksLoading && (!ebooks || ebooks.empty) && (
                 <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No E-Books Available</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Please check back later for new e-books.</p>
                </div>
            )}
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {ebooks?.docs.map(doc => (
                    <EBookCard key={doc.id} ebook={{id: doc.id, ...doc.data()}} onClick={() => handleEbookClick(doc.data())} />
                ))}
            </div>
        </div>
    )
}
