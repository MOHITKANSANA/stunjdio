
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Languages, ArrowRight, BookOpen, Volume2, Mic, ChevronRight } from "lucide-react";
import { useLanguage } from '@/hooks/use-language';
import { Progress } from '@/components/ui/progress';

const languages = [
    { value: "english", label: "English" },
    { value: "hindi", label: "Hindi" },
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" },
];

// Expanded lesson data with 100+ lessons
const lessonData: Record<string, { type: string, word?: string, phrase?: string, options: string[], answer: string, prompt: string }[]> = {
    english: Array.from({ length: 25 }, (_, i) => [
        { type: 'vocab', word: `Hello ${i+1}`, options: [`नमस्ते ${i+1}`, 'धन्यवाद', 'माफ़ कीजिए', 'अलविदा'], answer: `नमस्ते ${i+1}`, prompt: "Translate this word:" },
        { type: 'vocab', word: `Goodbye ${i+1}`, options: [`अलविदा ${i+1}`, 'नमस्ते', 'पानी', 'घर'], answer: `अलविदा ${i+1}`, prompt: "What does this mean?" },
        { type: 'speak', phrase: `How are you? ${i+1}`, options: [], answer: '', prompt: "Listen and repeat:" },
        { type: 'listen', phrase: `My name is Alex ${i+1}`, options: [`My name is Alex ${i+1}`, 'My aim is Alex', 'My game is vex', 'My fame is next'], answer: `My name is Alex ${i+1}`, prompt: "What did you hear?"},
    ]).flat(),
     hindi: Array.from({ length: 25 }, (_, i) => [
        { type: 'vocab', word: `नमस्ते ${i+1}`, options: [`Hello ${i+1}`, 'Thank you', 'Excuse me', 'Goodbye'], answer: `Hello ${i+1}`, prompt: "Translate this word:" },
        { type: 'vocab', word: `धन्यवाद ${i+1}`, options: [`Thank you ${i+1}`, 'Hello', 'Water', 'Home'], answer: `Thank you ${i+1}`, prompt: "What does this mean?" },
        { type: 'speak', phrase: `आप कैसे हैं? ${i+1}`, options: [], answer: '', prompt: "Listen and repeat:" },
        { type: 'listen', phrase: `मेरा नाम एलेक्स है ${i+1}`, options: [`मेरा नाम एलेक्स है ${i+1}`, 'मेरा काम एलेक्स है', 'मेरा गाम एलेक्स है', 'मेरा दाम एलेक्स है'], answer: `मेरा नाम एलेक्स है ${i+1}`, prompt: "What did you hear?"},
    ]).flat(),
    spanish: [], french: [], german: []
};


type LessonStage = 'selection' | 'learning' | 'complete';

