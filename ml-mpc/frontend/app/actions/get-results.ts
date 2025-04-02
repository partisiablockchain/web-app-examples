"use server"

import { addInputSample, SecretVarId } from "@/lib/ClassificationCodegen"
import { sendZkInput, getZkResult } from "@/lib/sendZkInputHelper"
import { BlockchainAddress } from "@partisiablockchain/abi-client"

const SENDER_ADDRESS = process.env.PARTI_WALLET_ADDRESS!

export async function submitQuizAnswers(answers: number[]) {
  console.log("Submitting quiz answers...")

  const senderAddr = BlockchainAddress.fromString(SENDER_ADDRESS)

  const modelId: SecretVarId = { rawId: 1 }
  const secretInputBuilder = addInputSample(modelId, senderAddr)

  const inputData = { values: answers }

  const result = await sendZkInput(secretInputBuilder, inputData)
  if (result.success && result.txHash) {
    return {
      success: true,
      personality: "", // Will be empty initially
      txHash: result.txHash,
      pending: true // Indicate this is a pending result
    }
  }

  return { success: false, personality: "", txHash: "", pending: false }
}

/**
 * This function checks the result of a previously submitted quiz answer
 * It's designed to be called separately after the initial submission
 */
export async function checkQuizResult(txHash: string) {
  console.log("Checking quiz result for transaction:", txHash)

  const result = await getZkResult(txHash)
  if (result.success && result.secretOutput) {
    const personality = convertOneHotToPersonality(result.secretOutput)
    console.log("Quiz result:", personality)
    return { success: true, personality, txHash, pending: false }
  }

  return {
    success: false,
    personality: "",
    txHash,
    pending: true, // Still pending if we couldn't get a result yet
    error: result.error
  }
}

/**
 * Converts a one-hot representation into a personality label.
 * It accepts an array of bits (e.g. [1,0,0,0,0,0,0,0])
 */
function convertOneHotToPersonality(oneHot: number[]): string {
  const personalityMapping = [
    "Degen",
    "NFT Enthusiast",
    "Influencer",
    "DeFi Expert",
    "Privacy Advocate",
    "Developer",
    "Trader",
    "HODLer"
  ]
  const index = oneHot.findIndex(bit => bit === 1)
  return index >= 0 ? personalityMapping[index] : "Degen"
}
