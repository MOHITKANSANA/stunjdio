
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

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required.'),
  options: z.array(z.string().min(1, 'Option cannot be empty.')).length(4, 'There must be exactly 4 options.'),
  correctAnswer: z.string().min(1, 'Please specify the correct answer.'),
  points: z.coerce.number().min(1, 'Points must be at least 1').default(10),
});

const battleQuizSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  questions: z.array(questionSchema).min(1, 'Add at least one question.'),
});

type BattleQuizFormValues = z.infer<typeof battleQuizSchema>;

export function AddBattleQuizForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BattleQuizFormValues>({
    resolver: zodResolver(battleQuizSchema),
    defaultValues: {
      title: '',
      questions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const onSubmit = async (data: BattleQuizFormValues) => {
    setIsLoading(true);
    try {
      await addDoc(collection(firestore, 'battleQuizzes'), {
        ...data,
        createdAt: serverTimestamp(),
        isActive: true, // Make it active by default
        participants: [],
      });
      toast({ title: 'Success', description: 'Battle Quiz added successfully.' });
      form.reset();
    } catch (error) {
      console.error('Error adding battle quiz:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add battle quiz.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Quiz Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Questions</h3>
            {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                    <FormField control={form.control} name={`questions.${index}.text`} render={({ field }) => (
                        <FormItem><FormLabel>Question {index + 1}</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    {...Array(4).fill(0).map((_, optionIndex) => (
                        <FormField key={optionIndex} control={form.control} name={`questions.${index}.options.${optionIndex}`} render={({ field }) => (
                            <FormItem><FormLabel>Option {optionIndex + 1}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    ))}
                    <FormField control={form.control} name={`questions.${index}.correctAnswer`} render={({ field }) => (
                        <FormItem><FormLabel>Correct Answer</FormLabel><FormControl><Input placeholder="Copy one of the options above" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`questions.${index}.points`} render={({ field }) => (
                        <FormItem><FormLabel>Points</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="absolute top-2 right-2 h-7 w-7"><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ text: '', options: ['', '', '', ''], correctAnswer: '', points: 10 })}><PlusCircle className="mr-2"/>Add Question</Button>
        </div>

        <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Add Battle Quiz
        </Button>
      </form>
    </Form>
  );
}
