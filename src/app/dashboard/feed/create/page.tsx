
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, ImageIcon, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

function CreatePostForm() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const fileToDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
    }

    const handleSubmit = async () => {
        if (!user || (!content.trim() && !imageFile)) {
            toast({ variant: 'destructive', description: "Please write something or upload an image." });
            return;
        }
        setIsSubmitting(true);
        try {
            let imageUrl: string | null = null;
            if (imageFile) {
                imageUrl = await fileToDataUrl(imageFile);
            }
            
            await addDoc(collection(firestore, 'feedPosts'), {
                authorId: user.uid,
                authorName: user.displayName,
                authorAvatar: user.photoURL,
                content: content.trim(),
                imageUrl: imageUrl,
                likes: [],
                commentsCount: 0,
                createdAt: serverTimestamp()
            });

            toast({ description: "Your post has been published!" });
            router.push('/dashboard/feed');

        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="shadow-lg w-full max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <div>
                        <CardTitle>Create a New Post</CardTitle>
                        <CardDescription>Share your thoughts with the community.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <Avatar>
                        <AvatarImage src={user?.photoURL || undefined} />
                        <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="w-full space-y-4">
                        <Textarea 
                            placeholder="What's on your mind?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="bg-muted border-none focus-visible:ring-1 focus-visible:ring-primary min-h-[150px]"
                        />
                        {imagePreview && (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                                <Image src={imagePreview} alt="Preview" fill style={{ objectFit: 'contain' }} />
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <ImageIcon className="mr-2" />
                                Add Image
                            </Button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                                Publish Post
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default function CreatePostPage() {
    return (
        <div className="p-4 md:p-8">
            <CreatePostForm />
        </div>
    )
}
