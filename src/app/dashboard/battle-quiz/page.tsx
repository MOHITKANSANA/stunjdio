
'use client';

import { useState, useEffect } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, doc, query, where, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Swords, Trophy, UserCheck, ShieldQuestion } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';


const QuizLobby = () => {
    const [quizzes, loading, error] = useCollection(
        query(collection(firestore, 'battleQuizzes'), where('isActive', '==', true))
    );
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

    const handleJoinQuiz = async (quizId: string) => {
        if (!user) {
            toast({ variant: 'destructive', description: 'You must be logged in to join.' });
            return;
        }
        try {
            const quizRef = doc(firestore, 'battleQuizzes', quizId);
            await updateDoc(quizRef, {
                participants: arrayUnion({
                    uid: user.uid,
                    name: user.displayName,
                    photoURL: user.photoURL,
                    score: 0,
                })
            });
            setSelectedQuizId(quizId);
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        }
    };

    if (selectedQuizId) {
        return <QuizRoom quizId={selectedQuizId} />;
    }
    
    if (loading) return <Skeleton className="h-64 w-full" />

    return (
        <div className="space-y-4">
            {quizzes?.docs.map(quizDoc => {
                const quiz = quizDoc.data();
                return (
                    <Card key={quizDoc.id}>
                        <CardHeader>
                            <CardTitle>{quiz.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{quiz.questions.length} Questions</p>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={() => handleJoinQuiz(quizDoc.id)}>Join Quiz</Button>
                        </CardFooter>
                    </Card>
                )
            })}
             {!loading && quizzes?.empty && (
                <Card className="text-center p-8">
                     <ShieldQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
                    <CardTitle className="mt-4">No Active Quizzes</CardTitle>
                    <CardDescription>There are no battle quizzes available right now. Please check back later.</CardDescription>
                </Card>
            )}
        </div>
    )
};

const QuizRoom = ({ quizId }: { quizId: string }) => {
    const [quizData, setQuizData] = useState<any>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const unsub = onSnapshot(doc(firestore, 'battleQuizzes', quizId), (doc) => {
            setQuizData(doc.data());
        });
        return () => unsub();
    }, [quizId]);

    const handleAnswer = (answer: string) => {
        setSelectedAnswer(answer);
        const question = quizData.questions[currentQuestionIndex];
        if (answer === question.correctAnswer) {
            setScore(prev => prev + question.points);
        }
        
        setTimeout(() => {
            if (currentQuestionIndex < quizData.questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedAnswer(null);
            } else {
                setIsFinished(true);
            }
        }, 1000);
    };

    if (!quizData) return <Loader2 className="animate-spin" />;

    if (isFinished) {
        return <QuizLeaderboard quizData={quizData} userScore={score} />;
    }

    const question = quizData.questions[currentQuestionIndex];

    return (
        <Card>
            <CardHeader>
                <Progress value={((currentQuestionIndex + 1) / quizData.questions.length) * 100} />
                <CardTitle className="pt-4">{question.text}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {question.options.map((opt: string, i: number) => (
                    <Button 
                        key={i} 
                        variant={selectedAnswer === opt ? (opt === question.correctAnswer ? 'default' : 'destructive') : 'outline'}
                        className="h-auto py-4 text-base"
                        onClick={() => handleAnswer(opt)}
                        disabled={!!selectedAnswer}
                    >
                        {opt}
                    </Button>
                ))}
            </CardContent>
        </Card>
    );
};

const QuizLeaderboard = ({ quizData, userScore }: { quizData: any, userScore: number }) => {
     // A real implementation would update scores in Firestore.
     // For now, we just display the final scores based on local calculation and participant list.
    return (
        <Card>
            <CardHeader className="text-center">
                 <Trophy className="mx-auto h-12 w-12 text-yellow-400" />
                <CardTitle>Quiz Finished!</CardTitle>
                <CardDescription>You scored {userScore} points.</CardDescription>
            </CardHeader>
            <CardContent>
                 <h3 className="font-bold text-center mb-4">Leaderboard</h3>
                 <div className="space-y-3">
                     {quizData.participants
                        .sort((a: any, b: any) => b.score - a.score) // Scores aren't updated, so this is for show
                        .map((p: any, i: number) => (
                        <div key={p.uid} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <div className="flex items-center gap-3">
                                <span className="font-bold w-6">{i + 1}.</span>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={p.photoURL} />
                                    <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{p.name}</span>
                            </div>
                            <span className="font-bold">{p.uid === 'user-uid-placeholder' ? userScore : p.score} pts</span>
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
                <Swords className="mx-auto h-12 w-12 text-primary" />
                <h1 className="text-4xl font-bold font-headline mt-4">Battle Quiz</h1>
                <p className="text-muted-foreground mt-2">Challenge other students and climb the leaderboard!</p>
            </div>
            <QuizLobby />
        </div>
    );
}
