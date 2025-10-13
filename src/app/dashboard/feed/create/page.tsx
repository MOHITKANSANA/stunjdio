
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm, Controller } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, ImageIcon, ArrowLeft, PlusCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

type PostType = 'text' | 'poll';

interface PollOption {
  text: string;
}

interface FormValues {
  postType: PostType;
  content: string;
  imageFile: File | null;
  pollOptions: PollOption[];
}

function CreatePostForm() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { register, control, handleSubmit, watch, setValue } = useForm<FormValues>({
        defaultValues: {
            postType: 'text',
            content: '',
            imageFile: null,
            pollOptions: [{ text: '' }, { text: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'pollOptions',
    });
    
    const postType = watch('postType');

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setValue('imageFile', file);
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

    const onSubmit = async (data: FormValues) => {
        if (!user) {
            toast({ variant: 'destructive', description: "You must be logged in." });
            return;
        }

        if (data.postType === 'text' && !data.content.trim() && !data.imageFile) {
             toast({ variant: 'destructive', description: "Please write something or upload an image." });
            return;
        }
        
        if (data.postType === 'poll' && (!data.content.trim() || data.pollOptions.some(opt => !opt.text.trim()))) {
             toast({ variant: 'destructive', description: "Please enter a poll question and at least two options." });
            return;
        }

        setIsSubmitting(true);
        try {
            let imageUrl: string | null = null;
            if (data.imageFile) {
                imageUrl = await fileToDataUrl(data.imageFile);
            }
            
            const postData: any = {
                type: data.postType,
                authorId: user.uid,
                authorName: user.displayName,
                authorAvatar: user.photoURL,
                content: data.content.trim(),
                likes: [],
                commentsCount: 0,
                createdAt: serverTimestamp()
            };

            if(data.postType === 'text') {
                postData.imageUrl = imageUrl;
            }

            if(data.postType === 'poll') {
                postData.pollOptions = data.pollOptions.map(opt => ({ text: opt.text, votes: [] }));
            }

            await addDoc(collection(firestore, 'feedPosts'), postData);

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
                        <CardDescription>Share your thoughts, create a poll, or ask a question.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <Avatar>
                        <AvatarImage src={user?.photoURL || undefined} />
                        <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="w-full space-y-4">
                        <Tabs defaultValue="text" onValueChange={(value) => setValue('postType', value as PostType)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="text">Text & Image</TabsTrigger>
                                <TabsTrigger value="poll">Poll</TabsTrigger>
                            </TabsList>
                            <TabsContent value="text" className="mt-4">
                                <Textarea 
                                    placeholder="What's on your mind?"
                                    className="bg-muted border-none focus-visible:ring-1 focus-visible:ring-primary min-h-[150px]"
                                    {...register('content')}
                                />
                                {imagePreview && (
                                    <div className="relative mt-4 w-full aspect-video rounded-lg overflow-hidden border">
                                        <Image src={imagePreview} alt="Preview" fill style={{ objectFit: 'contain' }} />
                                    </div>
                                )}
                            </TabsContent>
                            <TabsContent value="poll" className="mt-4 space-y-4">
                                <Textarea 
                                    placeholder="What's your poll question?"
                                    className="bg-muted border-none focus-visible:ring-1 focus-visible:ring-primary"
                                    {...register('content')}
                                />
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Poll Options</p>
                                    {fields.map((item, index) => (
                                        <div key={item.id} className="flex items-center gap-2">
                                            <Input
                                                {...register(`pollOptions.${index}.text`)}
                                                placeholder={`Option ${index + 1}`}
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => append({ text: '' })}>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Option
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-4 border-t">
                 {postType === 'text' && (
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <ImageIcon className="mr-2" />
                    Add Image
                    </Button>
                )}
                 <div className={postType !== 'text' ? 'w-full' : ''}></div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                <Button type="submit" disabled={isSubmitting} size="lg">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                    Publish Post
                </Button>
            </CardFooter>
            </form>
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
