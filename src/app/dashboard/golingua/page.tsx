
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

const lessonData = {
    english: [
        { type: 'vocab', word: 'Hello', translation: 'नमस्ते', prompt: "Translate this word:" },
        { type: 'vocab', word: 'Goodbye', translation: 'अलविदा', prompt: "What does this mean?" },
        { type: 'speak', phrase: 'How are you?', prompt: "Listen and repeat:" },
        { type: 'listen', phrase: 'My name is Alex', options: ['My name is Alex', 'My aim is Alex', 'My game is vex'], prompt: "What did you hear?"},
        { type: 'vocab', word: 'Thank you', translation: 'धन्यवाद', prompt: "Translate:" },
    ],
    hindi: [
        { type: 'vocab', word: 'नमस्ते', translation: 'Hello', prompt: "Translate this word:" },
        { type: 'vocab', word: 'धन्यवाद', translation: 'Thank you', prompt: "What does this mean?" },
        { type: 'speak', phrase: 'आप कैसे हैं?', prompt: "Listen and repeat:" },
        { type: 'listen', phrase: 'मेरा नाम एलेक्स है', options: ['मेरा नाम एलेक्स है', 'मेरा काम एलेक्स है', 'मेरा गाम एलेक्स है'], prompt: "What did you hear?"},
        { type 'vocab', word: 'माफ़ कीजिए', translation: 'Excuse me', prompt: "Translate:" },
    ],
    // Add other languages here...
    spanish: [], french: [], german: []
};

type LessonStage = 'selection' | 'learning' | 'complete';
type ExerciseType = 'vocab' | 'speak' | 'listen';

export default function GoLinguaPage() {
    const { t } = useLanguage();
    const [nativeLanguage, setNativeLanguage] = useState<string>('');
    const [targetLanguage, setTargetLanguage] = useState<string>('');
    const [stage, setStage] = useState<LessonStage>('selection');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const lesson = lessonData[targetLanguage as keyof typeof lessonData] || [];
    const exercise = lesson[currentQuestion];
    const progress = (currentQuestion / lesson.length) * 100;

    const handleStartLesson = () => {
        if(nativeLanguage && targetLanguage) {
            setStage('learning');
            setCurrentQuestion(0);
            setSelectedOption(null);
            setIsCorrect(null);
        }
    }

    const handleCheckAnswer = () => {
        if (!exercise) return;
        
        let correct;
        if (exercise.type === 'vocab') {
            correct = selectedOption === exercise.translation;
        } else if (exercise.type === 'listen') {
            correct = selectedOption === exercise.phrase;
        }
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
                <CardDescription>Select your native language and the language you want to learn.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <div className="md:col-span-1">
                        <label className="text-sm font-medium">I speak...</label>
                        <Select onValueChange={setNativeLanguage}>
                            <SelectTrigger><SelectValue placeholder="Select Language" /></SelectTrigger>
                            <SelectContent>
                                {languages.map(lang => (
                                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-center">
                        <ArrowRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="md:col-span-1">
                         <label className="text-sm font-medium">I want to learn...</label>
                         <Select onValueChange={setTargetLanguage}>
                            <SelectTrigger><SelectValue placeholder="Select Language" /></SelectTrigger>
                            <SelectContent>
                                 {languages.filter(l => l.value !== nativeLanguage).map(lang => (
                                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <Button className="w-full" disabled={!nativeLanguage || !targetLanguage || lesson.length === 0} onClick={handleStartLesson}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    {lesson.length > 0 ? 'Start Learning' : 'Coming Soon'}
                </Button>
            </CardContent>
        </Card>
    );

    const renderLearningScreen = () => {
        if (!exercise) return null;
        
        let exerciseContent;
        switch(exercise.type) {
            case 'vocab':
                exerciseContent = (
                    <div className="space-y-4">
                        <Card className="text-center p-8 text-3xl font-bold">{exercise.word}</Card>
                        <div className="grid grid-cols-2 gap-2">
                           <Button variant={selectedOption === exercise.translation ? 'default' : 'outline'} onClick={() => setSelectedOption(exercise.translation)}>{exercise.translation}</Button>
                           <Button variant={selectedOption === 'पानी' ? 'default' : 'outline'} onClick={() => setSelectedOption('पानी')}>पानी</Button>
                           <Button variant={selectedOption === 'घर' ? 'default' : 'outline'} onClick={() => setSelectedOption('घर')}>घर</Button>
                           <Button variant={selectedOption === 'किताब' ? 'default' : 'outline'} onClick={() => setSelectedOption('किताब')}>किताब</Button>
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
                        <Button className="w-full"><Mic className="mr-2"/>Tap to speak</Button>
                    </div>
                 );
                 break;
            case 'listen':
                 exerciseContent = (
                    <div className="space-y-4">
                         <div className="flex items-center justify-center gap-4 text-2xl font-bold">
                            <Button variant="outline" size="icon"><Volume2/></Button>
                        </div>
                        <div className="flex flex-col gap-2">
                            {exercise.options.map(opt => (
                                <Button key={opt} variant={selectedOption === opt ? 'default' : 'outline'} onClick={() => setSelectedOption(opt)}>{opt}</Button>
                            ))}
                        </div>
                    </div>
                );
                break;
        }

        return (
            <Card className="flex flex-col justify-between min-h-[50vh]">
                <div>
                    <CardHeader>
                        <Progress value={progress} className="mb-4" />
                        <CardTitle>{exercise.prompt}</CardTitle>
                    </CardHeader>
                    <CardContent>{exerciseContent}</CardContent>
                </div>
                {isCorrect !== null && (
                     <div className={`p-4 text-white font-bold text-center ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                        {isCorrect ? 'Correct!' : 'Incorrect.'}
                    </div>
                )}
                <div className="p-4 border-t">
                    {isCorrect === null ? (
                        <Button className="w-full" onClick={handleCheckAnswer}>Check</Button>
                    ) : (
                         <Button className="w-full" onClick={handleNext}>Next <ChevronRight/></Button>
                    )}
                </div>
            </Card>
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
