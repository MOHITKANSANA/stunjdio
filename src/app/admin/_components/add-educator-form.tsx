'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';

const educatorSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  expertise: z.string().min(1, 'Expertise is required.'),
  photoFile: z.any().refine(file => file, 'An uploaded image is required.'),
});

type EducatorFormValues = z.infer<typeof educatorSchema>;

function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function AddEducatorForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<EducatorFormValues>({
    resolver: zodResolver(educatorSchema),
    defaultValues: {
      name: '',
      expertise: '',
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      form.setValue('photoFile', file);
      setImagePreview(URL.createObjectURL(file));
    }
  };


  const onSubmit = async (data: EducatorFormValues) => {
    setIsLoading(true);
    try {
      const photoUrl = await fileToDataUrl(data.photoFile);

      await addDoc(collection(firestore, 'educators'), {
        name: data.name,
        expertise: data.expertise,
        photoUrl: photoUrl,
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Success', description: 'Educator added successfully.' });
      form.reset();
      setImagePreview(null);
    } catch (error) {
      console.error('Error adding educator:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add educator.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Educator Name</FormLabel><FormControl><Input placeholder="e.g., Dr. Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="expertise" render={({ field }) => (
          <FormItem><FormLabel>Expertise</FormLabel><FormControl><Textarea placeholder="e.g., Physics, UPSC Specialist" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <FormField
          control={form.control}
          name="photoFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Educator Photo</FormLabel>
              <FormControl>
                <div>
                  <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    {imagePreview ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                </div>
              </FormControl>
              {imagePreview && <Image src={imagePreview} alt="Image preview" width={100} height={100} className="mt-2 rounded-md" />}
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Educator
        </Button>
      </form>
    </Form>
  );
}
