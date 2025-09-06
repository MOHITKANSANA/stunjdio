
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateAiTestAction } from '@/app/actions/ai-test';
import type { GenerateAiTestOutput } from '@/ai/flows/generate-ai-test';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, FileText, AlertTriangle, Award, Download } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import Certificate from '@/components/certificate';

const testGenerationSchema = z.object({
  subject: z.string().min(1, 'Subject is required.'),
  examType: z.string().min(1, 'Exam type is required.'),
  language: z.string().min(1, 'Language is required.'),
  testType: z.literal('Multiple Choice'),
  questionCount: z.coerce.number().min(3, 'Minimum 3 questions').max(20, 'Maximum 20 questions'),
});

type TestGenerationValues = z.infer<typeof testGenerationSchema>;

const testAnsweringSchema = z.object({
    answers: z.array(z.object({
        question: z.string(),
        selectedIndex: z.string().optional(),
    }))
});

type TestAnsweringValues = z.infer<typeof testAnsweringSchema>;


export default function AiTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState<GenerateAiTestOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const { t } = useLanguage();
  const { user } = useAuth();

  const generationForm = useForm<TestGenerationValues>({
    resolver: zodResolver(testGenerationSchema),
    defaultValues: {
      subject: '',
      examType: '',
      language: 'English',
      testType: 'Multiple Choice',
      questionCount: 5,
    },
  });

  const answeringForm = useForm<TestAnsweringValues>({
     resolver: zodResolver(testAnsweringSchema),
     defaultValues: {
        answers: []
     }
  });

  const { fields } = useFieldArray({
    control: answeringForm.control,
    name: "answers",
  });

  async function onGenerateSubmit(data: TestGenerationValues) {
    setIsLoading(true);
    setTestData(null);
    setError(null);
    setScore(null);
    try {
      const result = await generateAiTestAction(data);
      setTestData(result);
      answeringForm.reset({
        answers: result.questions.map(q => ({ question: q.question, selectedIndex: undefined }))
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  function onCheckAnswers(data: TestAnsweringValues) {
    if (!testData) return;
    let correctAnswers = 0;
    testData.questions.forEach((q, index) => {
        const userAnswer = data.answers[index];
        if (userAnswer && userAnswer.selectedIndex !== undefined && parseInt(userAnswer.selectedIndex) === q.correctAnswerIndex) {
            correctAnswers++;
        }
    });
    setScore((correctAnswers / testData.questions.length) * 100);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  const handleDownloadCertificate = () => {
    const certificate = document.getElementById('certificate');
    if (certificate) {
      const a = document.createElement('a');
      const certificateHTML = certificate.outerHTML;
      const blob = new Blob([
          `<html>
             <head>
                <title>Certificate</title>
                <script src="https://cdn.tailwindcss.com"></script>
             </head>
             <body>${certificateHTML}</body>
           </html>`
      ], { type: 'text/html' });
      a.href = URL.createObjectURL(blob);
      a.download = 'certificate.html';
      a.click();
    }
  };
  
  const resetTest = () => {
    setTestData(null);
    setScore(null);
    setError(null);
    generationForm.reset();
  }

  if (score !== null && testData) {
     return (
        <div className="max-w-4xl mx-auto space-y-6 pb-8">
             <Card className="shadow-lg border-border/60">
                 <CardHeader className="text-center">
                    <Award className="mx-auto h-12 w-12 text-yellow-500" />
                    <CardTitle className="text-3xl font-bold">Test Complete!</CardTitle>
                    <CardDescription>You scored {score.toFixed(0)}%</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                    <div className="text-center">
                        <p>Here is your certificate of completion.</p>
                    </div>
                     <div id="certificate-wrapper" className='bg-gray-100 p-4 rounded-lg'>
                        <Certificate
                            studentName={user?.displayName || 'Student'}
                            courseName={`${generationForm.getValues('subject')} Practice Test (${generationForm.getValues('examType')})`}
                            score={score}
                            date={new Date().toLocaleDateString()}
                        />
                     </div>

                    <div className="p-4 border rounded-lg space-y-4">
                        <h3 className="font-semibold text-lg">Review Your Answers</h3>
                        {testData.questions.map((q, index) => {
                             const userAnswerIndex = answeringForm.getValues(`answers.${index}.selectedIndex`);
                             const isCorrect = userAnswerIndex !== undefined && parseInt(userAnswerIndex) === q.correctAnswerIndex;
                            return (
                                <div key={index} className="p-3 rounded-md bg-muted/50 border">
                                    <p className="font-medium mb-2">{index + 1}. {q.question}</p>
                                    <p className="text-sm">Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>{userAnswerIndex !== undefined ? q.options[parseInt(userAnswerIndex)] : "Not Answered"}</span></p>
                                    {!isCorrect && <p className="text-sm">Correct answer: <span className="text-green-600">{q.options[q.correctAnswerIndex]}</span></p>}
                                </div>
                            )
                        })}
                    </div>
                 </CardContent>
                 <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
                     <Button onClick={handleDownloadCertificate}><Download className="mr-2" />Download Certificate</Button>
                     <Button variant="outline" onClick={resetTest}>Take Another Test</Button>
                 </CardFooter>
            </Card>
        </div>
     );
  }

  if (testData) {
     return (
        <div className="max-w-4xl mx-auto space-y-6 pb-8">
            <Card className="shadow-lg border-border/60">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Your Custom Test</CardTitle>
                            <CardDescription>
                                Subject: {generationForm.getValues('subject')} | Exam: {generationForm.getValues('examType')}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...answeringForm}>
                        <form onSubmit={answeringForm.handleSubmit(onCheckAnswers)} className="space-y-8">
                            {fields.map((field, index) => (
                                <FormField
                                  key={field.id}
                                  control={answeringForm.control}
                                  name={`answers.${index}.selectedIndex`}
                                  render={({ field }) => (
                                    <FormItem className="space-y-3 p-4 border rounded-lg">
                                      <FormLabel className="font-semibold text-base">{index + 1}. {testData.questions[index].question}</FormLabel>
                                      <FormControl>
                                        <RadioGroup
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                          className="flex flex-col space-y-1"
                                        >
                                          {testData.questions[index].options.map((option, optionIndex) => (
                                              <FormItem key={optionIndex} className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                  <RadioGroupItem value={String(optionIndex)} />
                                                </FormControl>
                                                <FormLabel className="font-normal">{option}</FormLabel>
                                              </FormItem>
                                          ))}
                                        </RadioGroup>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                            ))}
                             <Button type="submit">Submit Test</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
     )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
          AI Practice Test Generator
        </h1>
        <p className="text-muted-foreground mt-2">
          Create a personalized practice test for any subject and exam.
        </p>
      </div>

      <Card className="shadow-lg border-border/60">
        <CardHeader>
          <CardTitle>Create Your Test</CardTitle>
          <CardDescription>
            Fill in the details below to generate your personalized test.
          </CardDescription>
        </CardHeader>
        <Form {...generationForm}>
          <form onSubmit={generationForm.handleSubmit(onGenerateSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={generationForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Maths">Maths</SelectItem>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="GK">General Knowledge (GK)</SelectItem>
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Reasoning">Reasoning</SelectItem>
                          <SelectItem value="Indian History">Indian History</SelectItem>
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={generationForm.control}
                name="examType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competitive Exam Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an exam type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UPSC">UPSC</SelectItem>
                        <SelectItem value="Sainik School">Sainik School</SelectItem>
                        <SelectItem value="Railway">Railway</SelectItem>
                        <SelectItem value="National Military School">National Military School</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={generationForm.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="Kannada">Kannada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={generationForm.control}
                name="questionCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Questions</FormLabel>
                    <FormControl>
                      <Input type="number" min="3" max="20" {...field} />
                    </FormControl>
                     <FormDescription>Choose between 3 and 20 questions.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Your Test...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Test
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
        {error && (
            <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Generating Test</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
    </div>
  );
}
