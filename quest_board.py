# v0.2.18
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
from dataclasses import dataclass
import json
import typing

VALID_CATEGORIES = ["creative", "technical", "research", "social", "gaming", "bug_bounty", "other"]

# Reward split per rank (out of 1000) for each max_winners setting
# e.g. for max_winners=3: 1st=50%, 2nd=30%, 3rd=20%
REWARD_SPLITS: dict = {
    1: [1000],
    2: [600, 400],
    3: [500, 300, 200],
}


@allow_storage
@dataclass
class Quest:
    creator: str
    title: str
    description: str
    requirements: str
    category: str
    quest_type: str       # "task" | "bug_bounty"
    reward: u256          # total prize pool
    max_winners: u256     # 1, 2, or 3
    winner_count: u256    # approved winners so far
    paid_out: u256        # reward already distributed
    active: bool
    completed: bool
    winner: str           # first winner address (or "")
    appealed: bool


@allow_storage
@dataclass
class Submission:
    submitter: str
    proof: str            # written description
    proof_url: str        # X/Medium/GitHub link (optional)
    proof_platform: str   # "x" | "medium" | "github" | "other"
    evaluated: bool
    approved: bool
    rank: u256            # 1st/2nd/3rd place (0 if not a winner)
    reason: str
    appealed: bool
    appeal_resolved: bool
    appeal_overturned: bool
    appeal_reason: str
    appeal_result_reason: str


