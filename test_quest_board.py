"""
Tests for QuestBoard intelligent contract.

Run with:
    genlayer test test_quest_board.py
or via GenLayer Studio.

Uses glsim (GenLayer's direct simulation mode) — no network needed.
"""
import pytest
from genlayer.testing import MessageContext, ContractRunner

# ── Fake addresses ───────────────────────────────────────────────────────────
CREATOR    = "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
ADVENTURER = "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"
THIRD      = "0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC"

REWARD = 1_000_000  # 1 GEN in wei


# ── Helpers ──────────────────────────────────────────────────────────────────
def deploy(runner: ContractRunner) -> object:
    return runner.deploy("quest_board.py", "QuestBoard", sender=CREATOR)


# ── Basic state tests (no LLM) ────────────────────────────────────────────────

def test_create_quest(runner):
    contract = deploy(runner)
    quest_id = runner.call(
        contract, "create_quest",
        sender=CREATOR, value=REWARD,
        args=["Slay the Dragon", "Kill the dragon in the Eastern Keep", "Provide screenshot or video of the dragon's defeat"],
    )
    assert quest_id == 0
    assert runner.call(contract, "get_quest_count") == 1

    quest = runner.call(contract, "get_quest", args=[0])
    assert quest["title"] == "Slay the Dragon"
    assert quest["reward"] == REWARD
    assert quest["active"] is True
    assert quest["completed"] is False


def test_create_quest_no_reward_fails(runner):
    contract = deploy(runner)
    with pytest.raises(Exception, match="Must attach GEN"):
        runner.call(
            contract, "create_quest",
            sender=CREATOR, value=0,
            args=["Empty Bounty", "desc", "req"],
        )


def test_create_quest_empty_title_fails(runner):
    contract = deploy(runner)
    with pytest.raises(Exception, match="Title cannot be empty"):
        runner.call(
            contract, "create_quest",
            sender=CREATOR, value=REWARD,
            args=["   ", "desc", "req"],
        )


def test_submit_proof(runner):
    contract = deploy(runner)
    runner.call(contract, "create_quest", sender=CREATOR, value=REWARD,
                args=["Quest 1", "desc", "req"])

    sub_id = runner.call(contract, "submit_proof", sender=ADVENTURER,
                         args=[0, "I completed it! Here is my proof: ..."])
    assert sub_id == 0

    subs = runner.call(contract, "get_submissions", args=[0])
    assert len(subs) == 1
    assert subs[0]["submitter"] == ADVENTURER
    assert subs[0]["evaluated"] is False


def test_creator_cannot_submit_own_quest(runner):
    contract = deploy(runner)
    runner.call(contract, "create_quest", sender=CREATOR, value=REWARD,
                args=["Quest", "desc", "req"])
    with pytest.raises(Exception, match="creator cannot submit"):
        runner.call(contract, "submit_proof", sender=CREATOR, args=[0, "proof"])


def test_cancel_quest_refunds_creator(runner):
    contract = deploy(runner)
    runner.call(contract, "create_quest", sender=CREATOR, value=REWARD,
                args=["Quest", "desc", "req"])

    runner.call(contract, "cancel_quest", sender=CREATOR, args=[0])

    quest = runner.call(contract, "get_quest", args=[0])
    assert quest["active"] is False

    claimable = runner.call(contract, "get_claimable", args=[CREATOR])
    assert claimable == REWARD


def test_cancel_by_non_creator_fails(runner):
    contract = deploy(runner)
    runner.call(contract, "create_quest", sender=CREATOR, value=REWARD,
                args=["Quest", "desc", "req"])
    with pytest.raises(Exception, match="Only the quest creator"):
        runner.call(contract, "cancel_quest", sender=ADVENTURER, args=[0])


def test_submit_to_inactive_quest_fails(runner):
    contract = deploy(runner)
    runner.call(contract, "create_quest", sender=CREATOR, value=REWARD,
                args=["Quest", "desc", "req"])
    runner.call(contract, "cancel_quest", sender=CREATOR, args=[0])
    with pytest.raises(Exception, match="no longer active"):
        runner.call(contract, "submit_proof", sender=ADVENTURER, args=[0, "proof"])


