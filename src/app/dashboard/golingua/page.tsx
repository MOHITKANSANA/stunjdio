
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Languages, ArrowRight, BookOpen, ChevronRight } from "lucide-react";
import { useLanguage } from '@/hooks/use-language';
import { Progress } from '@/components/ui/progress';

const languages = [
    { value: "english", label: "English" },
    { value: "hindi", label: "Hindi" },
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" },
];

const lessonData: Record<string, { type: string, word?: string, phrase?: string, options: string[], answer: string, prompt: string }[]> = {
    english: Array.from({ length: 25 }, (_, i) => [
        { type: 'vocab', word: `Hello ${i+1}`, options: [`नमस्ते ${i+1}`, 'धन्यवाद', 'माफ़ कीजिए', 'अलविदा'], answer: `नमस्ते ${i+1}`, prompt: "Translate this word:" },
        { type: 'vocab', word: `Goodbye ${i+1}`, options: [`अलविदा ${i+1}`, 'नमस्ते', 'पानी', 'घर'], answer: `अलविदा ${i+1}`, prompt: "What does this mean?" },
        { type: 'vocab', word: `Thank you ${i+1}`, options: [`धन्यवाद ${i+1}`, 'नमस्ते', 'पानी', 'घर'], answer: `धन्यवाद ${i+1}`, prompt: "Translate this word:" },
        { type: 'vocab', word: `Water ${i+1}`, options: [`पानी ${i+1}`, 'घर', 'नमस्ते', 'अलविदा'], answer: `पानी ${i+1}`, prompt: "What does this mean?" },
    ]).flat(),
     hindi: Array.from({ length: 25 }, (_, i) => [
        { type: 'vocab', word: `नमस्ते ${i+1}`, options: [`Hello ${i+1}`, 'Thank you', 'Excuse me', 'Goodbye'], answer: `Hello ${i+1}`, prompt: "Translate this word:" },
        { type: 'vocab', word: `धन्यवाद ${i+1}`, options: [`Thank you ${i+1}`, 'Hello', 'Water', 'Home'], answer: `Thank you ${i+1}`, prompt: "What does this mean?" },
        { type: 'vocab', word: `पानी ${i+1}`, options: [`Water ${i+1}`, 'Home', 'Hello', 'Goodbye'], answer: `Water ${i+1}`, prompt: "Translate this word:" },
        { type: 'vocab', word: `घर ${i+1}`, options: [`Home ${i+1}`, 'Water', 'Thank you', 'Hello'], answer: `Home ${i+1}`, prompt: "What does this mean?" },
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
        if (!exercise || !selectedOption) return;
        
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
        if (!exercise || exercise.type !== 'vocab') {
             if (exercise && exercise.type !== 'vocab') {
                handleNext();
            }
            return null;
        }
        
        let exerciseContent = (
            <div className="space-y-4">
                <Card className="text-center p-8 text-3xl font-bold">{exercise.word}</Card>
                <div className="grid grid-cols-2 gap-2">
                    {exercise.options.map(option => {
                        const isSelected = selectedOption === option;
                        const isCorrectAnswer = option === exercise.answer;
                        let buttonVariant: "default" | "destructive" | "outline" | "secondary" = "outline";
                        if (isCorrect !== null) {
                            if(isCorrectAnswer) buttonVariant = "default";
                            else if(isSelected && !isCorrectAnswer) buttonVariant = "destructive";
                            else buttonVariant = "secondary";
                        } else if (isSelected) {
                            buttonVariant = "secondary";
                        }

                       return (
                           <Button
                             key={option}
                             variant={buttonVariant}
                             onClick={() => isCorrect === null && setSelectedOption(option)}
                             className={`h-auto py-3 text-base`}
                           >
                               {option}
                           </Button>
                       )
                   })}
                </div>
            </div>
        );

        return (
            <div>
                <Card className="flex flex-col justify-between min-h-[50vh]">
                    <div>
                        <CardHeader>
                            <Progress value={progress} className="mb-4" />
                            <CardTitle>{exercise.prompt}</CardTitle>
                        </CardHeader>
                        <CardContent>{exerciseContent}</CardContent>
                    </div>
                     <CardContent>
                        {isCorrect === null ? (
                            <Button className="w-full" onClick={handleCheckAnswer} disabled={!selectedOption}>Check</Button>
                        ) : (
                             <div className={`w-full p-4 text-white font-bold text-lg text-center rounded-lg ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                                <p>{isCorrect ? 'Correct!' : `Correct Answer: ${exercise.answer}`}</p>
                                <Button className="w-full mt-4" variant="secondary" onClick={handleNext}>Next <ChevronRight/></Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
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

    