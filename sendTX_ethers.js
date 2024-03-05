import { ethers } from 'ethers'
import fetch from 'node-fetch'
import qs from 'qs'
import dotenv from 'dotenv'

dotenv.config() // Load dotenv config

const walletKey = process.env.WALLET_KEY
const zeroExApiKey = process.env.ZEROEX_API_KEY
const infuraApp = process.env.INFURA_APP
const taker = process.env.TAKER_ADDRESS

// Setup provider and wallet
const provider = new ethers.InfuraProvider('mainnet', infuraApp)
const wallet = new ethers.Wallet(`0x${walletKey}`, provider)
const feeData = await provider.getFeeData()

// Define the swap parameters
const params = {
  sellToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
  buyToken: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  buyAmount: ethers.parseUnits('100', 6), // USDT has 6 decimals
  takerAddress: taker,
}

const headers = { '0x-api-key': zeroExApiKey || '' }

// Function to fetch a firm quote
async function fetchQuote(params, headers) {
  const response = await fetch(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`, { headers })
  if (!response.ok) {
    throw new Error(`Error fetching quote: ${response.statusText}`)
  }
  return response.json()
}

// Function to send the transaction
async function sendTransaction(quote) {
  const tx = {
    to: quote.to,
    data: quote.data,
    value: quote.value,
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
  }

  console.log('Sending transaction...')
  const transactionResponse = await wallet.sendTransaction(tx)
  await transactionResponse.wait()
  console.log(`Transaction successful with hash: ${transactionResponse.hash}`)
}

// Main function to execute the swap
async function main() {
  try {
    const quote = await fetchQuote(params, headers)
    console.log('Quote:', quote)
    await sendTransaction(quote)
  } catch (error) {
    console.error('Error during token swap:', error)
  }
}

main()
