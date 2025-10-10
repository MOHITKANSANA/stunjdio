
'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Loader2, Upload, Trash2, Link, PlusCircle } from 'lucide-react';
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

const carouselUploadSchema = z.object({
  imageFile: z.any().refine(file => file, 'An image is required.'),
});
type CarouselUploadFormValues = z.infer<typeof carouselUploadSchema>;

const logoSchema = z.object({
  logoFile: z.any().refine(file => file, 'Logo image is required.'),
});
type LogoFormValues = z.infer<typeof logoSchema>;

const socialLinkSchema = z.object({
    name: z.string().min(1, "Name is required"),
    url: z.string().url("Invalid URL"),
    icon: z.string().min(1, "Lucide icon name is required (e.g., 'youtube')"),
});

const appSettingsSchema = z.object({
  socialMediaLinks: z.array(socialLinkSchema).optional(),
});
type AppSettingsFormValues = z.infer<typeof appSettingsSchema>;


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
  const [isLogoLoading, setIsLogoLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const qrForm = useForm<QrCodeFormValues>({ resolver: zodResolver(qrCodeSchema) });
  const carouselForm = useForm<CarouselUploadFormValues>({ resolver: zodResolver(carouselUploadSchema) });
  const logoForm = useForm<LogoFormValues>({ resolver: zodResolver(logoSchema) });
  const socialForm = useForm<AppSettingsFormValues>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: { socialMediaLinks: [] },
  });

  const { fields, append, remove } = useFieldArray({
      control: socialForm.control,
      name: "socialMediaLinks",
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(firestore, 'settings', 'appConfig'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setQrPreview(data.paymentQrCodeUrl || null);
        setCarouselImages(data.carouselImages || []);
        setLogoPreview(data.appLogoUrl || null);
        socialForm.reset({ socialMediaLinks: data.socialMediaLinks || [] });
      }
      setSettingsLoading(false);
    });
    return () => unsub();
  }, [socialForm]);


  
  const handleQrFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      qrForm.setValue('qrCodeFile', file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const handleLogoFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      logoForm.setValue('logoFile', file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const onQrSubmit = async (data: QrCodeFormValues) => {
    setIsQrLoading(true);
    try {
      const dataUrl = await fileToDataUrl(data.qrCodeFile);
      await setDoc(doc(firestore, 'settings', 'appConfig'), { paymentQrCodeUrl: dataUrl }, { merge: true });
      toast({ title: 'Success', description: 'Payment QR code updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsQrLoading(false);
    }
  };
  
  const onLogoSubmit = async (data: LogoFormValues) => {
    setIsLogoLoading(true);
    try {
      const dataUrl = await fileToDataUrl(data.logoFile);
      await setDoc(doc(firestore, 'settings', 'appConfig'), { appLogoUrl: dataUrl }, { merge: true });
      toast({ title: 'Success', description: 'App logo updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLogoLoading(false);
    }
  }

  const onCarouselSubmit = async (data: CarouselUploadFormValues) => {
    setIsCarouselLoading(true);
    try {
        const imageUrl = await fileToDataUrl(data.imageFile);
        await updateDoc(doc(firestore, 'settings', 'appConfig'), { carouselImages: arrayUnion(imageUrl) });
        toast({ title: 'Success', description: 'Carousel image added.' });
        carouselForm.reset();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsCarouselLoading(false);
    }
  };

  const onSocialSubmit = async (data: AppSettingsFormValues) => {
    setIsSocialLoading(true);
    try {
      await setDoc(doc(firestore, 'settings', 'appConfig'), { socialMediaLinks: data.socialMediaLinks }, { merge: true });
      toast({ title: 'Success', description: 'Social media links updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSocialLoading(false);
    }
  };


  const handleRemoveCarouselImage = async (imageUrlToRemove: string) => {
      try {
        await updateDoc(doc(firestore, 'settings', 'appConfig'), { carouselImages: arrayRemove(imageUrlToRemove) });
        toast({ title: 'Success', description: 'Carousel image removed.' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not remove image.' });
      }
  }

  if (settingsLoading) {
      return (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
          </div>
      )
  }

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            <Card>
                <CardHeader><CardTitle>App Logo</CardTitle><CardDescription>Update the main logo for the splash screen and PWA.</CardDescription></CardHeader>
                <CardContent>
                    <Form {...logoForm}>
                        <form onSubmit={logoForm.handleSubmit(onLogoSubmit)} className="space-y-4">
                            <FormField
                                control={logoForm.control} name="logoFile"
                                render={({ field }) => (
                                    <FormItem><FormLabel>Logo Image</FormLabel>
                                    <FormControl>
                                        <div>
                                            <Button type="button" variant="outline" className="w-full" onClick={() => logoFileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />{logoPreview ? 'Change Logo' : 'Upload Logo'}</Button>
                                            <input type="file" ref={logoFileInputRef} onChange={handleLogoFileChange} className="hidden" accept="image/*" />
                                        </div>
                                    </FormControl>
                                    {logoPreview && <Image src={logoPreview} alt="Logo preview" width={120} height={120} className="mt-4 rounded-full mx-auto" />}
                                    <FormMessage /></FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLogoLoading}> {isLogoLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Logo </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Payment QR Code</CardTitle><CardDescription>Upload the QR code for payment pages.</CardDescription></CardHeader>
                <CardContent>
                    <Form {...qrForm}>
                        <form onSubmit={qrForm.handleSubmit(onQrSubmit)} className="space-y-4">
                            <FormField
                                control={qrForm.control} name="qrCodeFile"
                                render={({ field }) => (
                                    <FormItem><FormLabel>QR Code Image</FormLabel>
                                    <FormControl>
                                        <div>
                                            <Button type="button" variant="outline" className="w-full" onClick={() => qrFileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />{qrPreview ? 'Change QR Code' : 'Upload QR Code'}</Button>
                                            <input type="file" ref={qrFileInputRef} onChange={handleQrFileChange} className="hidden" accept="image/*" />
                                        </div>
                                    </FormControl>
                                    {qrPreview && <Image src={qrPreview} alt="QR Code preview" width={200} height={200} className="mt-4 rounded-md mx-auto" />}
                                    <FormMessage /></FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isQrLoading}> {isQrLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save QR Code </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Home Page Carousel</CardTitle><CardDescription>Manage images for the dashboard slider.</CardDescription></CardHeader>
                <CardContent>
                    <Form {...carouselForm}>
                        <form onSubmit={carouselForm.handleSubmit(onCarouselSubmit)} className="space-y-4 mb-6">
                            <FormField
                                control={carouselForm.control}
                                name="imageFile"
                                render={({ field: { onChange, value, ...fieldProps } }) => (
                                    <FormItem>
                                    <FormLabel>New Image</FormLabel>
                                    <FormControl>
                                        <div className="flex gap-2">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => onChange(e.target.files?.[0])}
                                                // @ts-ignore
                                                value={value?.fileName}
                                            />
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
                        <div className="max-h-60 overflow-y-auto pr-2">
                            {carouselImages.map((url, index) => (
                                <div key={index} className="flex items-center justify-between gap-2 p-2 border rounded-md mb-2">
                                    <div className="flex items-center gap-2 truncate">
                                        <div className="relative w-10 h-10 shrink-0">
                                            <Image src={url} alt={`Carousel Image ${index+1}`} fill className="rounded-sm object-cover" />
                                        </div>
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground truncate hover:underline">{url}</a>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveCarouselImage(url)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader><CardTitle>Social Media Links</CardTitle><CardDescription>Add links to your social media profiles.</CardDescription></CardHeader>
            <CardContent>
                 <Form {...socialForm}>
                    <form onSubmit={socialForm.handleSubmit(onSocialSubmit)} className="space-y-6">
                        {fields.map((field, index) => (
                             <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg">
                                <FormField control={socialForm.control} name={`socialMediaLinks.${index}.name`} render={({ field }) => (
                                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g. YouTube" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <FormField control={socialForm.control} name={`socialMediaLinks.${index}.url`} render={({ field }) => (
                                    <FormItem className="md:col-span-2"><FormLabel>URL</FormLabel><FormControl><Input placeholder="https://youtube.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                               <div className="flex items-center gap-2">
                                 <FormField control={socialForm.control} name={`socialMediaLinks.${index}.icon`} render={({ field }) => (
                                    <FormItem className="flex-1"><FormLabel>Icon</FormLabel><FormControl><Input placeholder="youtube" {...field} /></FormControl></FormItem>
                                )}/>
                                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                               </div>
                            </div>
                        ))}
                         <div className="flex justify-between items-center">
                             <Button type="button" variant="outline" onClick={() => append({ name: '', url: '', icon: '' })}><PlusCircle className="mr-2"/>Add Link</Button>
                             <Button type="submit" disabled={isSocialLoading}>
                                {isSocialLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Social Links
                            </Button>
                         </div>
                    </form>
                 </Form>
            </CardContent>
        </Card>
    </div>
  );
}
