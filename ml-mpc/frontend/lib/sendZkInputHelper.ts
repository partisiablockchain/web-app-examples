"use server"

import {
  Client,
  ZkRpcBuilder,
  RealZkClient
} from "@partisiablockchain/zk-client"
import { BlockchainAddress } from "@partisiablockchain/abi-client"
import {
  BlockchainTransactionClient,
  SenderAuthenticationKeyPair
} from "@partisiablockchain/blockchain-api-transaction-client"

const TESTNET_URL = "https://node1.testnet.partisiablockchain.com"
const CONTRACT_ADDRESS = process.env.PARTI_CONTRACT_ADDRESS!
const SENDER_ADDRESS = process.env.PARTI_WALLET_ADDRESS!

export async function sendZkInput(
  secretInputBuilder: any,
  inputData: any,
  fee: number = 18770
): Promise<{
  success: boolean
  txHash?: string
  secretOutput?: any
  error?: string
}> {
  try {
    // Initialize the zk client and transaction client.
    const zkClient = new Client(TESTNET_URL)
    const authentication = SenderAuthenticationKeyPair.fromString(
      process.env.PARTI_PRIVATE_KEY!
    )
    const transactionClient = BlockchainTransactionClient.create(
      TESTNET_URL,
      authentication
    )

    const contractAddr = BlockchainAddress.fromString(CONTRACT_ADDRESS)
    const senderAddr = BlockchainAddress.fromString(SENDER_ADDRESS)

    const builtSecret = secretInputBuilder.secretInput(inputData)
    const publicRpc = builtSecret.publicRpc
    const secretBits = builtSecret.secretInput

    // Create the off-chain payload (public RPC and blinded secret shares)
    const payload = ZkRpcBuilder.zkInputOffChain(secretBits, publicRpc)

    // Sign and send the public transaction.
    const tx = await transactionClient.signAndSend(
      {
        address: contractAddr.asString(),
        rpc: payload.rpc
      },
      fee
    )
    const txIdentifier = tx.transactionPointer.identifier
    console.log("Sent input in transaction:", txIdentifier.toString())

    // Create a RealZkClient to send off-chain secret shares.
    const realClient = RealZkClient.create(contractAddr.asString(), zkClient)
    await realClient.sendOffChainInputToNodes(
      contractAddr.asString(),
      senderAddr.asString(),
      txIdentifier,
      payload.blindedShares
    )
    console.log("Sent off-chain input to nodes...")

    // Instead of waiting for events, just return the transaction ID
    // This prevents the serverless function from timing out
    return {
      success: true,
      txHash: txIdentifier.toString(),
      // We'll fetch the result in a separate call
      secretOutput: null
    }
  } catch (error) {
    console.error("sendZkInput failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}

// This function checks the result of a transaction
export async function getZkResult(txIdentifier: string): Promise<{
  success: boolean
  secretOutput?: any
  error?: string
}> {
  try {
    const zkClient = new Client(TESTNET_URL)
    const contractAddr = BlockchainAddress.fromString(CONTRACT_ADDRESS)

    // Get the contract state to find the final variable
    const contractState = await zkClient.getContractState(
      contractAddr.asString()
    )
    if (!contractState || !contractState.serializedContract) {
      throw new Error("Failed to get contract state")
    }

    const variables = contractState.serializedContract.variables || []
    if (variables.length === 0) {
      throw new Error("No variables found in contract state")
    }

    console.log(
      `Looking for variable with transaction: ${txIdentifier}. Found ${variables.length} variables.`
    )

    // Log all variables to help with debugging
    variables.forEach((v, idx) => {
      console.log(
        `Variable ${idx + 1}/${variables.length}:`,
        `Key: ${v.key}`,
        `Transaction: ${v.value?.transaction || "none"}`,
        `Has maskedInputShare: ${!!v.value?.maskedInputShare}`
      )
    })

    // First try to find a variable specifically for this transaction
    let finalVar: any = null

    // First, look for the transaction-specific variable with maskedInputShare
    for (const v of variables) {
      if (
        v.value &&
        v.value.transaction === txIdentifier &&
        v.value.maskedInputShare &&
        v.value.maskedInputShare.data
      ) {
        finalVar = v
        console.log(
          "Found exact match variable with transaction and maskedInputShare"
        )
        break
      }
    }

    // If not found, look for ANY variable with this transaction ID
    if (!finalVar) {
      for (const v of variables) {
        if (v.value && v.value.transaction === txIdentifier) {
          finalVar = v
          console.log(
            "Found variable with matching transaction ID but no maskedInputShare yet"
          )
          break
        }
      }
    }

    // If still not found, use the most recent variable with maskedInputShare
    if (!finalVar) {
      for (const v of variables) {
        if (
          v.value &&
          v.value.maskedInputShare &&
          v.value.maskedInputShare.data
        ) {
          // If we don't have a finalVar yet, or if this one has a higher key
          if (!finalVar || v.key > finalVar.key) {
            finalVar = v
          }
        }
      }

      if (finalVar) {
        console.log(
          "Found most recent variable with maskedInputShare but different transaction"
        )
      }
    }

    // If still not found, just use the last variable
    if (!finalVar && variables.length > 0) {
      finalVar = variables[variables.length - 1]
      console.log("Falling back to last variable in the list")
    }

    console.log("Selected final variable:", finalVar)

    if (!finalVar) {
      throw new Error("Final variable not found")
    }

    // If the variable doesn't have transaction info, it's likely not ready yet
    if (!finalVar.value?.transaction) {
      console.log(
        "Selected variable doesn't have transaction information yet, likely still processing"
      )
      return {
        success: false,
        error: "Transaction still processing, please wait",
        secretOutput: []
      }
    }

    // Try to extract the one-hot vector from the final variable
    try {
      // Extract the one-hot vector safely
      let oneHot: number[] = []

      if (
        finalVar.value &&
        finalVar.value.maskedInputShare &&
        finalVar.value.maskedInputShare.data
      ) {
        // Get the base64 string from the variable.
        const base64Data = finalVar.value.maskedInputShare.data

        // Decode the base64 string into a Buffer.
        const dataBytes = Buffer.from(base64Data, "base64")

        // Extract the final 8 bytes which represent the one-hot vector.
        const oneHotBuffer = dataBytes.slice(32, 40) // Use explicit numbers instead of arithmetic

        // Map each byte to 1 if it is exactly 1, else 0.
        oneHot = Array.from(oneHotBuffer).map(b => (b === 1 ? 1 : 0))
        console.log("Extracted final one-hot vector:", oneHot)
      } else {
        console.log(
          "Variable does not contain maskedInputShare.data - result may not be ready yet"
        )
        return {
          success: false,
          error: "Result not ready yet, try again in a few seconds",
          secretOutput: []
        }
      }

      // Only return success if we actually got a valid one-hot vector
      if (oneHot && oneHot.length === 8 && oneHot.some(bit => bit === 1)) {
        console.log("One hot vector:", oneHot)
        return { success: true, secretOutput: oneHot }
      } else {
        return {
          success: false,
          error: "Result appears invalid. Try again in a few moments.",
          secretOutput: []
        }
      }
    } catch (extError) {
      console.error("Error extracting one-hot vector:", extError)
      return {
        success: false,
        error:
          "Error processing results: " +
          (extError instanceof Error ? extError.message : "Unknown error"),
        secretOutput: []
      }
    }
  } catch (error) {
    console.error("getZkResult failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }
  }
}
