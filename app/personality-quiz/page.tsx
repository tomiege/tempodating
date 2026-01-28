"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CheckCircle2, Heart, ArrowRight, ArrowLeft, LogIn } from "lucide-react"
import Link from "next/link"

interface QuizQuestion {
  id: string
  question: string
  type: "radio" | "text" | "checkbox"
  options?: { value: string; label: string }[]
  allowOther?: boolean
}

const quizQuestions: QuizQuestion[] = [
  {
    id: "goal",
    question: "What are you looking for?",
    type: "radio",
    options: [
      { value: "long", label: "Something long term" },
      { value: "long_open", label: "Something long term, open to short term" },
      { value: "short_open", label: "Something short term, open to long term" },
      { value: "short", label: "Something short term" },
      { value: "unsure", label: "Not sure yet" },
    ],
  },
  {
    id: "job",
    question: "What is your occupation?",
    type: "text",
  },
  {
    id: "religion",
    question: "Are you religious?",
    type: "radio",
    options: [
      { value: "very", label: "Very religious" },
      { value: "some", label: "Somewhat religious" },
      { value: "spiritual", label: "Spiritual but not religious" },
      { value: "no", label: "Not religious" },
      { value: "skip", label: "Prefer not to say" },
    ],
  },
  {
    id: "langs",
    question: "What languages do you speak?",
    type: "checkbox",
    options: [
      { value: "en", label: "English" },
      { value: "es", label: "Spanish" },
      { value: "fr", label: "French" },
      { value: "de", label: "German" },
      { value: "zh", label: "Mandarin" },
      { value: "hi", label: "Hindi" },
      { value: "ar", label: "Arabic" },
      { value: "pt", label: "Portuguese" },
    ],
    allowOther: true,
  },
  {
    id: "drink",
    question: "How often do you drink alcohol?",
    type: "radio",
    options: [
      { value: "never", label: "Never" },
      { value: "rare", label: "Rarely" },
      { value: "social", label: "Socially" },
      { value: "often", label: "Regularly" },
      { value: "skip", label: "Prefer not to say" },
    ],
  },
  {
    id: "smoke",
    question: "Do you smoke?",
    type: "radio",
    options: [
      { value: "never", label: "Never" },
      { value: "rare", label: "Occasionally" },
      { value: "often", label: "Regularly" },
      { value: "quit", label: "Trying to quit" },
      { value: "skip", label: "Prefer not to say" },
    ],
  },
  {
    id: "fitness",
    question: "How often do you exercise?",
    type: "radio",
    options: [
      { value: "daily", label: "Daily" },
      { value: "often", label: "A few times a week" },
      { value: "weekly", label: "Once a week" },
      { value: "rare", label: "Rarely" },
      { value: "never", label: "Never" },
    ],
  },
  {
    id: "kids",
    question: "Do you want children?",
    type: "radio",
    options: [
      { value: "want", label: "Yes, I want children" },
      { value: "have_more", label: "I have children and want more" },
      { value: "have_done", label: "I have children but don't want more" },
      { value: "no", label: "No, I don't want children" },
      { value: "unsure", label: "Not sure yet" },
      { value: "skip", label: "Prefer not to say" },
    ],
  },
  {
    id: "edu",
    question: "What is your highest level of education?",
    type: "radio",
    options: [
      { value: "hs", label: "High school" },
      { value: "some_col", label: "Some college" },
      { value: "ba", label: "Bachelor's degree" },
      { value: "ma", label: "Master's degree" },
      { value: "phd", label: "Doctorate" },
      { value: "trade", label: "Trade/Technical school" },
      { value: "skip", label: "Prefer not to say" },
    ],
  },
  {
    id: "hobbies",
    question: "What are your main interests? (Select all that apply)",
    type: "checkbox",
    options: [
      { value: "travel", label: "Travel" },
      { value: "music", label: "Music" },
      { value: "sports", label: "Sports" },
      { value: "books", label: "Reading" },
      { value: "cook", label: "Cooking" },
      { value: "film", label: "Movies/TV Shows" },
      { value: "games", label: "Gaming" },
      { value: "art", label: "Art" },
      { value: "gym", label: "Fitness" },
      { value: "nature", label: "Nature/Outdoors" },
    ],
    allowOther: true,
  },
]

