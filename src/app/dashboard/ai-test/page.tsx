
'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateAiTestAction } from '@/app/actions/ai-test';
import type { GenerateAiTestOutput } from '@/ai/flows/generate-ai-test';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import Link from 'next/link';

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
import { Loader2, Sparkles, FileText, AlertTriangle, Award, Download, ArrowLeft, ArrowRight, Bot, User, Languages, HelpCircle, Sigma, BrainCircuit, Mic } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Certificate from '@/components/certificate';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const testGenerationSchema = z.object({
  subject: z.string().min(1, 'Subject is required.'),
  examType: z.string().min(1, 'Exam type is required.'),
  language: z.string().min(1, 'Language is required.'),
  testType: z.literal('Multiple Choice'),
  questionCount: z.coerce.number().min(3, 'Minimum 3 questions').max(50, 'Maximum 50 questions'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
});

type TestGenerationValues = z.infer<typeof testGenerationSchema>;

const LANGUAGES = ["English", "Hindi", "Kannada", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Malayalam", "Punjabi", "Odia", "Assamese", "Urdu", "Sanskrit", "Nepali", "Sindhi", "Konkani", "Manipuri", "Bodo", "Dogri", "Maithili", "Santhali", "Kashmiri"];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const;

function AiTestGenerator({ onTestGenerated, subject, examType }: { onTestGenerated: (data: GenerateAiTestOutput, formData: TestGenerationValues) => void, subject?: string, examType?: string }) {
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const form = useForm<TestGenerationValues>({
        resolver: zodResolver(testGenerationSchema),
        defaultValues: {
            subject: subject || '',
            examType: examType || '',
            language: 'English',
            testType: 'Multiple Choice',
            questionCount: 5,
            difficulty: 'Medium',
        },
    });

    const steps = [
        { id: 'language', title: 'किस भाषा में टेस्ट बनाना है?', icon: Languages, options: LANGUAGES },
        { id: 'questionCount', title: 'कितने सवाल चाहिए?', icon: HelpCircle, options: [5, 10, 15, 20, 25] },
        { id: 'difficulty', title: 'टेस्ट कितना कठिन होना चाहिए?', icon: Sigma, options: DIFFICULTIES },
    ];

    const currentStep = steps[step];

    const handleSelect = async (value: string | number) => {
        // @ts-ignore
        form.setValue(currentStep.id, value, { shouldValidate: true });

        if (step < steps.length - 1) {
            setStep(s => s + 1);
        } else {
            await form.handleSubmit(onGenerateSubmit)();
        }
    };
    
    async function onGenerateSubmit(data: TestGenerationValues) {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateAiTestAction(data);
            onTestGenerated(result, data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }
    
    return (
        <Card className="shadow-lg border-border/60 bg-gradient-to-br from-purple-400/10 via-blue-400/10 to-teal-400/10">
            <CardHeader className="text-center">
                <Bot className="h-12 w-12 mx-auto text-primary animate-bounce" />
                <CardTitle>AI Test Generator</CardTitle>
                <CardDescription>Let's create your personalized test!</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[250px] flex flex-col justify-center items-center">
                {isLoading ? (
                    <div className="text-center space-y-3">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                        <p className="font-semibold">Generating your test...</p>
                        <p className="text-sm text-muted-foreground">This may take a moment.</p>
                    </div>
                ) : (
                    <div className="w-full text-center space-y-4">
                        <div className="flex items-center justify-center gap-2 font-semibold text-lg">
                           <currentStep.icon className="h-6 w-6 text-primary" />
                           <h3>{currentStep.title}</h3>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 pt-4">
                            {currentStep.options.map(option => (
                                <Button key={option} variant="outline" size="lg" onClick={() => handleSelect(option)}>
                                    {option} {currentStep.id === 'questionCount' && 'Questions'}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
                 {error && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error Generating Test</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    )
}

function AiTestPageContent() {
  const [testData, setTestData] = useState<GenerateAiTestOutput | null>(null);
  const [generationData, setGenerationData] = useState<TestGenerationValues | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get('tab') || 'ai';
  
  const [testSeriesCollection, testSeriesLoading] = useCollection(
      query(collection(firestore, 'testSeries'), orderBy('createdAt', 'desc'))
  );

  const answeringForm = useForm<{ answers: { question: string; selectedIndex?: string }[] }>({
     defaultValues: { answers: [] }
  });

  const { fields } = useFieldArray({
    control: answeringForm.control,
    name: "answers",
  });

  const onTestGenerated = (generatedTestData: GenerateAiTestOutput, formData: TestGenerationValues) => {
    setTestData(generatedTestData);
    setGenerationData(formData);
    answeringForm.reset({
        answers: generatedTestData.questions.map(q => ({ question: q.question, selectedIndex: undefined }))
    });
  }

  function onCheckAnswers(data: { answers: { question: string; selectedIndex?: string }[] }) {
    if (!testData) return;
    let correctAnswers = 0;
    testData.questions.forEach((q, index) => {
        const userAnswer = data.answers[index];
        if (userAnswer && userAnswer.selectedIndex !== undefined && parseInt(userAnswer.selectedIndex) === q.correctAnswerIndex) {
            correctAnswers++;
        }
    });
    setScore((correctAnswers / testData.questions.length) * 100);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
             <body class="bg-gray-100 flex items-center justify-center min-h-screen">${certificateHTML}</body>
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
    setGenerationData(null);
    setCurrentQuestionIndex(0);
  }
  
  const goToNextQuestion = () => {
    if (testData && currentQuestionIndex < testData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const onTabChange = (value: string) => {
    router.push(`/dashboard/ai-test?tab=${value}`);
  };


  if (score !== null && testData && generationData) {
     return (
        <div className="max-w-4xl mx-auto space-y-6 p-4">
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
                     <div id="certificate-wrapper" className='bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto'>
                        <Certificate
                            studentName={user?.displayName || 'Student'}
                            courseName={`${generationData.subject} Practice Test (${generationData.examType})`}
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

  if (testData && generationData) {
     const currentQuestion = testData.questions[currentQuestionIndex];
     const isLastQuestion = currentQuestionIndex === testData.questions.length - 1;
     const progress = ((currentQuestionIndex + 1) / testData.questions.length) * 100;

     return (
        <div className="max-w-4xl mx-auto space-y-6 p-4">
            <Card className="shadow-lg border-border/60">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Your Custom Test</CardTitle>
                            <CardDescription>
                                Subject: {generationData.subject} | Exam: {generationData.examType}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="pt-4">
                        <Progress value={progress} />
                        <p className="text-sm text-muted-foreground text-center mt-2">Question {currentQuestionIndex + 1} of {testData.questions.length}</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...answeringForm}>
                        <form onSubmit={answeringForm.handleSubmit(onCheckAnswers)} className="space-y-8">
                                <FormField
                                  key={fields[currentQuestionIndex].id}
                                  control={answeringForm.control}
                                  name={`answers.${currentQuestionIndex}.selectedIndex`}
                                  render={({ field }) => (
                                    <FormItem className="space-y-3 p-4 border rounded-lg min-h-[250px]">
                                      <FormLabel className="font-semibold text-base">{currentQuestionIndex + 1}. {currentQuestion.question}</FormLabel>
                                      <FormControl>
                                        <RadioGroup
                                          onValueChange={field.onChange}
                                          value={field.value}
                                          className="flex flex-col space-y-1"
                                        >
                                          {currentQuestion.options.map((option, optionIndex) => (
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
                             
                             <div className="flex justify-between items-center">
                                <Button type="button" variant="outline" onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0}>
                                    <ArrowLeft className="mr-2"/> Previous
                                </Button>
                                
                                {isLastQuestion ? (
                                    <Button type="submit">Submit Test</Button>
                                ) : (
                                    <Button type="button" onClick={goToNextQuestion}>
                                        Next <ArrowRight className="ml-2"/>
                                    </Button>
                                )}
                             </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
     )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
          Practice Tests
        </h1>
        <p className="text-muted-foreground mt-2">
          Create a personalized practice test with AI or take a pre-made test from our series.
        </p>
      </div>

      <Tabs defaultValue={initialTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai">AI Generated Tests</TabsTrigger>
          <TabsTrigger value="series">Practice Test Series</TabsTrigger>
        </TabsList>
        <TabsContent value="ai" className="mt-4">
            <AiTestGenerator onTestGenerated={onTestGenerated} subject="General" examType="General" />
        </TabsContent>
        <TabsContent value="series">
            <Card className="shadow-lg border-border/60 mt-4">
                 <CardHeader>
                    <CardTitle>Test Series</CardTitle>
                    <CardDescription>
                        Select a test from our curated series to practice.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   {testSeriesLoading ? (
                       <p>Loading test series...</p>
                   ) : testSeriesCollection && !testSeriesCollection.empty ? (
                        <div className="space-y-4">
                            {testSeriesCollection.docs.map(doc => (
                                <Link key={doc.id} href={`/dashboard/test-series/${doc.id}`}>
                                    <div className="p-4 border rounded-lg hover:bg-muted transition-colors">
                                        <h3 className="font-semibold">{doc.data().title}</h3>
                                        <p className="text-sm text-muted-foreground">{doc.data().subject}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                   ) : (
                        <div className="text-center p-8 text-muted-foreground">
                            <FileText className="mx-auto h-12 w-12" />
                            <p className="mt-4">No practice test series available yet.</p>
                        </div>
                   )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AiTestPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AiTestPageContent />
        </Suspense>
    )
}
