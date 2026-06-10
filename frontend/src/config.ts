// Paste your deployed contract address here after running deploy.py
export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as const

// Switch to 'testnet' to use Bradbury testnet
export const NETWORK: 'localnet' | 'testnet' = 'localnet'

export const NETWORKS = {
  localnet: 'http://localhost:4000',
  testnet:  'https://studio.genlayer.com:8443/api',
}
