import dotenv from 'dotenv'
import { createWalletClient, createPublicClient, http, parseUnits, parseGwei } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import qs from 'qs'

dotenv.config() // load dotenv config

const walletKey = process.env.WALLET_KEY
const zeroExApiKey = process.env.ZEROEX_API_KEY
const infuraApp = process.env.INFURA_APP
const taker = process.env.TAKER_ADDRESS

const account = privateKeyToAccount(`0x${walletKey}`)

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(`https://mainnet.infura.io/v3/${infuraApp}`),
})

const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas()

// Create a wallet client
const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http(`https://mainnet.infura.io/v3/${infuraApp}`),
})

/**
 * Buy 100 USDT with ETH
 */
const params = {
  sellToken: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH
  buyToken: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  buyAmount: parseUnits('50', 6), // USDT has 6 decimals
  takerAddress: taker,
}

const headers = { '0x-api-key': zeroExApiKey || '' }

// Fetch the swap quote.
const response = await fetch(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`, { headers })
const quote = await response.json()
console.log(' ************** Quote ************', quote)

// Prepare and send the transaction
try {
  const transactionRequest = await client.prepareTransactionRequest({
    account,
    to: quote.to,
    data: quote.data,
    value: quote.value,
    maxFeePerGas: maxFeePerGas,
    maxPriorityFeePerGas: maxPriorityFeePerGas,
  })

  // SCRIPT NEVER REACHES THIS POINT, VIEM THROWS ERROR BEFORE
  console.log('***************** Transaction request ***********', transactionRequest)

  // Send the transaction
  const hash = await client.sendTransaction(transactionRequest)

  console.log('Transaction successful:', hash)
} catch (error) {
  console.error('Transaction failed:', error)
}
