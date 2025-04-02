"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, ExternalLink } from "lucide-react"
import QuizHeader from "@/components/quiz-header"
import QuizCard from "@/components/quiz-card"
import ResultsView from "@/components/results-view"
import LoadingView from "@/components/loading-view"
import { QUESTIONS } from "@/lib/questions"
import { personalityData, type PersonalityType } from "@/lib/personality-data"
import { usePersonalityContract } from "@/hooks/usePersonalityContract"
import { checkQuizResult } from "@/app/actions/get-results"

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(QUESTIONS.length).fill(null)
  )
  const [showResults, setShowResults] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [isRetrying, setIsRetrying] = useState(false)
  const [maxRetriesReached, setMaxRetriesReached] = useState(false)

  // Use the personality contract hook with destructuring spaced out for readability
  const {
    submitAnswers,
    isLoading,
    error,
    result,
    txHash,
    isPending,
    manualRetry,
    retryCount = 0 // Add retryCount from the hook with a default value
  } = usePersonalityContract()

  // Effect to update the UI when a result is received through polling
  useEffect(() => {
    if (result && isPending === false && txHash) {
      setShowResults(true)
      setMaxRetriesReached(false)
    }
  }, [result, isPending, txHash])

  // Effect to handle when we've hit max retries
  useEffect(() => {
    if (error && error.includes("taking longer than expected")) {
      setMaxRetriesReached(true)
    }
  }, [error])

  // Effect to show status messages during pending state
  useEffect(() => {
    if (isPending) {
      const messages = [
        "Computing your personality on the blockchain...",
        "Waiting for blockchain verification...",
        "Securely analyzing your answers...",
        "Almost there! Finalizing your results..."
      ]

      let index = 0
      setStatusMessage(messages[0])

      const interval = setInterval(() => {
        index = (index + 1) % messages.length
        setStatusMessage(messages[index])
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [isPending])

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setIsTransitioning(true)

    // Update answers array with the selected answer index (0-3)
    setAnswers(prev => {
      const newAnswers = [...prev]
      newAnswers[questionId] = answerIndex
      return newAnswers
    })

    // Delay to allow for animation
    setTimeout(() => {
      if (currentQuestion < QUESTIONS.length - 1) {
        setCurrentQuestion(prev => prev + 1)
        setIsTransitioning(false)
      } else {
        const answersArray = answers.map((ans, index) =>
          index === questionId ? answerIndex : ans === null ? 0 : ans
        )

        submitAnswers(answersArray).then(res => {
          if (res.success) {
            // Even if it's pending, we'll show loading state
            setShowResults(res.pending ? false : true)
          }
        })
      }
    }, 500)
  }

  const handleSkip = () => {
    setIsTransitioning(true)

    // If skipping, set the current question's answer to 0 (default)
    setAnswers(prev => {
      const newAnswers = [...prev]
      newAnswers[currentQuestion] = 0
      return newAnswers
    })

    setTimeout(() => {
      setCurrentQuestion(prev => prev + 1)
      setIsTransitioning(false)
    }, 500)
  }

  const resetQuiz = () => {
    setAnswers(Array(QUESTIONS.length).fill(null))
    setCurrentQuestion(0)
    setShowResults(false)
  }

  // Prepare result data for the ResultsView
  const getResultData = () => {
    if (!result) return null

    const personalityType = result as PersonalityType

    // Fallback in case the returned personality is not in our data
    if (!personalityData[personalityType]) {
      return {
        type: personalityType,
        data: {
          description: "Your unique crypto personality has been analyzed.",
          traits: ["Crypto Enthusiast"],
          image: "/placeholder.svg?height=200&width=200"
        },
        txHash: txHash || ""
      }
    }

    return {
      type: personalityType,
      data: personalityData[personalityType],
      txHash: txHash || ""
    }
  }

  // Function to manually retry getting the result
  const handleRetry = async () => {
    if (!txHash) return

    setIsRetrying(true)
    try {
      const result = await manualRetry()
      if (result?.success && !result.pending) {
        setShowResults(true)
      }
    } catch (error) {
      console.error("Failed to retry getting result:", error)
    } finally {
      setIsRetrying(false)
    }
  }

  // Render the error view with the transaction hash
  const renderErrorView = () => {
    return (
      <div className="w-full border-2 border-black dark:border-white p-8">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold text-black dark:text-white mb-6">
            Processing Taking Longer Than Expected
          </h2>

          <p className="text-neutral-600 dark:text-neutral-300 mb-8 max-w-lg">
            Your quiz answers are still being processed on the blockchain. This
            can sometimes take longer due to blockchain network conditions.
          </p>

          {txHash && (
            <div className="mb-8 flex flex-col items-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
                Your transaction on Partisia Blockchain
              </p>
              <a
                href={`https://browser.testnet.partisiablockchain.com/transactions/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-mono bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded hover:underline"
              >
                {txHash.substring(0, 6)}...{txHash.substring(txHash.length - 4)}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => {
                setMaxRetriesReached(false)
                handleRetry()
              }}
              className="flex items-center gap-2 px-6 py-3 border-2 border-black dark:border-white text-black dark:text-white font-medium"
            >
              Check Again
            </button>

            <button
              onClick={resetQuiz}
              className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black flex flex-col items-center">
      <QuizHeader />

      <div className="w-full max-w-3xl px-4 py-8 flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {!isLoading &&
          !isPending &&
          !isRetrying &&
          !showResults &&
          !maxRetriesReached ? (
            <motion.div
              key="question"
              className="w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <QuizCard
                question={QUESTIONS[currentQuestion]}
                onAnswer={handleAnswer}
                isTransitioning={isTransitioning}
                progress={(currentQuestion / QUESTIONS.length) * 100}
              />

              <div className="mt-8 flex justify-between items-center text-sm text-neutral-500 dark:text-neutral-400">
                <span>
                  Question {currentQuestion + 1} of {QUESTIONS.length}
                </span>
                {currentQuestion < QUESTIONS.length - 1 ? (
                  <button
                    onClick={handleSkip}
                    className="flex items-center text-black dark:text-white hover:underline"
                    disabled={isTransitioning}
                  >
                    Skip <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                ) : null}
              </div>

              {error && !maxRetriesReached && (
                <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
                  {error}
                </div>
              )}
            </motion.div>
          ) : isLoading || isPending || isRetrying ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <LoadingView
                customStatusText={
                  isRetrying
                    ? "Retrying to fetch your results..."
                    : isPending
                      ? statusMessage
                      : undefined
                }
                retryCount={retryCount}
                maxRetries={20}
              />
            </motion.div>
          ) : maxRetriesReached ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {renderErrorView()}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              {result && getResultData() && (
                <ResultsView
                  result={getResultData()!}
                  onReset={resetQuiz}
                  onRetry={handleRetry}
                  isPending={isPending}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