def test_multiple_quests(runner):
    contract = deploy(runner)
    for i in range(3):
        runner.call(contract, "create_quest", sender=CREATOR, value=REWARD,
                    args=[f"Quest {i}", "desc", "req"])

    assert runner.call(contract, "get_quest_count") == 3
    active = runner.call(contract, "get_active_quests")
    assert len(active) == 3


def test_multiple_submissions_same_quest(runner):
    contract = deploy(runner)
    runner.call(contract, "create_quest", sender=CREATOR, value=REWARD,
                args=["Quest", "desc", "req"])

    runner.call(contract, "submit_proof", sender=ADVENTURER, args=[0, "proof A"])
    runner.call(contract, "submit_proof", sender=THIRD, args=[0, "proof B"])

    subs = runner.call(contract, "get_submissions", args=[0])
    assert len(subs) == 2


# ── LLM evaluation tests ──────────────────────────────────────────────────────
# These use GenLayer's simulation mode which mocks LLM calls.

def test_evaluate_approval_pays_winner(runner):
    contract = deploy(runner)
    runner.call(contract, "create_quest", sender=CREATOR, value=REWARD,
                args=[
                    "Write a Haiku",
                    "Write an original haiku about the ocean",
                    "Must be exactly 3 lines, 5-7-5 syllable structure, theme must be the ocean",
                ])
    runner.call(contract, "submit_proof", sender=ADVENTURER, args=[
        0,
        "Waves crash on the shore (5)\nSalt mist rises to the sky (7)\nDeep blue calls my name (5)"
    ])

    # In simulation mode, runner.call with llm_result allows injecting AI response
    approved = runner.call(
        contract, "evaluate_submission",
        sender=THIRD,
        args=[0, 0],
        llm_result={"approved": True, "reason": "Haiku follows 5-7-5 structure and ocean theme"},
    )

    assert approved is True

    quest = runner.call(contract, "get_quest", args=[0])
    assert quest["completed"] is True
    assert quest["winner"] == ADVENTURER
    assert quest["active"] is False

    sub = runner.call(contract, "get_submission", args=[0, 0])
    assert sub["approved"] is True

    claimable = runner.call(contract, "get_claimable", args=[ADVENTURER])
    assert claimable == REWARD


def test_evaluate_rejection_leaves_quest_active(runner):
    contract = deploy(runner)
    runner.call(contract, "create_quest", sender=CREATOR, value=REWARD,
                args=["Code a sorting algorithm", "Implement merge sort in Python", "Must include working code"])
    runner.call(contract, "submit_proof", sender=ADVENTURER, args=[
        0, "I know how to sort arrays, trust me"
    ])

    approved = runner.call(
        contract, "evaluate_submission",
        sender=THIRD,
        args=[0, 0],
        llm_result={"approved": False, "reason": "No actual code was provided"},
    )

    assert approved is False

    quest = runner.call(contract, "get_quest", args=[0])
    assert quest["completed"] is False
    assert quest["active"] is True  # Still open for other attempts

    claimable = runner.call(contract, "get_claimable", args=[ADVENTURER])
    assert claimable == 0


def test_already_evaluated_submission_fails(runner):
    contract = deploy(runner)
    runner.call(contract, "create_quest", sender=CREATOR, value=REWARD,
                args=["Quest", "desc", "req"])
    runner.call(contract, "submit_proof", sender=ADVENTURER, args=[0, "proof"])
    runner.call(contract, "evaluate_submission", sender=THIRD, args=[0, 0],
                llm_result={"approved": False, "reason": "Rejected"})

    with pytest.raises(Exception, match="already evaluated"):
        runner.call(contract, "evaluate_submission", sender=THIRD, args=[0, 0],
                    llm_result={"approved": True, "reason": "Approved"})


def test_completed_quest_blocks_new_submissions(runner):
    contract = deploy(runner)
    runner.call(contract, "create_quest", sender=CREATOR, value=REWARD,
                args=["Quest", "desc", "req"])
    runner.call(contract, "submit_proof", sender=ADVENTURER, args=[0, "proof"])
    runner.call(contract, "evaluate_submission", sender=THIRD, args=[0, 0],
                llm_result={"approved": True, "reason": "Done"})

    with pytest.raises(Exception, match="already completed"):
        runner.call(contract, "submit_proof", sender=THIRD, args=[0, "late proof"])