class QuestBoard(gl.Contract):
    quests: TreeMap[str, Quest]
    sub_counts: TreeMap[str, u256]
    subs: TreeMap[str, Submission]
    quest_count: u256
    claimable: TreeMap[str, u256]

    def __init__(self) -> None:
        self.quest_count = u256(0)

    # ── Creator actions ────────────────────────────────────────────────────

    @gl.public.write.payable
    def create_quest(
        self,
        title: str,
        description: str,
        requirements: str,
        category: str = "other",
        max_winners: int = 1,
        quest_type: str = "task",
    ) -> u256:
        reward = gl.message.value
        if reward <= 0:
            raise gl.vm.UserError("Must attach GEN as reward (value > 0)")
        if not title.strip():
            raise gl.vm.UserError("Title cannot be empty")
        if not requirements.strip():
            raise gl.vm.UserError("Requirements cannot be empty")
        if category not in VALID_CATEGORIES:
            raise gl.vm.UserError(f"Category must be one of: {', '.join(VALID_CATEGORIES)}")
        if max_winners < 1 or max_winners > 3:
            raise gl.vm.UserError("max_winners must be 1, 2, or 3")
        if quest_type not in ("task", "bug_bounty"):
            raise gl.vm.UserError("quest_type must be 'task' or 'bug_bounty'")
        if quest_type == "bug_bounty" and max_winners > 1:
            raise gl.vm.UserError("Bug bounties reward only 1 winner (first valid report)")

        quest_id = self.quest_count
        self.quest_count = u256(int(self.quest_count) + 1)
        qid = str(int(quest_id))

        self.quests[qid] = Quest(
            creator=str(gl.message.sender_address),
            title=title,
            description=description,
            requirements=requirements,
            category=category,
            quest_type=quest_type,
            reward=u256(reward),
            max_winners=u256(max_winners),
            winner_count=u256(0),
            paid_out=u256(0),
            active=True,
            completed=False,
            winner="",
            appealed=False,
        )
        self.sub_counts[qid] = u256(0)
        return quest_id

    @gl.public.write
    def cancel_quest(self, quest_id: u256) -> None:
        qid = str(int(quest_id))
        quest = self._require_quest(qid)
        if str(gl.message.sender_address) != quest.creator:
            raise gl.vm.UserError("Only the quest creator can cancel")
        if quest.completed:
            raise gl.vm.UserError("Quest is already completed")
        if not quest.active:
            raise gl.vm.UserError("Quest is already inactive")
        self.quests[qid].active = False
        refund = int(quest.reward) - int(quest.paid_out)
        if refund > 0:
            self._credit(quest.creator, u256(refund))

    # ── Adventurer actions ─────────────────────────────────────────────────

    @gl.public.write
    def submit_proof(
        self,
        quest_id: u256,
        proof: str,
        proof_url: str = "",
        proof_platform: str = "other",
    ) -> u256:
        qid = str(int(quest_id))
        quest = self._require_quest(qid)
        if not quest.active:
            raise gl.vm.UserError("Quest is no longer active")
        if quest.completed:
            raise gl.vm.UserError("Quest is already completed")
        submitter = str(gl.message.sender_address)
        if submitter == quest.creator:
            raise gl.vm.UserError("Quest creator cannot submit to their own quest")
        if not proof.strip() and not proof_url.strip():
            raise gl.vm.UserError("Provide a proof description or URL")
        if proof_platform not in ("x", "medium", "github", "other"):
            proof_platform = "other"

        sub_id = self.sub_counts[qid]
        self.sub_counts[qid] = u256(int(sub_id) + 1)
        key = f"{qid}:{int(sub_id)}"
        self.subs[key] = Submission(
            submitter=submitter,
            proof=proof,
            proof_url=proof_url,
            proof_platform=proof_platform,
            evaluated=False,
            approved=False,
            rank=u256(0),
            reason="",
            appealed=False,
            appeal_resolved=False,
            appeal_overturned=False,
            appeal_reason="",
            appeal_result_reason="",
        )
        return sub_id

    @gl.public.write
    def evaluate_submission(self, quest_id: u256, submission_id: u256) -> bool:
        qid = str(int(quest_id))
        sid = int(submission_id)
        quest = self._require_quest(qid)
        if not quest.active:
            raise gl.vm.UserError("Quest is no longer active")
        if quest.completed:
            raise gl.vm.UserError("Quest already has all winners")

        key = f"{qid}:{sid}"
        if key not in self.subs:
            raise gl.vm.UserError("Submission not found")
        sub = self.subs[key]
        if sub.evaluated:
            raise gl.vm.UserError("Submission already evaluated")

        title = quest.title
        quest_type = quest.quest_type
        category = quest.category
        description = quest.description
        requirements = quest.requirements
        proof = sub.proof
        proof_url = sub.proof_url
        proof_platform = sub.proof_platform
        max_w = int(quest.max_winners)
        current_winners = int(quest.winner_count)
        place_label = ["1st", "2nd", "3rd"][current_winners] if current_winners < 3 else "next"

        url_line = f"URL: {proof_url}" if proof_url else "(no URL)"

        prompt = (
            f"Requirements: {requirements}\n"
            f"Submission: {url_line} {proof if proof else ''}\n"
            "Does this submission meet ALL requirements? Reply with only the word APPROVED or REJECTED."
        )

        def get_verdict() -> str:
            r = gl.nondet.exec_prompt(prompt).strip().upper()
            return "APPROVED" if "APPROVED" in r else "REJECTED"

        verdict = gl.eq_principle.strict_eq(get_verdict)
        approved = verdict == "APPROVED"
        reason = "Evaluated by AI validators"

        self.subs[key].evaluated = True
        self.subs[key].approved = approved
        self.subs[key].reason = reason

        if approved:
            new_count = current_winners + 1
            rank_reward = self._reward_for_rank(quest.reward, max_w, new_count)

            self.subs[key].rank = u256(new_count)
            self.quests[qid].winner_count = u256(new_count)
            self.quests[qid].paid_out = u256(int(quest.paid_out) + int(rank_reward))

            if not quest.winner:
                self.quests[qid].winner = sub.submitter

            self._credit(sub.submitter, rank_reward)

            if new_count >= max_w:
                self.quests[qid].completed = True
                self.quests[qid].active = False

        return approved

    @gl.public.write
    def creator_evaluate(self, quest_id: u256, submission_id: u256, approved: bool, reason: str) -> bool:
        qid = str(int(quest_id))
        sid = int(submission_id)
        quest = self._require_quest(qid)

        caller = str(gl.message.sender_address)
        if caller.lower() != quest.creator.lower():
            raise gl.vm.UserError("Only the quest creator can evaluate submissions")
        if not quest.active:
            raise gl.vm.UserError("Quest is no longer active")
        if quest.completed:
            raise gl.vm.UserError("Quest already has all winners")

        key = f"{qid}:{sid}"
        if key not in self.subs:
            raise gl.vm.UserError("Submission not found")
        sub = self.subs[key]
        if sub.evaluated:
            raise gl.vm.UserError("Submission already evaluated")

        self.subs[key].evaluated = True
        self.subs[key].approved = approved
        self.subs[key].reason = reason if reason else ("Approved by quest creator" if approved else "Rejected by quest creator")

        if approved:
            current_winners = int(quest.winner_count)
            max_w = int(quest.max_winners)
            new_count = current_winners + 1
            rank_reward = self._reward_for_rank(quest.reward, max_w, new_count)

            self.subs[key].rank = u256(new_count)
            self.quests[qid].winner_count = u256(new_count)
            self.quests[qid].paid_out = u256(int(quest.paid_out) + int(rank_reward))

            if not quest.winner:
                self.quests[qid].winner = sub.submitter

            self._credit(sub.submitter, rank_reward)

            if new_count >= max_w:
                self.quests[qid].completed = True
                self.quests[qid].active = False

        return approved

    @gl.public.write.payable
    def appeal_evaluation(self, quest_id: u256, submission_id: u256, appeal_reason: str) -> bool:
        bond = gl.message.value
        if bond <= 0:
            raise gl.vm.UserError("Must attach GEN as appeal bond (value > 0)")
        qid = str(int(quest_id))
        sid = int(submission_id)
        quest = self._require_quest(qid)

        key = f"{qid}:{sid}"
        if key not in self.subs:
            raise gl.vm.UserError("Submission not found")
        sub = self.subs[key]
        if not sub.evaluated:
            raise gl.vm.UserError("Submission has not been evaluated yet")
        if sub.appealed:
            raise gl.vm.UserError("This submission has already been appealed")

        appellant = str(gl.message.sender_address)
        original_approved = sub.approved
        original_decision = "APPROVED" if original_approved else "REJECTED"
        original_reason = sub.reason
        title = quest.title
        requirements = quest.requirements
        proof = sub.proof
        proof_url = sub.proof_url
        proof_platform = sub.proof_platform

        url_line = f"URL: {proof_url}" if proof_url else "(no URL)"

        prompt = (
            f"Requirements: {requirements}\n"
            f"Submission: {url_line} {proof if proof else ''}\n"
            f"Original decision: {original_decision}. Appeal argument: {appeal_reason}\n"
            "Should this submission be approved? Reply with only the word APPROVED or REJECTED."
        )

        def get_appeal_verdict() -> str:
            r = gl.nondet.exec_prompt(prompt).strip().upper()
            return "APPROVED" if "APPROVED" in r else "REJECTED"

        appeal_verdict = gl.eq_principle.strict_eq(get_appeal_verdict)
        new_approved = appeal_verdict == "APPROVED"
        overturned = new_approved != original_approved

        self.subs[key].appealed = True
        self.subs[key].appeal_resolved = True
        self.subs[key].appeal_overturned = overturned
        self.subs[key].appeal_reason = appeal_reason
        self.subs[key].appeal_result_reason = "Reviewed by AI validators"
        self.subs[key].approved = new_approved

        if overturned:
            self._credit(appellant, u256(bond))
            if new_approved and not original_approved:
                # Was rejected, now approved — assign next available rank
                max_w = int(quest.max_winners)
                new_count = int(quest.winner_count) + 1
                if new_count <= max_w:
                    rank_reward = self._reward_for_rank(quest.reward, max_w, new_count)
                    self.subs[key].rank = u256(new_count)
                    self.subs[key].reason = "Approved on appeal"
                    self.quests[qid].winner_count = u256(new_count)
                    self.quests[qid].paid_out = u256(int(quest.paid_out) + int(rank_reward))
                    if not quest.winner:
                        self.quests[qid].winner = sub.submitter
                    self._credit(sub.submitter, rank_reward)
                    if new_count >= max_w:
                        self.quests[qid].completed = True
                        self.quests[qid].active = False
            elif not new_approved and original_approved:
                # Was approved, now rejected — clawback reward and reopen slot
                rank = int(sub.rank)
                max_w = int(quest.max_winners)
                clawback_amount = self._reward_for_rank(quest.reward, max_w, rank)
                self.subs[key].rank = u256(0)
                winner_addr = sub.submitter
                if winner_addr in self.claimable:
                    prev = int(self.claimable[winner_addr])
                    clawback = min(prev, int(clawback_amount))
                    self.claimable[winner_addr] = u256(prev - clawback)
                new_count = max(0, int(quest.winner_count) - 1)
                self.quests[qid].winner_count = u256(new_count)
                self.quests[qid].paid_out = u256(max(0, int(quest.paid_out) - int(clawback_amount)))
                self.quests[qid].completed = False
                self.quests[qid].active = True
                self.quests[qid].appealed = True
                if quest.winner == winner_addr:
                    self.quests[qid].winner = ""

        return overturned

    @gl.public.write
    def withdraw(self) -> u256:
        caller = str(gl.message.sender_address)
        amount = int(self.claimable[caller]) if caller in self.claimable else 0
        if amount <= 0:
            raise gl.vm.UserError("Nothing to withdraw")
        self.claimable[caller] = u256(0)
        gl.message.transfer(Address(caller), amount)
        return u256(amount)

    # ── View methods ───────────────────────────────────────────────────────

    @gl.public.view
    def get_quest(self, quest_id: u256) -> typing.Any:
        qid = str(int(quest_id))
        return self._quest_to_dict(qid, self._require_quest(qid))

    @gl.public.view
    def get_all_quests(self) -> typing.Any:
        result = []
        for i in range(int(self.quest_count)):
            qid = str(i)
            if qid in self.quests:
                result.append(self._quest_to_dict(qid, self.quests[qid]))
        return result

    @gl.public.view
    def get_active_quests(self) -> typing.Any:
        result = []
        for i in range(int(self.quest_count)):
            qid = str(i)
            if qid in self.quests:
                q = self.quests[qid]
                if q.active:
                    result.append(self._quest_to_dict(qid, q))
        return result

    @gl.public.view
    def get_submissions(self, quest_id: u256) -> typing.Any:
        qid = str(int(quest_id))
        if qid not in self.quests:
            raise gl.vm.UserError("Quest not found")
        count = int(self.sub_counts[qid]) if qid in self.sub_counts else 0
        result = []
        for i in range(count):
            key = f"{qid}:{i}"
            if key in self.subs:
                result.append(self._sub_to_dict(i, self.subs[key]))
        return result

    @gl.public.view
    def get_submission(self, quest_id: u256, submission_id: u256) -> typing.Any:
        qid = str(int(quest_id))
        sid = int(submission_id)
        key = f"{qid}:{sid}"
        if key not in self.subs:
            raise gl.vm.UserError("Submission not found")
        return self._sub_to_dict(sid, self.subs[key])

    @gl.public.view
    def get_claimable(self, addr: str) -> u256:
        if addr in self.claimable:
            return self.claimable[addr]
        return u256(0)

    @gl.public.view
    def get_quest_count(self) -> u256:
        return self.quest_count

    @gl.public.view
    def get_reward_splits(self, max_winners: int) -> typing.Any:
        splits = REWARD_SPLITS.get(max_winners, [1000])
        return [s / 10 for s in splits]  # return as percentages

    @gl.public.view
    def get_leaderboard(self) -> typing.Any:
        winners: dict = {}
        for i in range(int(self.quest_count)):
            qid = str(i)
            if qid not in self.quests:
                continue
            q = self.quests[qid]
            count = int(self.sub_counts[qid]) if qid in self.sub_counts else 0
            for j in range(count):
                key = f"{qid}:{j}"
                if key in self.subs:
                    s = self.subs[key]
                    if s.approved and int(s.rank) > 0:
                        addr = s.submitter
                        if addr not in winners:
                            winners[addr] = {"address": addr, "quests_won": 0, "total_gen_won": 0}
                        winners[addr]["quests_won"] += 1
                        rank_reward = self._reward_for_rank(q.reward, int(q.max_winners), int(s.rank))
                        winners[addr]["total_gen_won"] += int(rank_reward)
        ranked = sorted(winners.values(), key=lambda x: x["total_gen_won"], reverse=True)
        return ranked[:10]

    @gl.public.view
    def get_valid_categories(self) -> typing.Any:
        return VALID_CATEGORIES

    # ── Internals ──────────────────────────────────────────────────────────

    def _require_quest(self, qid: str) -> Quest:
        if qid not in self.quests:
            raise gl.vm.UserError(f"Quest {qid} not found")
        return self.quests[qid]

    def _credit(self, addr: str, amount: u256) -> None:
        current = int(self.claimable[addr]) if addr in self.claimable else 0
        self.claimable[addr] = u256(current + int(amount))

    def _reward_for_rank(self, total: u256, max_w: int, rank: int) -> u256:
        splits = REWARD_SPLITS.get(max_w, [1000])
        if rank < 1 or rank > len(splits):
            return u256(0)
        return u256(int(total) * splits[rank - 1] // 1000)

    def _quest_to_dict(self, qid: str, q: Quest) -> typing.Any:
        max_w = int(q.max_winners)
        splits = REWARD_SPLITS.get(max_w, [1000])
        reward_per_rank = [int(q.reward) * s // 1000 for s in splits]
        return {
            "id": int(qid),
            "creator": q.creator,
            "title": q.title,
            "description": q.description,
            "requirements": q.requirements,
            "category": q.category,
            "quest_type": q.quest_type,
            "reward": int(q.reward),
            "paid_out": int(q.paid_out),
            "max_winners": max_w,
            "winner_count": int(q.winner_count),
            "reward_per_rank": reward_per_rank,
            "active": q.active,
            "completed": q.completed,
            "winner": q.winner if q.winner else None,
            "appealed": q.appealed,
        }

    def _sub_to_dict(self, sid: int, s: Submission) -> typing.Any:
        return {
            "id": sid,
            "submitter": s.submitter,
            "proof": s.proof,
            "proof_url": s.proof_url,
            "proof_platform": s.proof_platform,
            "evaluated": s.evaluated,
            "approved": s.approved,
            "rank": int(s.rank),
            "reason": s.reason,
            "appealed": s.appealed,
            "appeal_resolved": s.appeal_resolved,
            "appeal_overturned": s.appeal_overturned,
            "appeal_reason": s.appeal_reason,
            "appeal_result_reason": s.appeal_result_reason,
        }
