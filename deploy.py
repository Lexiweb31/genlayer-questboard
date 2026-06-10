"""
Deploy QuestBoard to GenLayer testnet (Bradbury) or localnet.

Usage:
    python deploy.py --network testnet
    python deploy.py --network localnet
"""
import argparse
from genlayer import Client

NETWORKS = {
    "localnet": "http://localhost:4000",
    "testnet":  "https://studio.genlayer.com:8443/api",  # Bradbury testnet
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--network", choices=NETWORKS.keys(), default="localnet")
    args = parser.parse_args()

    client = Client(endpoint=NETWORKS[args.network])
    print(f"Deploying QuestBoard to {args.network}...")

    with open("quest_board.py") as f:
        code = f.read()

    tx = client.deploy_contract(
        code=code,
        constructor_args=[],
    )

    print(f"Deploy tx: {tx}")
    receipt = client.wait_for_transaction(tx)
    print(f"Contract deployed at: {receipt['contract_address']}")
    return receipt["contract_address"]


if __name__ == "__main__":
    main()
