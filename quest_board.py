# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

VALID_CATEGORIES = ["creative", "technical", "research", "social", "gaming", "other"]


class QuestBoard(gl.Contract):
    """
    AI-governed on-chain quest board.

    Flow:
      1. Creator calls create_quest() with GEN reward + category attached.
      2. Anyone calls submit_proof() with text/URL evidence.
      3. Anyone calls evaluate_submission() — GenLayer validators run LLM consensus.
      4. On approval the reward is credited to the winner's claimable balance.
      5. If a result seems wrong, anyone can call appeal_evaluation() to request
         a second round of validator consensus (requires an appeal bond).
      6. Winner calls withdraw() to pull their GEN.
      7. Creator can cancel() an uncompleted quest to reclaim the reward.
    """

    quests: dict       # quest_id (str) -> quest dict
    submissions: dict  # quest_id (str) -> list of submission dicts
    quest_count: int
    claimable: dict    # address (str) -> GEN owed (wei)

    # appeal_bond (str) -> { quest_id, submission_id, appellant, resolved }
    # Keyed by the original evaluate_submission tx hash passed by the frontend.
    appeals: dict

    def __init__(self) -> None:
        self.quests = {}
        self.submissions = {}
        self.quest_count = 0
        self.claimable = {}
        self.appeals = {}

    # -----------------------------------------------------------------------
    # Creator actions
    # -----------------------------------------------------------------------

    @gl.public.write.payable
    def create_quest(
        self,
        title: str,
        description: str,
        requirements: str,
        category: str = "other",
    ) -> int:
        """Create a quest and lock GEN as the reward."""
        reward = gl.message.value
        if reward <= 0:
            raise gl.vm.UserError("Must attach GEN as reward (value > 0)")
        if not title.strip():
            raise gl.vm.UserError("Title cannot be empty")
        if not requirements.strip():
            raise gl.vm.UserError("Requirements cannot be empty")
        if category not in VALID_CATEGORIES:
            raise gl.vm.UserError(f"Category must be one of: {', '.join(VALID_CATEGORIES)}")

        quest_id = self.quest_count
        self.quest_count += 1
        qid = str(quest_id)

        self.quests[qid] = {
            "id": quest_id,
            "creator": str(gl.message.sender_address),
            "title": title,
            "description": description,
            "requirements": requirements,
            "category": category,
            "reward": reward,
            "active": True,
            "completed": False,
            "winner": None,
            "appealed": False,
        }
        self.submissions[qid] = []

        return quest_id

    @gl.public.write
    def cancel_quest(self, quest_id: int) -> None:
        """Creator cancels an active quest and reclaims the reward."""
        qid = str(quest_id)
        quest = self._get_quest_or_error(qid)

        if str(gl.message.sender_address) != quest["creator"]:
            raise gl.vm.UserError("Only the quest creator can cancel")
        if quest["completed"]:
            raise gl.vm.UserError("Quest is already completed")
        if not quest["active"]:
            raise gl.vm.UserError("Quest is already inactive")

        self.quests[qid]["active"] = False
        self._credit(quest["creator"], quest["reward"])

    # -----------------------------------------------------------------------
    # Adventurer actions
    # -----------------------------------------------------------------------

    @gl.public.write
    def submit_proof(self, quest_id: int, proof: str) -> int:
        """Submit proof of quest completion. Returns submission_id."""
        qid = str(quest_id)
        quest = self._get_quest_or_error(qid)

        if not quest["active"]:
            raise gl.vm.UserError("Quest is no longer active")
        if quest["completed"]:
            raise gl.vm.UserError("Quest is already completed")

        submitter = str(gl.message.sender_address)
        if submitter == quest["creator"]:
            raise gl.vm.UserError("Quest creator cannot submit to their own quest")
        if not proof.strip():
            raise gl.vm.UserError("Proof cannot be empty")

        submission_id = len(self.submissions[qid])
        self.submissions[qid].append({
            "id": submission_id,
            "submitter": submitter,
            "proof": proof,
            "evaluated": False,
            "approved": False,
            "reason": "",
            "appealed": False,
            "appeal_resolved": False,
            "appeal_overturned": False,
        })

        return submission_id

    @gl.public.write
    def evaluate_submission(self, quest_id: int, submission_id: int) -> bool:
        """
        AI evaluation via GenLayer validator consensus.
        Multiple validators independently run the LLM and vote on the result.
        Equivalence Principle: 'approved' must match across validators to finalize.
        """
        qid = str(quest_id)
        quest = self._get_quest_or_error(qid)

        if not quest["active"]:
            raise gl.vm.UserError("Quest is no longer active")
        if quest["completed"]:
            raise gl.vm.UserError("Quest is already completed")

        subs = self.submissions[qid]
        if submission_id >= len(subs):
            raise gl.vm.UserError("Submission not found")

        submission = subs[submission_id]
        if submission["evaluated"]:
            raise gl.vm.UserError("Submission already evaluated")

        prompt = f"""You are an impartial judge evaluating whether a quest has been completed.

=== QUEST ===
Title: {quest['title']}
Category: {quest.get('category', 'other')}
Description: {quest['description']}
Requirements (the submitter must satisfy ALL of these):
{quest['requirements']}

=== SUBMITTED PROOF ===
{submission['proof']}

=== INSTRUCTIONS ===
Evaluate whether the proof genuinely satisfies EVERY stated requirement.
- Be thorough but fair.
- Approve only if ALL requirements are clearly and specifically met.
- Reject if the proof is vague, incomplete, or misses any requirement.
- Partial completion is not enough — all requirements must be fully met.

Respond ONLY as valid JSON:
{{"approved": true, "reason": "Brief explanation"}}
or
{{"approved": false, "reason": "Brief explanation of what was missing"}}"""

        def leader_fn():
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leaders_res) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            my_result = leader_fn()
            if not isinstance(my_result, dict):
                return False
            return my_result.get("approved") == leaders_res.calldata.get("approved")

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        approved = bool(result.get("approved", False))
        reason = str(result.get("reason", ""))

        self.submissions[qid][submission_id]["evaluated"] = True
        self.submissions[qid][submission_id]["approved"] = approved
        self.submissions[qid][submission_id]["reason"] = reason

        if approved:
            self.quests[qid]["completed"] = True
            self.quests[qid]["active"] = False
            self.quests[qid]["winner"] = submission["submitter"]
            self._credit(submission["submitter"], quest["reward"])

        return approved

    @gl.public.write.payable
    def appeal_evaluation(self, quest_id: int, submission_id: int, appeal_reason: str) -> bool:
        """
        Appeal a rejected evaluation. Requires an appeal bond (attached GEN value).
        Triggers a second round of AI validator consensus with additional context.

        On overturn (original result reversed):
        - Bond is refunded to appellant.
        - If approval overturned to rejection: winner's claimable is revoked, quest reopens.
        - If rejection overturned to approval: reward is credited to submitter.

        On failed appeal: bond is lost (goes to contract treasury for future use).
        """
        bond = gl.message.value
        if bond <= 0:
            raise gl.vm.UserError("Must attach GEN as appeal bond (value > 0)")

        qid = str(quest_id)
        quest = self._get_quest_or_error(qid)

        subs = self.submissions[qid]
        if submission_id >= len(subs):
            raise gl.vm.UserError("Submission not found")

        submission = subs[submission_id]
        if not submission["evaluated"]:
            raise gl.vm.UserError("Submission has not been evaluated yet")
        if submission["appealed"]:
            raise gl.vm.UserError("This submission has already been appealed")

        appellant = str(gl.message.sender_address)
        original_approved = submission["approved"]

        prompt = f"""You are an appeal judge reviewing a prior AI evaluation decision.

=== QUEST ===
Title: {quest['title']}
Category: {quest.get('category', 'other')}
Requirements: {quest['requirements']}

=== SUBMITTED PROOF ===
{submission['proof']}

=== ORIGINAL DECISION ===
The original AI judge decided: {"APPROVED" if original_approved else "REJECTED"}
Original reason: {submission['reason']}

=== APPELLANT'S ARGUMENT ===
{appeal_reason}

=== YOUR TASK ===
Carefully re-evaluate whether the proof satisfies ALL the quest requirements.
Consider the appellant's argument but make your own independent judgment.
- If the original decision was CORRECT, return the same result.
- If the original decision was WRONG (the appellant's argument reveals an error), overturn it.

Respond ONLY as valid JSON:
{{"approved": true, "reason": "Your reasoning", "overturned": true/false}}"""

        def leader_fn():
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leaders_res) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            my_result = leader_fn()
            if not isinstance(my_result, dict):
                return False
            return my_result.get("approved") == leaders_res.calldata.get("approved")

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        new_approved = bool(result.get("approved", False))
        overturned = new_approved != original_approved

        self.submissions[qid][submission_id]["appealed"] = True
        self.submissions[qid][submission_id]["appeal_resolved"] = True
        self.submissions[qid][submission_id]["appeal_overturned"] = overturned
        self.submissions[qid][submission_id]["appeal_reason"] = appeal_reason
        self.submissions[qid][submission_id]["appeal_result_reason"] = str(result.get("reason", ""))
        self.submissions[qid][submission_id]["approved"] = new_approved

        if overturned:
            # Refund bond to appellant
            self._credit(appellant, bond)

            if new_approved and not original_approved:
                # Rejection → Approval: pay the submitter
                self.quests[qid]["completed"] = True
                self.quests[qid]["active"] = False
                self.quests[qid]["winner"] = submission["submitter"]
                self.submissions[qid][submission_id]["reason"] = str(result.get("reason", ""))
                self._credit(submission["submitter"], quest["reward"])

            elif not new_approved and original_approved:
                # Approval → Rejection: claw back reward, reopen quest
                winner = quest["winner"]
                if winner:
                    prev = self.claimable.get(winner, 0)
                    clawback = min(prev, quest["reward"])
                    self.claimable[winner] = prev - clawback

                self.quests[qid]["completed"] = False
                self.quests[qid]["active"] = True
                self.quests[qid]["winner"] = None
                self.quests[qid]["appealed"] = True
        # Bond is lost if appeal fails (stays in contract)

        return overturned

    @gl.public.write
    def withdraw(self) -> int:
        """Withdraw claimable GEN (rewards or refunds)."""
        caller = str(gl.message.sender_address)
        amount = self.claimable.get(caller, 0)
        if amount <= 0:
            raise gl.vm.UserError("Nothing to withdraw")
        self.claimable[caller] = 0
        gl.message.transfer(Address(caller), amount)
        return amount

    # -----------------------------------------------------------------------
    # View methods
    # -----------------------------------------------------------------------

    @gl.public.view
    def get_quest(self, quest_id: int) -> dict:
        return self._get_quest_or_error(str(quest_id))

    @gl.public.view
    def get_all_quests(self) -> list:
        return list(self.quests.values())

    @gl.public.view
    def get_active_quests(self) -> list:
        return [q for q in self.quests.values() if q["active"]]

    @gl.public.view
    def get_completed_quests(self) -> list:
        return [q for q in self.quests.values() if q["completed"]]

    @gl.public.view
    def get_quests_by_category(self, category: str) -> list:
        return [q for q in self.quests.values() if q.get("category") == category]

    @gl.public.view
    def get_submissions(self, quest_id: int) -> list:
        qid = str(quest_id)
        if qid not in self.submissions:
            raise gl.vm.UserError("Quest not found")
        return self.submissions[qid]

    @gl.public.view
    def get_submission(self, quest_id: int, submission_id: int) -> dict:
        qid = str(quest_id)
        subs = self.submissions.get(qid, [])
        if submission_id >= len(subs):
            raise gl.vm.UserError("Submission not found")
        return subs[submission_id]

    @gl.public.view
    def get_claimable(self, addr: str) -> int:
        return self.claimable.get(addr, 0)

    @gl.public.view
    def get_quest_count(self) -> int:
        return self.quest_count

    @gl.public.view
    def get_leaderboard(self) -> list:
        """Top 10 adventurers by total GEN won across all quests."""
        winners: dict = {}
        for quest in self.quests.values():
            if quest["completed"] and quest["winner"]:
                addr = quest["winner"]
                if addr not in winners:
                    winners[addr] = {
                        "address": addr,
                        "quests_won": 0,
                        "total_gen_won": 0,
                    }
                winners[addr]["quests_won"] += 1
                winners[addr]["total_gen_won"] += quest["reward"]

        ranked = sorted(winners.values(), key=lambda x: x["total_gen_won"], reverse=True)
        return ranked[:10]

    @gl.public.view
    def get_creator_stats(self) -> list:
        """Top 10 quest creators by total GEN posted."""
        creators: dict = {}
        for quest in self.quests.values():
            addr = quest["creator"]
            if addr not in creators:
                creators[addr] = {
                    "address": addr,
                    "quests_posted": 0,
                    "total_gen_posted": 0,
                    "quests_completed": 0,
                }
            creators[addr]["quests_posted"] += 1
            creators[addr]["total_gen_posted"] += quest["reward"]
            if quest["completed"]:
                creators[addr]["quests_completed"] += 1

        ranked = sorted(creators.values(), key=lambda x: x["total_gen_posted"], reverse=True)
        return ranked[:10]

    @gl.public.view
    def get_valid_categories(self) -> list:
        return VALID_CATEGORIES

    # -----------------------------------------------------------------------
    # Internal helpers
    # -----------------------------------------------------------------------

    def _get_quest_or_error(self, qid: str) -> dict:
        if qid not in self.quests:
            raise gl.vm.UserError(f"Quest {qid} not found")
        return self.quests[qid]

    def _credit(self, addr: str, amount: int) -> None:
        current = self.claimable.get(addr, 0)
        self.claimable[addr] = current + amount
