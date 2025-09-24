
'use client';

import { useState, Suspense, useEffect } from 'react';
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
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, FileText, AlertTriangle, Award, Download, ArrowLeft, ArrowRight, Bot, User, Languages, HelpCircle, Sigma, BrainCircuit, Mic } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Certificate from '@/components/certificate';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

const testGenerationSchema = z.object({
  subject: z.string().min(1, 'Subject is required.'),
  examType: z.string().min(1, 'Exam type is required.'),
  language: z.string().min(1, 'Language is required.'),
  testType: z.literal('Multiple Choice'),
  questionCount: z.coerce.number().min(3, 'Minimum 3 questions').max(100, 'Maximum 100 questions'),
  difficulty: z.enum(['Easy', 'Hard']),
});

type TestGenerationValues = z.infer<typeof testGenerationSchema>;

const LANGUAGES = ["Hindi", "English"];
const OTHER_LANGUAGES = ["Kannada", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Malayalam", "Punjabi", "Odia", "Assamese", "Urdu", "Sanskrit", "Nepali", "Sindhi", "Konkani", "Manipuri", "Bodo", "Dogri", "Maithili", "Santhali", "Kashmiri"];
const DIFFICULTIES = ['Easy', 'Hard'] as const;
const CLASSES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const EXAMS = ["UPSC", "SSC CGL", "NDA", "CDS", "Army", "NTPC", "PCS"];
const BIG_EXAMS = ["UPSC", "SSC CGL", "NDA", "CDS", "Army", "NTPC", "PCS"];


function AiTestGenerator({ onTestGenerated, isCourseContext = false, subject: courseSubject = 'General', examType: courseExamType = 'General' }: { onTestGenerated: (data: GenerateAiTestOutput, formData: TestGenerationValues) => void; isCourseContext?: boolean; subject?: string; examType?: string; }) {
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<{ type: 'user' | 'ai'; content: string; options?: string[] }[]>([]);
    const [showOtherLanguages, setShowOtherLanguages] = useState(false);
    const { user } = useAuth();
    
    const form = useForm<TestGenerationValues>({
        resolver: zodResolver(testGenerationSchema),
        defaultValues: {
            subject: courseSubject,
            examType: courseExamType,
            language: '',
            testType: 'Multiple Choice',
            questionCount: 10,
            difficulty: 'Easy',
        },
    });

    const isBigExam = BIG_EXAMS.includes(form.watch('examType'));

    useEffect(() => {
        setHistory([{ type: 'ai', content: 'What is your language?', options: [...LANGUAGES, 'Other Languages'] }]);
    }, []);

    const handleSelect = async (value: string | number) => {
        setHistory(prev => [...prev, { type: 'user', content: String(value) }]);

        if (step === 0) { // Language Step
            if (value === 'Other Languages') {
                setShowOtherLanguages(true);
                setHistory(prev => [...prev, { type: 'ai', content: 'Please select your language.', options: OTHER_LANGUAGES }]);
                return; // Wait for user to select from the new list
            }
            form.setValue('language', String(value));
            setStep(1);
            setHistory(prev => [...prev, { type: 'ai', content: `Which exam are you preparing for, or which class are you in?`, options: [...CLASSES, ...EXAMS, 'Other Exam'] }]);
        } else if (step === 1) { // Exam/Class Step
             if (value === 'Other Exam') {
                 // Handle custom exam input if needed in the future
                 form.setValue('examType', 'General');
             } else {
                form.setValue('examType', String(value));
             }
            setStep(2);
            setHistory(prev => [...prev, { type: 'ai', content: 'How many questions do you want?', options: ['10', '25', '50', '100'] }]);
        } else if (step === 2) { // Question Count Step
            form.setValue('questionCount', Number(value));
            setStep(3);
            if (BIG_EXAMS.includes(form.getValues('examType'))) {
                form.setValue('difficulty', 'Hard');
                 // Skip difficulty selection and submit
                 await form.handleSubmit(onGenerateSubmit)();
            } else {
                 setHistory(prev => [...prev, { type: 'ai', content: 'How difficult should the test be?', options: ['Easy', 'Hard'] }]);
            }
        } else if (step === 3) { // Difficulty Step
            // @ts-ignore
            form.setValue('difficulty', value);
            setStep(4);
            // Submit the form
            await form.handleSubmit(onGenerateSubmit)();
        }
    };
    
    async function onGenerateSubmit(data: TestGenerationValues) {
        setIsLoading(true);
        setError(null);
        setHistory(prev => [...prev, { type: 'ai', content: 'Generating your test...' }]);
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
      <div className="bg-[#1e1e1e] text-white rounded-2xl shadow-lg w-full max-w-md mx-auto flex flex-col h-[70vh] overflow-hidden">
        <header className="bg-blue-600 p-3 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-bold text-lg">AI Test Generator</h2>
        </header>
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
            {history.map((item, index) => (
                <div key={index} className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {item.type === 'ai' && (
                    <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src="https://i.postimg.cc/44J0Z5V9/ai-icon.png" />
                        <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                )}
                <div className={`rounded-xl p-3 max-w-xs ${item.type === 'user' ? 'bg-green-600' : 'bg-gray-700'}`}>
                    <p>{item.content}</p>
                    {item.options && (
                        <div className="mt-3 flex flex-col gap-2">
                            {item.options.map(opt => (
                                <button key={opt} onClick={() => handleSelect(opt)} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg text-left transition-colors">
                                    {opt}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                 {item.type === 'user' && (
                    <Avatar className="h-8 w-8 ml-2">
                        <AvatarImage src={user?.photoURL || ''} />
                        <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                )}
                </div>
            ))}
             {isLoading && (
                 <div className="flex justify-start">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src="https://i.postimg.cc/44J0Z5V9/ai-icon.png" />
                        <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                     <div className="rounded-xl p-3 max-w-xs bg-gray-700 flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin"/>
                     </div>
                 </div>
             )}
            </div>
        </ScrollArea>
          {error && (
            <div className="p-4">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Generating Test</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
          )}
      </div>
    );
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

  useEffect(() => {
    if (testData) {
      answeringForm.reset({
          answers: testData.questions.map(q => ({ question: q.question, selectedIndex: undefined }))
      });
    }
  }, [testData, answeringForm]);

  const onTestGenerated = (generatedTestData: GenerateAiTestOutput, formData: TestGenerationValues) => {
    setTestData(generatedTestData);
    setGenerationData(formData);
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
     const timerValue = (generationData.questionCount + 20) * 60; // Example timer logic

     return (
        <div className="max-w-4xl mx-auto space-y-6 p-4">
            <Card className="shadow-lg border-border/60">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle>Your Custom Test</CardTitle>
                                <CardDescription>
                                    Subject: {generationData.subject} | Exam: {generationData.examType}
                                </CardDescription>
                            </div>
                        </div>
                         <div className="font-bold text-lg">Timer: {Math.floor(timerValue / 60)}:{(timerValue % 60).toString().padStart(2, '0')}</div>
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
      <Tabs defaultValue={initialTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ai">AI Generated Tests</TabsTrigger>
          <TabsTrigger value="series">Practice Test Series</TabsTrigger>
        </TabsList>
        <TabsContent value="ai" className="mt-4">
            <AiTestGenerator onTestGenerated={onTestGenerated} />
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

    