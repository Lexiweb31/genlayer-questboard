// Paste your deployed contract address here after running deploy.py
export const CONTRACT_ADDRESS = '0x29bedaad055a3FdceE5a15cBE18A5b48A57e3A84' as const

// Switch to 'testnet' to use Bradbury testnet
export const NETWORK: 'localnet' | 'testnet' = 'testnet'

export const NETWORKS = {
  localnet: 'http://localhost:4000',
  testnet:  'https://studio.genlayer.com:8443/api',
}