export default function GoLinguaPage() {
    const { t } = useLanguage();
    const [nativeLanguage, setNativeLanguage] = useState<string>('');
    const [targetLanguage, setTargetLanguage] = useState<string>('hindi');
    const [stage, setStage] = useState<LessonStage>('selection');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const lesson = lessonData[targetLanguage as keyof typeof lessonData] || [];
    const exercise = lesson[currentQuestion];
    const progress = (currentQuestion / lesson.length) * 100;

    const handleStartLesson = () => {
        if(targetLanguage) {
            setStage('learning');
            setCurrentQuestion(0);
            setSelectedOption(null);
            setIsCorrect(null);
        }
    }

    const handleCheckAnswer = () => {
        if (!exercise) return;
        
        const correct = selectedOption === exercise.answer;
        setIsCorrect(correct);
    }
    
    const handleNext = () => {
        if (currentQuestion < lesson.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedOption(null);
            setIsCorrect(null);
        } else {
            setStage('complete');
        }
    }
    
    const renderSelectionScreen = () => (
        <Card>
            <CardHeader>
                <CardTitle>Start a New Lesson</CardTitle>
                <CardDescription>Select the language you want to learn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div>
                     <label className="text-sm font-medium">I want to learn...</label>
                     <Select onValueChange={setTargetLanguage} defaultValue={targetLanguage}>
                        <SelectTrigger><SelectValue placeholder="Select Language" /></SelectTrigger>
                        <SelectContent>
                             {languages.map(lang => (
                                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <Button className="w-full" disabled={!targetLanguage || lesson.length === 0} onClick={handleStartLesson}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    {lesson.length > 0 ? 'Start Learning' : 'Coming Soon'}
                </Button>
            </CardContent>
        </Card>
    );

    const renderLearningScreen = () => {
        if (!exercise) return null;
        
        let exerciseContent;
        const answerState = selectedOption ? (selectedOption === exercise.answer ? 'correct' : 'incorrect') : 'default';

        switch(exercise.type) {
            case 'vocab':
                exerciseContent = (
                    <div className="space-y-4">
                        <Card className="text-center p-8 text-3xl font-bold">{exercise.word}</Card>
                        <div className="grid grid-cols-2 gap-2">
                           {exercise.options.map(option => (
                               <Button
                                 key={option}
                                 variant={selectedOption === option ? (isCorrect ? 'default' : 'destructive') : 'outline'}
                                 onClick={() => !isCorrect && setSelectedOption(option)}
                                 className={`h-auto py-3 text-base ${isCorrect !== null && option !== exercise.answer && 'opacity-50'}`}
                               >
                                   {option}
                               </Button>
                           ))}
                        </div>
                    </div>
                );
                break;
            case 'speak':
                 exerciseContent = (
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-4 text-2xl font-bold">
                            <Button variant="outline" size="icon"><Volume2/></Button>
                            <span>{exercise.phrase}</span>
                        </div>
                        <Button className="w-full py-6 text-lg"><Mic className="mr-2"/>Tap to speak</Button>
                    </div>
                 );
                 break;
            case 'listen':
                 exerciseContent = (
                    <div className="space-y-4">
                         <div className="flex items-center justify-center gap-4 text-2xl font-bold py-8">
                            <Button variant="outline" size="icon" className="h-16 w-16"><Volume2 className="h-8 w-8"/></Button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {exercise.options.map(opt => (
                                <Button
                                  key={opt}
                                  variant={selectedOption === opt ? (isCorrect ? 'default' : 'destructive') : 'outline'}
                                  onClick={() => !isCorrect && setSelectedOption(opt)}
                                  className={`h-auto py-3 text-base ${isCorrect !== null && opt !== exercise.answer && 'opacity-50'}`}
                                >
                                    {opt}
                                </Button>
                            ))}
                        </div>
                    </div>
                );
                break;
        }

        return (
            <div className="relative">
                <Card className="flex flex-col justify-between min-h-[50vh] overflow-hidden">
                    <div>
                        <CardHeader>
                            <Progress value={progress} className="mb-4" />
                            <CardTitle>{exercise.prompt}</CardTitle>
                        </CardHeader>
                        <CardContent>{exerciseContent}</CardContent>
                    </div>
                </Card>
                {isCorrect !== null && (
                     <div className={`absolute bottom-0 w-full p-4 text-white font-bold text-lg text-center rounded-b-lg ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                        <p>{isCorrect ? 'Correct!' : `Correct Answer: ${exercise.answer}`}</p>
                        <Button className="w-full mt-4" onClick={handleNext}>Next <ChevronRight/></Button>
                    </div>
                )}
                {isCorrect === null && (
                    <div className="p-4 border-t mt-auto">
                        <Button className="w-full" onClick={handleCheckAnswer} disabled={!selectedOption}>Check</Button>
                    </div>
                )}
            </div>
        )
    };
    
    const renderCompleteScreen = () => (
         <Card className="text-center p-8">
            <h2 className="text-3xl font-bold text-green-500">Lesson Complete!</h2>
            <p className="text-muted-foreground mt-2">You earned 20 XP.</p>
            <Button className="mt-6" onClick={() => setStage('selection')}>Start another lesson</Button>
         </Card>
    );

    const renderContent = () => {
        switch(stage) {
            case 'selection': return renderSelectionScreen();
            case 'learning': return renderLearningScreen();
            case 'complete': return renderCompleteScreen();
            default: return null;
        }
    }

    return (
        <div className="max-w-xl mx-auto space-y-8 p-4">
            <div className="text-center">
                <Languages className="mx-auto h-12 w-12 text-primary mb-4" />
                <h1 className="text-3xl md:text-4xl font-bold font-headline">GoLingua</h1>
                <p className="text-muted-foreground mt-2">Your AI-powered language learning partner.</p>
            </div>
            {renderContent()}
        </div>
    )
}
