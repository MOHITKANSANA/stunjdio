
'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Loader2, Upload, Trash2, Link as LinkIcon, PlusCircle, Youtube, Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

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

const appLinkSchema = z.object({
    referralLink: z.string().url('Please enter a valid URL.'),
});
type AppLinkValues = z.infer<typeof appLinkSchema>;


const logoSchema = z.object({
  logoFile: z.any().refine(file => file, 'Logo image is required.'),
});
type LogoFormValues = z.infer<typeof logoSchema>;

const socialLinkSchema = z.object({
    name: z.string().min(1, "Name is required"),
    url: z.string().url("Invalid URL"),
    icon: z.any().optional(), // Make icon optional for predefined ones
    iconName: z.string().optional(),
});

const appSettingsSchema = z.object({
  socialMediaLinks: z.array(socialLinkSchema).optional(),
  defaultTheme: z.enum(['light', 'dark', 'system']).optional(),
  aiFeaturesEnabled: z.boolean().optional(),
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

const SocialIcon = ({ icon, iconName }: { icon?: string | File, iconName?: string }) => {
    const [iconUrl, setIconUrl] = useState('');

    useEffect(() => {
        if(typeof icon === 'string') {
            setIconUrl(icon)
        } else if (icon instanceof File) {
            const url = URL.createObjectURL(icon);
            setIconUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setIconUrl('');
        }
    }, [icon]);

    if (iconName === 'youtube') return <Youtube className="h-10 w-10 text-red-600" />
    if (iconName === 'instagram') return <Instagram className="h-10 w-10 text-pink-600" />
    if (iconName === 'facebook') return <Facebook className="h-10 w-10 text-blue-600" />
    if (iconName === 'twitter') return <Twitter className="h-10 w-10 text-sky-500" />
    if (iconName === 'linkedin') return <Linkedin className="h-10 w-10 text-blue-700" />
    
    if (iconUrl) return <Image src={iconUrl} alt="icon" width={40} height={40} className="rounded-full" />
    
    return <LinkIcon className="h-10 w-10" />
};

export function AppSettingsForm() {
  const { toast } = useToast();
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [isCarouselLoading, setIsCarouselLoading] = useState(false);
  const [isLogoLoading, setIsLogoLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [isLinkLoading, setIsLinkLoading] = useState(false);
  const [isThemeLoading, setIsThemeLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const ADMIN_PASSWORD = "ADMIN@123";

  const qrForm = useForm<QrCodeFormValues>({ resolver: zodResolver(qrCodeSchema) });
  const carouselForm = useForm<CarouselUploadFormValues>({ resolver: zodResolver(carouselUploadSchema) });
  const logoForm = useForm<LogoFormValues>({ resolver: zodResolver(logoSchema) });
  const socialForm = useForm<AppSettingsFormValues>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: { socialMediaLinks: [] },
  });
  const linkForm = useForm<AppLinkValues>({
    resolver: zodResolver(appLinkSchema),
  });
  const settingsForm = useForm<AppSettingsFormValues>({
    resolver: zodResolver(appSettingsSchema),
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
        linkForm.reset({ referralLink: data.referralLink || '' });
        settingsForm.reset({ 
            defaultTheme: data.defaultTheme || 'dark',
            aiFeaturesEnabled: data.aiFeaturesEnabled === undefined ? true : data.aiFeaturesEnabled,
         });
      }
      setSettingsLoading(false);
    });
    return () => unsub();
  }, [socialForm, linkForm, settingsForm]);


  
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
    const password = prompt("Enter admin password to change QR code:");
    if (password !== ADMIN_PASSWORD) {
        toast({ variant: 'destructive', title: 'Incorrect Password' });
        return;
    }
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

  const onReferralLinkSubmit = async (data: AppLinkValues) => {
    setIsLinkLoading(true);
    try {
        await setDoc(doc(firestore, 'settings', 'appConfig'), { referralLink: data.referralLink }, { merge: true });
        toast({ title: 'Success', description: 'Referral link updated.' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsLinkLoading(false);
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
      const linksToSave = await Promise.all(
        (data.socialMediaLinks || []).map(async (link) => {
          let iconUrl = '';
          if (link.icon instanceof File) {
            iconUrl = await fileToDataUrl(link.icon);
          } else if (typeof link.icon === 'string') {
            iconUrl = link.icon;
          }
          return { name: link.name, url: link.url, icon: iconUrl, iconName: link.iconName };
        })
      );

      await setDoc(doc(firestore, 'settings', 'appConfig'), { socialMediaLinks: linksToSave }, { merge: true });
      toast({ title: 'Success', description: 'Social media links updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSocialLoading(false);
    }
  };

  const onGeneralSettingsSubmit = async (data: AppSettingsFormValues) => {
    setIsThemeLoading(true); // Re-use one of the loaders
    try {
      await setDoc(doc(firestore, 'settings', 'appConfig'), { 
          defaultTheme: data.defaultTheme,
          aiFeaturesEnabled: data.aiFeaturesEnabled,
       }, { merge: true });
      toast({ title: 'Success', description: 'App settings updated.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsThemeLoading(false);
    }
  }


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
        <Form {...settingsForm}>
            <form onSubmit={settingsForm.handleSubmit(onGeneralSettingsSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {/* Theme and AI Settings Card */}
                     <Card>
                        <CardHeader>
                            <CardTitle>General App Settings</CardTitle>
                            <CardDescription>Manage global settings for the application.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={settingsForm.control}
                                name="defaultTheme"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Default Theme</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select a theme" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="dark">Dark</SelectItem>
                                                <SelectItem value="light">Light</SelectItem>
                                                <SelectItem value="system">System Preference</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={settingsForm.control}
                                name="aiFeaturesEnabled"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                    <FormLabel>AI Features</FormLabel>
                                    <FormDescription>
                                        Enable or disable AI Tutor, AI Tests, etc.
                                    </FormDescription>
                                    </div>
                                    <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                    </FormControl>
                                </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    {/* QR Code Card */}
                    <Card>
                        <CardHeader><CardTitle>Payment QR Code</CardTitle><CardDescription>Upload the QR code for payment pages.</CardDescription></CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>

                    {/* Carousel Card */}
                    <Card>
                        <CardHeader><CardTitle>Home Page Carousel</CardTitle><CardDescription>Manage images for the dashboard slider.</CardDescription></CardHeader>
                        <CardContent>
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

                    {/* Referral Link Card */}
                    <Card>
                        <CardHeader><CardTitle>Referral Link</CardTitle><CardDescription>Set the app link for the "Refer &amp; Earn" feature.</CardDescription></CardHeader>
                        <CardContent>
                            <form onSubmit={linkForm.handleSubmit(onReferralLinkSubmit)} className="space-y-4">
                                <FormField
                                    control={linkForm.control}
                                    name="referralLink"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>App Link</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://yourapp.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isLinkLoading}>
                                    {isLinkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Link
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
                 <Button type="submit" disabled={isThemeLoading}>
                    {isThemeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save General Settings
                </Button>
            </form>
        </Form>
        <Card>
            <CardHeader><CardTitle>Social Media Links</CardTitle><CardDescription>Add links to your social media profiles.</CardDescription></CardHeader>
            <CardContent>
                 <Form {...socialForm}>
                    <form onSubmit={socialForm.handleSubmit(onSocialSubmit)} className="space-y-6">
                        {fields.map((field, index) => {
                             const selectedIconName = socialForm.watch(`socialMediaLinks.${index}.iconName`);
                             return (
                             <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg">
                                <FormField control={socialForm.control} name={`socialMediaLinks.${index}.name`} render={({ field }) => (
                                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g. YouTube Channel" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={socialForm.control} name={`socialMediaLinks.${index}.url`} render={({ field }) => (
                                    <FormItem><FormLabel>URL</FormLabel><FormControl><Input placeholder="https://youtube.com/..." {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField
                                    control={socialForm.control}
                                    name={`socialMediaLinks.${index}.iconName`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Icon</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                          <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select Icon" /></SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="youtube">YouTube</SelectItem>
                                            <SelectItem value="instagram">Instagram</SelectItem>
                                            <SelectItem value="facebook">Facebook</SelectItem>
                                            <SelectItem value="twitter">Twitter</SelectItem>
                                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                                            <SelectItem value="custom">Custom...</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </FormItem>
                                    )}
                                  />
                                <div className="flex items-center gap-2">
                                     {selectedIconName === 'custom' && (
                                        <FormField
                                            control={socialForm.control}
                                            name={`socialMediaLinks.${index}.icon`}
                                            render={({ field: { onChange, value, ...rest } }) => (
                                                <FormItem className="flex-1">
                                                    <FormLabel className="sr-only">Upload</FormLabel>
                                                    <FormControl>
                                                        <Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files?.[0])} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                     )}
                                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                               </div>
                            </div>
                         )})}
                         <div className="flex justify-between items-center">
                             <Button type="button" variant="outline" onClick={() => append({ name: '', url: '', iconName: 'link' })}><PlusCircle className="mr-2"/>Add Link</Button>
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
