"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getLearningPath } from "@/app/actions/learning-path"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Slider } from "@/components/ui/slider"
import { BrainCircuit, CheckCircle, Loader2 } from "lucide-react"

const assessmentSchema = z.object({
  Maths: z.number().min(0).max(100),
  GK: z.number().min(0).max(100),
  English: z.number().min(0).max(100),
  Science: z.number().min(0).max(100),
  Reasoning: z.number().min(0).max(100),
})

type AssessmentValues = z.infer<typeof assessmentSchema>

type Subject = keyof AssessmentValues;

const subjects: Subject[] = ["Maths", "GK", "English", "Science", "Reasoning"]

export default function AssessmentPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<string[] | null>(null)

  const form = useForm<AssessmentValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      Maths: 50,
      GK: 50,
      English: 50,
      Science: 50,
      Reasoning: 50,
    },
  })

  async function onSubmit(data: AssessmentValues) {
    setIsLoading(true)
    setResults(null)
    const result = await getLearningPath(data)
    setResults(result.suggestedLearningPaths)
    setIsLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Personalized Learning Assessment</h1>
        <p className="text-muted-foreground mt-2">
          Rate your confidence in each subject to generate a custom learning path.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Subject Assessment</CardTitle>
              <CardDescription>Drag the slider to indicate your score (0-100) for each subject.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {subjects.map((subject) => (
                <FormField
                  key={subject}
                  control={form.control}
                  name={subject}
                  render={({ field }) => (
                    <FormItem>
                       <div className="flex justify-between items-center mb-2">
                         <FormLabel>{subject}</FormLabel>
                         <span className="text-sm font-medium w-12 text-center text-primary">{field.value}</span>
                       </div>
                      <FormControl>
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate My Learning Path"
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
      {results && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Your Suggested Learning Path</CardTitle>
                <CardDescription>Based on your assessment, we recommend focusing on these courses.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {results.map((path, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-1 shrink-0" />
                  <span>{path}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
