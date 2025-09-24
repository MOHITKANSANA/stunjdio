
'use client';

import { useState } from 'react';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { firestore } from '@/lib/firebase';
import { notFound, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Award, Download, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useForm } from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import Certificate from '@/components/certificate';
import { Progress } from '@/components/ui/progress';

function TestSeriesPlayer() {
  const params = useParams();
  const testId = params.testId as string;
  const { user } = useAuth();

  const [testSeriesDoc, loading, error] = useDocument(doc(firestore, 'testSeries', testId));
  
  const [score, setScore] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  const answeringForm = useForm<{ answers: { [key: number]: string | undefined } }>({
     defaultValues: { answers: {} }
  });

  if (loading) {
    return <Skeleton className="w-full h-96" />;
  }

  if (error || !testSeriesDoc?.exists()) {
    return notFound();
  }
  
  const testSeries = testSeriesDoc.data();
  const questions = testSeries.questions || [];

  const startTest = () => {
    setStartTime(new Date());
  };

  function onCheckAnswers(data: { answers: { [key: number]: string | undefined } }) {
    if (!questions) return;
    let correctAnswers = 0;
    questions.forEach((q: any, index: number) => {
        const userAnswer = data.answers[index];
        if (userAnswer && userAnswer === q.correctAnswer) {
            correctAnswers++;
        }
    });
    setScore((correctAnswers / questions.length) * 100);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  const handleDownloadCertificate = () => {
    const certificate = document.getElementById('certificate');
    if (certificate) {
      const a = document.createElement('a');
      const certificateHTML = certificate.outerHTML;
      const blob = new Blob([
          `<html><head><title>Certificate</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-100 flex items-center justify-center min-h-screen">${certificateHTML}</body></html>`
      ], { type: 'text/html' });
      a.href = URL.createObjectURL(blob);
      a.download = 'certificate.html';
      a.click();
    }
  };

  const resetTest = () => {
    setScore(null);
    setCurrentQuestionIndex(0);
    setStartTime(null);
    answeringForm.reset({ answers: {} });
  }

  const goToNextQuestion = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (!startTime) {
      return (
          <div className="max-w-2xl mx-auto text-center p-4">
              <Card>
                  <CardHeader>
                      <FileText className="h-12 w-12 mx-auto text-primary" />
                      <CardTitle>{testSeries.title}</CardTitle>
                      <CardDescription>{testSeries.subject}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <p>You are about to start the test. Once you begin, you cannot go back. Are you ready?</p>
                  </CardContent>
                  <CardFooter>
                      <Button onClick={startTest} className="w-full">Start Test</Button>
                  </CardFooter>
              </Card>
          </div>
      )
  }

  if (score !== null) {
      return (
        <div className="max-w-4xl mx-auto space-y-6 p-4">
             <Card className="shadow-lg border-border/60">
                 <CardHeader className="text-center">
                    <Award className="mx-auto h-12 w-12 text-yellow-500" />
                    <CardTitle className="text-3xl font-bold">Test Complete!</CardTitle>
                    <CardDescription>You scored {score.toFixed(0)}%</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                     <div id="certificate-wrapper" className='bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto'>
                        <Certificate
                            studentName={user?.displayName || 'Student'}
                            courseName={testSeries.title}
                            score={score}
                            date={new Date().toLocaleDateString()}
                        />
                     </div>
                 </CardContent>
                 <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
                     <Button onClick={handleDownloadCertificate}><Download className="mr-2" />Download Certificate</Button>
                     <Button variant="outline" onClick={resetTest}>Take Another Test</Button>
                 </CardFooter>
            </Card>
        </div>
      )
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
        <Card className="shadow-lg border-border/60">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>{testSeries.title}</CardTitle>
                        <CardDescription>Subject: {testSeries.subject}</CardDescription>
                    </div>
                </div>
                <div className="pt-4">
                    <Progress value={progress} />
                    <p className="text-sm text-muted-foreground text-center mt-2">Question {currentQuestionIndex + 1} of {questions.length}</p>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...answeringForm}>
                    <form onSubmit={answeringForm.handleSubmit(onCheckAnswers)} className="space-y-8">
                            <FormField
                              control={answeringForm.control}
                              name={`answers.${currentQuestionIndex}`}
                              render={({ field }) => (
                                <FormItem className="space-y-3 p-4 border rounded-lg min-h-[250px]">
                                  <FormLabel className="font-semibold text-base">{currentQuestionIndex + 1}. {currentQuestion.text}</FormLabel>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      value={field.value}
                                      className="flex flex-col space-y-1"
                                    >
                                      {currentQuestion.options.map((option: string, optionIndex: number) => (
                                          <FormItem key={optionIndex} className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                              <RadioGroupItem value={option} />
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
  );
}

export default function TestSeriesPage() {
    return <TestSeriesPlayer />;
}
