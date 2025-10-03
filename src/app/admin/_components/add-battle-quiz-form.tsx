'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';

const questionSchema = z.object({
  question: z.string().min(1, 'Question text is required.'),
  options: z.array(z.string().min(1, 'Option cannot be empty.')).length(4, 'There must be exactly 4 options.'),
  correctAnswer: z.string().min(1, 'Please specify the correct answer.'),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

const ExistingQuestions = () => {
    const { toast } = useToast();
    const [questions, setQuestions] = useState<any[]>([]);
    
    useEffect(() => {
        const q = query(collection(firestore, "battleQuizzes"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this question?")) {
            try {
                await deleteDoc(doc(firestore, 'battleQuizzes', id));
                toast({ title: "Question Deleted" });
            } catch (error: any) {
                toast({ variant: 'destructive', title: "Error", description: error.message });
            }
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Existing Questions</h3>
            {questions.length === 0 && <p className="text-sm text-muted-foreground">No questions added yet.</p>}
            {questions.map((q) => (
                <div key={q.id} className="p-4 border rounded-lg relative">
                    <p className="font-medium">{q.question}</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
                        {q.options.map((opt: string, i: number) => (
                            <li key={i} className={opt === q.correctAnswer ? 'font-bold text-green-600' : ''}>{opt}</li>
                        ))}
                    </ul>
                     <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => handleDelete(q.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>
    )
}

export function AddBattleQuizForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
    },
  });

  const onSubmit = async (data: QuestionFormValues) => {
    setIsLoading(true);
    try {
      if (!data.options.includes(data.correctAnswer)) {
          toast({ variant: 'destructive', title: 'Invalid correct answer', description: 'The correct answer must be one of the options.' });
          setIsLoading(false);
          return;
      }
      await addDoc(collection(firestore, 'battleQuizzes'), {
        ...data,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Success', description: 'New question added for the Battle Quiz.' });
      form.reset();
    } catch (error) {
      console.error('Error adding question:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not add question.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField control={form.control} name="question" render={({ field }) => (
                    <FormItem><FormLabel>Question</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                {...Array(4).fill(0).map((_, optionIndex) => (
                    <FormField key={optionIndex} control={form.control} name={`options.${optionIndex}`} render={({ field }) => (
                        <FormItem><FormLabel>Option {optionIndex + 1}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                ))}
                <FormField control={form.control} name="correctAnswer" render={({ field }) => (
                    <FormItem><FormLabel>Correct Answer</FormLabel><FormControl><Input placeholder="Copy one of the options above" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Question
                </Button>
            </form>
        </Form>
        <ExistingQuestions />
    </div>
  );
}
