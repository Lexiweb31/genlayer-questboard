"""
Example: full quest lifecycle from create → submit → evaluate → withdraw.

Replace CONTRACT_ADDRESS, CREATOR_KEY, ADVENTURER_KEY with real values.
"""
from genlayer import Client, Address

CONTRACT_ADDRESS = "0x..."   # from deploy.py output
CREATOR_KEY      = "0x..."   # private key of quest creator
ADVENTURER_KEY   = "0x..."   # private key of adventurer

client = Client(endpoint="http://localhost:4000")


# ── Step 1: Creator posts a quest ────────────────────────────────────────────
print("Creating quest...")
tx = client.call_contract(
    contract_address=CONTRACT_ADDRESS,
    function="create_quest",
    args=[
        "Write a Haiku about Blockchain",
        "Compose an original haiku that creatively captures the essence of blockchain technology.",
        (
            "Must be exactly 3 lines. "
            "Must follow 5-7-5 syllable structure. "
            "Must clearly reference blockchain, crypto, or decentralization. "
            "Must be original — not a known poem."
        ),
    ],
    value=1_000_000_000_000_000_000,  # 1 GEN (in wei)
    private_key=CREATOR_KEY,
)
receipt = client.wait_for_transaction(tx)
quest_id = receipt["result"]
print(f"Quest created! ID: {quest_id}")


# ── Step 2: Read the quest ───────────────────────────────────────────────────
quest = client.read_contract(
    contract_address=CONTRACT_ADDRESS,
    function="get_quest",
    args=[quest_id],
)
print(f"\nQuest: {quest['title']}")
print(f"Requirements: {quest['requirements']}")
print(f"Reward: {quest['reward']} wei")


# ── Step 3: Adventurer submits proof ─────────────────────────────────────────
print("\nSubmitting proof...")
tx = client.call_contract(
    contract_address=CONTRACT_ADDRESS,
    function="submit_proof",
    args=[
        quest_id,
        (
            "Blocks form a chain (5)\n"
            "Each hash links to what came before (9) — wait, let me recount:\n\n"
            "Blocks chain the future (5)\n"
            "Trustless code writes the new law (7)\n"
            "No king holds the key (5)"
        ),
    ],
    private_key=ADVENTURER_KEY,
)
receipt = client.wait_for_transaction(tx)
submission_id = receipt["result"]
print(f"Submitted! Submission ID: {submission_id}")


# ── Step 4: Trigger AI evaluation ────────────────────────────────────────────
print("\nEvaluating submission (AI validators voting)...")
tx = client.call_contract(
    contract_address=CONTRACT_ADDRESS,
    function="evaluate_submission",
    args=[quest_id, submission_id],
    private_key=CREATOR_KEY,  # anyone can trigger evaluation
)
receipt = client.wait_for_transaction(tx)
approved = receipt["result"]
print(f"Evaluation complete. Approved: {approved}")


# ── Step 5: Check results ────────────────────────────────────────────────────
quest = client.read_contract(CONTRACT_ADDRESS, "get_quest", args=[quest_id])
sub   = client.read_contract(CONTRACT_ADDRESS, "get_submission", args=[quest_id, submission_id])

print(f"\nQuest completed: {quest['completed']}")
print(f"Winner: {quest['winner']}")
print(f"AI reason: {sub['reason']}")


# ── Step 6: Winner withdraws reward ─────────────────────────────────────────
if approved:
    adventurer_addr = client.get_address(ADVENTURER_KEY)
    claimable = client.read_contract(CONTRACT_ADDRESS, "get_claimable", args=[str(adventurer_addr)])
    print(f"\nClaimable balance: {claimable} wei")

    tx = client.call_contract(
        contract_address=CONTRACT_ADDRESS,
        function="withdraw",
        args=[],
        private_key=ADVENTURER_KEY,
    )
    client.wait_for_transaction(tx)
    print("Reward withdrawn!")
