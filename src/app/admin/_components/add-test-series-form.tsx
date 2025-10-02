
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required.'),
  options: z.array(z.string().min(1, 'Option cannot be empty.')).length(4, 'There must be exactly 4 options.'),
  correctAnswer: z.string().min(1, 'Please specify the correct answer.'),
});

const testSeriesSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  subject: z.string().min(1, 'Subject is required.'),
  questions: z.array(questionSchema).min(1, 'Add at least one question.'),
});

type TestSeriesFormValues = z.infer<typeof testSeriesSchema>;

const jsonTestSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    subject: z.string().min(1, 'Subject is required.'),
    jsonContent: z.string().refine(val => {
        try {
            const parsed = JSON.parse(val);
            return z.array(questionSchema).min(1).safeParse(parsed).success;
        } catch {
            return false;
        }
    }, { message: "Invalid JSON format or doesn't match question schema." }),
});
type JsonTestFormValues = z.infer<typeof jsonTestSchema>;


export function AddTestSeriesForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const manualForm = useForm<TestSeriesFormValues>({
    resolver: zodResolver(testSeriesSchema),
    defaultValues: {
      title: '',
      subject: '',
      questions: [],
    },
  });

  const jsonForm = useForm<JsonTestFormValues>({
    resolver: zodResolver(jsonTestSchema),
    defaultValues: {
        title: '',
        subject: '',
        jsonContent: '',
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: manualForm.control,
    name: 'questions',
  });

  const onManualSubmit = async (data: TestSeriesFormValues) => {
    setIsLoading(true);
    try {
      await addDoc(collection(firestore, 'testSeries'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'Test Series added successfully.' });
      manualForm.reset();
    } catch (error) {
      console.error('Error adding test series:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add test series.' });
    } finally {
      setIsLoading(false);
    }
  };

  const onJsonSubmit = async (data: JsonTestFormValues) => {
      setIsLoading(true);
      try {
        const questions = JSON.parse(data.jsonContent);
        await addDoc(collection(firestore, 'testSeries'), {
            title: data.title,
            subject: data.subject,
            questions: questions,
            createdAt: serverTimestamp(),
        });
        toast({ title: 'Success', description: 'Test Series added from JSON successfully.' });
        jsonForm.reset();
      } catch (error) {
          console.error('Error adding test series from JSON:', error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not add test series from JSON.' });
      } finally {
          setIsLoading(false);
      }
  }

  return (
    <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="json">JSON Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="manual">
            <Form {...manualForm}>
            <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-4 mt-4">
                <FormField control={manualForm.control} name="title" render={({ field }) => (
                <FormItem><FormLabel>Test Series Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={manualForm.control} name="subject" render={({ field }) => (
                <FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Questions</h3>
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                            <FormField control={manualForm.control} name={`questions.${index}.text`} render={({ field }) => (
                                <FormItem><FormLabel>Question {index + 1}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            {...Array(4).fill(0).map((_, optionIndex) => (
                                <FormField key={optionIndex} control={manualForm.control} name={`questions.${index}.options.${optionIndex}`} render={({ field }) => (
                                    <FormItem><FormLabel>Option {optionIndex + 1}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            ))}
                            <FormField control={manualForm.control} name={`questions.${index}.correctAnswer`} render={({ field }) => (
                                <FormItem><FormLabel>Correct Answer</FormLabel><FormControl><Input placeholder="Copy one of the options above" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 h-7 w-7"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => append({ text: '', options: ['', '', '', ''], correctAnswer: '' })}><PlusCircle className="mr-2"/>Add Question</Button>
                </div>

                <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Test Series
                </Button>
            </form>
            </Form>
        </TabsContent>
        <TabsContent value="json">
            <Form {...jsonForm}>
                <form onSubmit={jsonForm.handleSubmit(onJsonSubmit)} className="space-y-4 mt-4">
                     <FormField control={jsonForm.control} name="title" render={({ field }) => (
                        <FormItem><FormLabel>Test Series Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={jsonForm.control} name="subject" render={({ field }) => (
                        <FormItem><FormLabel>Subject</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={jsonForm.control} name="jsonContent" render={({ field }) => (
                        <FormItem><FormLabel>Questions (JSON format)</FormLabel><FormControl><Textarea className="min-h-[200px]" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add From JSON
                    </Button>
                </form>
            </Form>
        </TabsContent>
    </Tabs>
  );
}