export default function PersonalityQuizPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [hasCompleted, setHasCompleted] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [otherInputs, setOtherInputs] = useState<Record<string, string>>({})
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    checkAuthAndQuizStatus()
  }, [])

  const checkAuthAndQuizStatus = async () => {
    try {
      const response = await fetch("/api/personality-quiz")
      
      if (response.status === 401) {
        setIsAuthenticated(false)
        setLoading(false)
        return
      }

      setIsAuthenticated(true)
      const data = await response.json()
      setHasCompleted(data.completed)
    } catch (error) {
      console.error("Error checking quiz status:", error)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleRadioChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleCheckboxChange = (questionId: string, value: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = (prev[questionId] as string[]) || []
      if (checked) {
        return { ...prev, [questionId]: [...current, value] }
      } else {
        return { ...prev, [questionId]: current.filter((v) => v !== value) }
      }
    })
  }

  const handleOtherInputChange = (questionId: string, value: string) => {
    setOtherInputs((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1)
    }
  }

  const isCurrentQuestionAnswered = () => {
    const question = quizQuestions[currentQuestion]
    const answer = answers[question.id]
    
    if (question.type === "checkbox") {
      return Array.isArray(answer) && answer.length > 0
    }
    
    return !!answer && (typeof answer === "string" ? answer.trim() !== "" : true)
  }

  const handleSubmit = async () => {
    setSaving(true)

    try {
      // Combine answers with "other" inputs
      const finalAnswers = { ...answers }
      
      for (const [questionId, otherValue] of Object.entries(otherInputs)) {
        if (otherValue.trim()) {
          const currentAnswer = finalAnswers[questionId]
          if (Array.isArray(currentAnswer)) {
            finalAnswers[questionId] = [...currentAnswer, `other: ${otherValue}`]
          }
        }
      }

      const response = await fetch("/api/personality-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizResult: finalAnswers }),
      })

      if (response.ok) {
        toast({
          title: "Quiz Completed!",
          description: "Your personality quiz has been saved successfully.",
        })
        setHasCompleted(true)
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to save quiz")
      }
    } catch (error) {
      console.error("Error saving quiz:", error)
      toast({
        title: "Error",
        description: "Failed to save your quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Login Required</CardTitle>
            <CardDescription>
              Please log in to complete your personality quiz and unlock better matches!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full" size="lg">
              <Link href="/login?redirect=/personality-quiz">
                <LogIn className="mr-2 h-4 w-4" />
                Log In to Continue
              </Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register?redirect=/personality-quiz" className="text-primary hover:underline">
                Register here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Quiz completed state
  if (hasCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-900/20 rounded-full w-fit">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">You have completed the personality quiz!</CardTitle>
            <CardDescription className="text-lg mt-2">
              <Heart className="inline h-5 w-5 text-pink-500 mr-1" />
              Enjoy your Speed Dating event!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full" size="lg">
              <Link href="/dashboard">
                Return to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/product">
                Browse Events
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Quiz form
  const question = quizQuestions[currentQuestion]
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-xl">Personality Quiz</CardTitle>
              <span className="text-sm text-muted-foreground">
                {currentQuestion + 1} of {quizQuestions.length}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-lg font-medium">{question.question}</Label>

              {question.type === "radio" && question.options && (
                <RadioGroup
                  value={(answers[question.id] as string) || ""}
                  onValueChange={(value) => handleRadioChange(question.id, value)}
                  className="space-y-3"
                >
                  {question.options.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                      <Label
                        htmlFor={`${question.id}-${option.value}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {question.type === "text" && (
                <Input
                  value={(answers[question.id] as string) || ""}
                  onChange={(e) => handleTextChange(question.id, e.target.value)}
                  placeholder="Enter your answer..."
                  className="text-lg py-6"
                />
              )}

              {question.type === "checkbox" && question.options && (
                <div className="space-y-3">
                  {question.options.map((option) => {
                    const currentAnswers = (answers[question.id] as string[]) || []
                    return (
                      <div
                        key={option.value}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <Checkbox
                          id={`${question.id}-${option.value}`}
                          checked={currentAnswers.includes(option.value)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(question.id, option.value, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`${question.id}-${option.value}`}
                          className="flex-1 cursor-pointer"
                        >
                          {option.label}
                        </Label>
                      </div>
                    )
                  })}
                  {question.allowOther && (
                    <div className="pt-2">
                      <Input
                        value={otherInputs[question.id] || ""}
                        onChange={(e) => handleOtherInputChange(question.id, e.target.value)}
                        placeholder="Other (please specify)..."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentQuestion < quizQuestions.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!isCurrentQuestionAnswered()}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isCurrentQuestionAnswered() || saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Complete Quiz
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
