
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, doc, query, where, updateDoc, arrayUnion, onSnapshot, serverTimestamp, setDoc, increment } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Swords, Trophy, UserCheck, ShieldQuestion, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { generateAiTest } from '@/ai/flows/generate-ai-test';


const QuizRoom = () => {
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();
    
    useEffect(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            try {
                const testData = await generateAiTest({
                    subject: 'General Knowledge',
                    examType: 'General',
                    language: 'English',
                    testType: 'Multiple Choice',
                    questionCount: 10,
                    difficulty: 'Easy',
                });
                setQuestions(testData.questions);
            } catch (e) {
                toast({ variant: 'destructive', description: 'Could not load quiz questions.' });
            } finally {
                setLoading(false);
            }
        };
        fetchQuestions();
    }, [toast]);
    
    useEffect(() => {
        // Save score when quiz is finished
        if (isFinished && user) {
            const leaderboardRef = doc(firestore, 'battleQuizLeaderboard', user.uid);
            setDoc(leaderboardRef, {
                name: user.displayName,
                photoURL: user.photoURL,
                score: increment(score),
                lastPlayed: serverTimestamp()
            }, { merge: true });
        }
    }, [isFinished, user, score]);

    const handleAnswer = (answer: string) => {
        if(selectedAnswer) return;

        setSelectedAnswer(answer);
        const question = questions[currentQuestionIndex];
        if (answer === question.options[question.correctAnswerIndex]) {
            setScore(prev => prev + 10);
            toast({ description: '+10 points!' });
        } else {
             toast({ variant: 'destructive', description: 'Incorrect answer.' });
        }
        
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedAnswer(null);
            } else {
                setIsFinished(true);
            }
        }, 1200);
    };

    if (loading) return <Loader2 className="animate-spin mx-auto my-8" />;

    if (isFinished) {
        return <QuizLeaderboard userScore={score} />;
    }

    const question = questions[currentQuestionIndex];
    if (!question) return <p>Loading question...</p>

    return (
        <Card>
            <CardHeader>
                <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />
                <CardTitle className="pt-4">{question.question}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {question.options.map((opt: string, i: number) => {
                     const isCorrect = i === question.correctAnswerIndex;
                     let variant: "default" | "destructive" | "outline" = "outline";
                     if (selectedAnswer) {
                         if(opt === selectedAnswer && isCorrect) variant = "default";
                         else if (opt === selectedAnswer && !isCorrect) variant = "destructive";
                         else if (isCorrect) variant = "default";
                     }

                    return (
                        <Button 
                            key={i} 
                            variant={variant}
                            className="h-auto py-4 text-base"
                            onClick={() => handleAnswer(opt)}
                            disabled={!!selectedAnswer}
                        >
                            {opt}
                        </Button>
                    )
                })}
            </CardContent>
        </Card>
    );
};

const QuizLeaderboard = ({ userScore }: { userScore: number }) => {
    const [leaderboard, loading] = useCollection(
        query(collection(firestore, 'battleQuizLeaderboard'), where('score', '>', 0))
    );
    
    const sortedLeaderboard = useMemo(() => {
        return leaderboard?.docs.map(doc => ({ ...doc.data() })).sort((a, b) => b.score - a.score) || [];
    }, [leaderboard]);

    return (
        <Card>
            <CardHeader className="text-center">
                 <Trophy className="mx-auto h-12 w-12 text-yellow-400" />
                <CardTitle>Quiz Finished!</CardTitle>
                <CardDescription>You scored {userScore} points.</CardDescription>
            </CardHeader>
            <CardContent>
                 <h3 className="font-bold text-center mb-4">Leaderboard</h3>
                 <div className="space-y-3 max-h-60 overflow-y-auto">
                     {loading && <Skeleton className="h-24 w-full" />}
                     {sortedLeaderboard.map((p: any, i: number) => (
                        <div key={p.uid} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <div className="flex items-center gap-3">
                                <span className="font-bold w-6">{i + 1}.</span>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={p.photoURL} />
                                    <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{p.name}</span>
                            </div>
                            <span className="font-bold">{p.score} pts</span>
                        </div>
                     ))}
                 </div>
            </CardContent>
        </Card>
    );
};


export default function BattleQuizPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6 p-4">
            <div className="text-center">
                <BrainCircuit className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-4xl font-bold font-headline mt-4">AI Battle Quiz</h1>
                <p className="text-muted-foreground mt-2">Test your knowledge with AI-generated questions!</p>
            </div>
            <QuizRoom />
        </div>
    );
}
