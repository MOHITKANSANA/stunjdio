'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Loader2, Upload, Trash2, Link } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

const qrCodeSchema = z.object({
  qrCodeFile: z.any().refine(file => file, 'QR Code image is required.'),
});
type QrCodeFormValues = z.infer<typeof qrCodeSchema>;

const carouselSchema = z.object({
  imageUrl: z.string().url('Must be a valid image URL.'),
});
type CarouselFormValues = z.infer<typeof carouselSchema>;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AppSettingsForm() {
  const { toast } = useToast();
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [isCarouselLoading, setIsCarouselLoading] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(firestore, 'settings', 'appConfig'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setQrPreview(data.paymentQrCodeUrl || null);
        setCarouselImages(data.carouselImages || []);
      }
      setSettingsLoading(false);
    });
    return () => unsub();
  }, []);


  const qrForm = useForm<QrCodeFormValues>({
    resolver: zodResolver(qrCodeSchema),
  });

  const carouselForm = useForm<CarouselFormValues>({
    resolver: zodResolver(carouselSchema),
    defaultValues: { imageUrl: '' },
  });
  
  const handleQrFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      qrForm.setValue('qrCodeFile', file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const onQrSubmit = async (data: QrCodeFormValues) => {
    setIsQrLoading(true);
    try {
      const dataUrl = await fileToDataUrl(data.qrCodeFile);
      await setDoc(doc(firestore, 'settings', 'appConfig'), {
        paymentQrCodeUrl: dataUrl
      }, { merge: true });
      toast({ title: 'Success', description: 'Payment QR code updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsQrLoading(false);
    }
  };
  
  const onCarouselSubmit = async (data: CarouselFormValues) => {
    setIsCarouselLoading(true);
    try {
        await updateDoc(doc(firestore, 'settings', 'appConfig'), {
            carouselImages: arrayUnion(data.imageUrl)
        });
        toast({ title: 'Success', description: 'Carousel image added.' });
        carouselForm.reset();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsCarouselLoading(false);
    }
  };

  const handleRemoveCarouselImage = async (imageUrlToRemove: string) => {
      try {
        await updateDoc(doc(firestore, 'settings', 'appConfig'), {
            carouselImages: arrayRemove(imageUrlToRemove)
        });
        toast({ title: 'Success', description: 'Carousel image removed.' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not remove image.' });
      }
  }

  if (settingsLoading) {
      return (
          <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
          </div>
      )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Payment QR Code</CardTitle>
                <CardDescription>Upload the QR code to be displayed on payment pages.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...qrForm}>
                    <form onSubmit={qrForm.handleSubmit(onQrSubmit)} className="space-y-4">
                        <FormField
                            control={qrForm.control}
                            name="qrCodeFile"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>QR Code Image</FormLabel>
                                <FormControl>
                                    <div>
                                        <Button type="button" variant="outline" className="w-full" onClick={() => qrFileInputRef.current?.click()}>
                                            <Upload className="mr-2 h-4 w-4" />
                                            {qrPreview ? 'Change QR Code' : 'Upload QR Code'}
                                        </Button>
                                        <input
                                            type="file"
                                            ref={qrFileInputRef}
                                            onChange={handleQrFileChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>
                                </FormControl>
                                {qrPreview && <Image src={qrPreview} alt="QR Code preview" width={200} height={200} className="mt-4 rounded-md mx-auto" />}
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isQrLoading}>
                            {isQrLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save QR Code
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Home Page Carousel</CardTitle>
                <CardDescription>Manage images for the main dashboard image slider.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...carouselForm}>
                     <form onSubmit={carouselForm.handleSubmit(onCarouselSubmit)} className="space-y-4 mb-6">
                         <FormField
                            control={carouselForm.control}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>New Image URL</FormLabel>
                                <FormControl>
                                    <div className="flex gap-2">
                                    <Input {...field} placeholder="https://example.com/image.png" />
                                    <Button type="submit" disabled={isCarouselLoading}>
                                        {isCarouselLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                                    </Button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                     </form>
                </Form>

                <div className="space-y-2">
                    <h4 className="font-semibold">Current Images</h4>
                    {carouselImages.length === 0 && <p className="text-sm text-muted-foreground">No images added yet.</p>}
                    {carouselImages.map((url, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 p-2 border rounded-md">
                            <div className="flex items-center gap-2 truncate">
                                <Image src={url} alt={`Carousel Image ${index+1}`} width={40} height={40} className="rounded-sm object-cover" />
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground truncate hover:underline">{url}</a>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveCarouselImage(url)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
