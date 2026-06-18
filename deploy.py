"""
Deploy QuestBoard to GenLayer Bradbury testnet.

Usage:
    python deploy.py --private-key 0xYOUR_PRIVATE_KEY
"""
import argparse
import sys
import time
import requests
from genlayer_py import create_client, testnet_bradbury
from eth_account import Account

RPC_URL = "https://rpc-bradbury.genlayer.com"

def get_tx_raw(tx_hash: str) -> dict:
    resp = requests.post(RPC_URL, json={
        "jsonrpc": "2.0", "id": 1,
        "method": "eth_getTransactionByHash",
        "params": [tx_hash],
    }, timeout=30)
    return resp.json().get("result", {}) or {}

def poll_contract_address(tx_hash: str, retries: int = 120, interval: int = 5) -> str | None:
    print("Polling for contract address…")
    for _ in range(retries):
        try:
            data = get_tx_raw(tx_hash)
            addr = data.get("contract_address") or data.get("to") or data.get("recipient")
            # GenLayer deploy txs put the new contract in "to" once finalised
            if addr and addr != "0x0000000000000000000000000000000000000000":
                return addr
        except Exception as e:
            print(f"  poll error: {e}")
        time.sleep(interval)
    return None

def main():
    parser = argparse.ArgumentParser(description="Deploy QuestBoard contract")
    parser.add_argument("--private-key", required=True, help="Your wallet private key (0x...)")
    args = parser.parse_args()

    private_key = args.private_key.strip()
    if not private_key.startswith("0x"):
        private_key = "0x" + private_key

    account = Account.from_key(private_key)
    print(f"Deploying from address: {account.address}")
    print(f"Network: Bradbury testnet")

    client = create_client(testnet_bradbury)

    with open("quest_board.py") as f:
        code = f.read()

    print("\nSending deploy transaction...")
    tx_hash = client.deploy_contract(code=code, account=account, args=[])
    print(f"Tx hash: {tx_hash}")

    print("Waiting for validators to reach consensus (this can take 1-3 minutes)...")
    try:
        receipt = client.wait_for_transaction_receipt(tx_hash, retries=100, interval=5000)
        contract_address = receipt.get("contract_address") or receipt.get("recipient") or receipt.get("to")
    except KeyError as e:
        print(f"Library decode error (status code {e} unknown) — falling back to raw RPC poll…")
        contract_address = poll_contract_address(tx_hash)

    if not contract_address:
        print(f"\nCould not determine contract address. Tx hash: {tx_hash}")
        print("Check GenLayer Studio for the contract address.")
        sys.exit(1)

    print(f"\n✓ Contract deployed at: {contract_address}")
    print(f"\nNow update frontend/src/config.ts:")
    print(f"  export const CONTRACT_ADDRESS = '{contract_address}' as const")

if __name__ == "__main__":
    main()
