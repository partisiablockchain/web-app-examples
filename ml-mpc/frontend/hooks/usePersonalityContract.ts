import { useState, useEffect, useRef } from "react"
import { submitQuizAnswers, checkQuizResult } from "@/app/actions/get-results"

interface QuizResponse {
  success: boolean
  personality: string
  txHash: string
  pending?: boolean
  error?: string
}

export function usePersonalityContract() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null
  )
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 20 // About 2-3 minutes with exponential backoff

  // Track the backoff time
  const backoffTime = useRef(3000) // Start with 3 seconds
  const maxBackoffTime = 15000 // Max 15 seconds between retries

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // Function to poll for results with exponential backoff
  const pollForResults = async (txHash: string) => {
    try {
      console.log(
        `Polling for results: attempt ${retryCount + 1}, backoff ${backoffTime.current}ms`
      )
      const res = await checkQuizResult(txHash)

      // Increment retry count
      setRetryCount(prev => prev + 1)

      if (!res.pending && res.success) {
        // We have a final result!
        setResult(res.personality)
        setIsPending(false)
        setRetryCount(0)
        backoffTime.current = 3000 // Reset backoff time

        // Clear polling interval
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }

        return res
      } else if (res.error) {
        // Check if we're hitting max retries
        if (retryCount >= MAX_RETRIES) {
          setError(
            `Blockchain computation is taking longer than expected. ${res.error}`
          )
          setIsPending(false)
          backoffTime.current = 3000 // Reset backoff time

          // Clear polling interval
          if (pollingInterval) {
            clearInterval(pollingInterval)
            setPollingInterval(null)
          }
        } else {
          // Continue polling, it's normal for some variables to not be ready
          console.log(`Retry ${retryCount}/${MAX_RETRIES}: ${res.error}`)

          // Increase backoff time with some randomness to avoid thundering herd
          backoffTime.current = Math.min(
            backoffTime.current * 1.5 + Math.random() * 1000,
            maxBackoffTime
          )
        }

        return res
      }

      // Check if we've reached max retries
      if (retryCount >= MAX_RETRIES) {
        setError(
          "Blockchain computation is taking longer than expected. Please try checking the results later."
        )
        setIsPending(false)
        backoffTime.current = 3000 // Reset backoff time

        // Clear polling interval
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }

        return {
          success: false,
          personality: "",
          txHash: txHash,
          pending: false,
          error: "Max retries reached"
        }
      }

      // Increase backoff time with some randomness
      backoffTime.current = Math.min(
        backoffTime.current * 1.5 + Math.random() * 1000,
        maxBackoffTime
      )

      // Still pending, continue polling
      return null
    } catch (err: any) {
      console.error("Error polling for results:", err)

      // Only set error and stop polling if we've hit max retries
      if (retryCount >= MAX_RETRIES) {
        setError(err.message || "Failed to get quiz results")
        backoffTime.current = 3000 // Reset backoff time

        // Clear polling interval
        if (pollingInterval) {
          clearInterval(pollingInterval)
          setPollingInterval(null)
        }

        setIsPending(false)
      } else {
        // Increase backoff time after error
        backoffTime.current = Math.min(
          backoffTime.current * 2 + Math.random() * 1000,
          maxBackoffTime
        )
      }

      return { success: false, personality: "", txHash: "", pending: false }
    }
  }

  const submitAnswers = async (answers: number[]): Promise<QuizResponse> => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setTxHash(null)
    setIsPending(false)
    setRetryCount(0)
    backoffTime.current = 3000 // Reset backoff time
    console.log("Submitting answers...")

    try {
      // Submit the initial request
      const res = await submitQuizAnswers(answers)

      if (!res.success) {
        throw new Error("Failed to send answers")
      }

      // Set transaction hash immediately
      setTxHash(res.txHash)

      // If the result is pending, start polling
      if (res.pending) {
        setIsPending(true)

        // Add a 5-second initial delay before starting to poll
        // This gives the blockchain time to process the transaction
        console.log("Waiting 5 seconds before first poll...")
        setTimeout(async () => {
          // Try to get the results after the initial delay
          const immediateResult = await pollForResults(res.txHash)
          if (
            immediateResult &&
            !immediateResult.pending &&
            immediateResult.success
          ) {
            setIsLoading(false)
            return
          }

          // Set up polling with dynamic backoff
          const setupNextPoll = () => {
            const timeoutId = setTimeout(async () => {
              const result = await pollForResults(res.txHash)

              // If we're still pending and under max retries, set up the next poll
              if (!result || (result.pending && retryCount < MAX_RETRIES)) {
                setupNextPoll()
              }
            }, backoffTime.current)

            // Cast to any NodeJS.Timeout because setTimeout returns a different type in the browser
            setPollingInterval(timeoutId as any)
          }

          setupNextPoll()
        }, 5000)
      } else if (res.personality) {
        // If we already have a result, set it
        setResult(res.personality)
      }

      setIsLoading(false)
      return res
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to submit answers")
      setIsLoading(false)
      return { success: false, personality: "", txHash: "", pending: false }
    }
  }

  // Add a function to manually retry getting results
  const manualRetry = async () => {
    if (!txHash) {
      setError("No transaction hash to retry")
      return null
    }

    setIsLoading(true)
    setError(null)
    setRetryCount(0)
    backoffTime.current = 3000 // Reset backoff for manual retry

    try {
      console.log("Manual retry triggered for hash:", txHash)
      const result = await checkQuizResult(txHash)
      setIsLoading(false)

      if (result.success && !result.pending) {
        setResult(result.personality)
        return result
      } else if (result.error) {
        setError(result.error)
      } else {
        // If still pending, try setting up a new polling sequence
        setIsPending(true)

        // Set up polling with dynamic backoff
        const setupNextPoll = () => {
          const timeoutId = setTimeout(async () => {
            const pollResult = await pollForResults(txHash)

            // If we're still pending and under max retries, set up the next poll
            if (
              !pollResult ||
              (pollResult.pending && retryCount < MAX_RETRIES)
            ) {
              setupNextPoll()
            }
          }, backoffTime.current)

          // Cast to any NodeJS.Timeout because setTimeout returns a different type in the browser
          setPollingInterval(timeoutId as any)
        }

        setupNextPoll()
      }

      return result
    } catch (err: any) {
      console.error("Manual retry failed:", err)
      setError(err.message || "Failed to get quiz results")
      setIsLoading(false)
      return null
    }
  }

  return {
    submitAnswers,
    isLoading,
    error,
    result,
    txHash,
    isPending,
    manualRetry
  }
}
