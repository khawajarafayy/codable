"""
Adaptive Decision Router.
Evaluates quiz results and decides: advance to next topic OR remediate.
"""

from adaptive_engine import KnowledgeTracer


# Topic ordering for determining "next topic"
TOPIC_ORDER = []
for ch in range(1, 11):
    chapter_sizes = {1: 10, 2: 16, 3: 11, 4: 5, 5: 8, 6: 8, 7: 8, 8: 5, 9: 9, 10: 8}
    count = chapter_sizes.get(ch, 0)
    for t in range(1, count + 1):
        TOPIC_ORDER.append(f"{ch}-{t}")


class AdaptiveRouter:
    def __init__(self):
        self.tracer = KnowledgeTracer()

    def evaluate_quiz_result(self, user_concept_mastery: dict, topic_id: str,
                             quiz_responses: list, attempt_number: int = 1):
        """
        Main decision point after a quiz.

        Args:
            user_concept_mastery: dict of {concept_tag: mastery_score} for this user
            topic_id: e.g. "3-5"
            quiz_responses: list of dicts with keys:
                - concept_tags: [str]
                - is_correct: bool
                - user_answer: str
                - correct_answer: str
                - question_text: str
                - error_type: str (optional, from error analyzer)
                - error_detail: str (optional)
            attempt_number: how many times the user has attempted this topic's quiz

        Returns:
            dict with action, updated masteries, weak concepts, remediation plan
        """
        weak_concepts = []
        updated_masteries = {}

        # 1. Update mastery for each concept tested
        for response in quiz_responses:
            concept_tags = response.get("concept_tags", [])
            is_correct = response.get("is_correct", False)

            for concept in concept_tags:
                prior = user_concept_mastery.get(concept, self.tracer.P_INIT)
                new_mastery = self.tracer.update_mastery(prior, is_correct)
                updated_masteries[concept] = new_mastery

                if not is_correct:
                    weak_concepts.append({
                        "concept": concept,
                        "mastery": new_mastery,
                        "error_type": response.get("error_type", "unknown"),
                        "error_detail": response.get("error_detail", ""),
                        "user_answer": response.get("user_answer", ""),
                        "correct_answer": response.get("correct_answer", ""),
                        "question_text": response.get("question_text", ""),
                    })

        # 2. Decide: advance or remediate
        all_correct = all(r.get("is_correct", False) for r in quiz_responses)
        score_pct = sum(1 for r in quiz_responses if r.get("is_correct")) / max(len(quiz_responses), 1) * 100

        # If ALL answers are correct, allow advancement (even if masteries are below threshold)
        # This prevents infinite remediation loops when user demonstrates understanding
        if all_correct:
            return {
                "action": "advance",
                "topic_id": topic_id,
                "next_topic_id": self._get_next_topic(topic_id),
                "updated_masteries": updated_masteries,
                "weak_concepts": [],
                "score": score_pct,
            }
        else:
            return {
                "action": "remediate",
                "topic_id": topic_id,
                "next_topic_id": None,
                "weak_concepts": weak_concepts,
                "updated_masteries": updated_masteries,
                "score": score_pct,
                "remediation_plan": self._build_remediation_plan(
                    topic_id, weak_concepts, attempt_number
                ),
            }

    def _build_remediation_plan(self, topic_id: str, weak_concepts: list, attempt_number: int):
        """Build a structured plan for remedial content generation."""
        return {
            "topic_id": topic_id,
            "focus_areas": list(set(wc["concept"] for wc in weak_concepts)),
            "error_summary": [
                {
                    "concept": wc["concept"],
                    "what_went_wrong": wc.get("error_type", "unknown"),
                    "user_said": wc.get("user_answer", ""),
                    "correct_was": wc.get("correct_answer", ""),
                    "detail": wc.get("error_detail", ""),
                }
                for wc in weak_concepts
            ],
            "suggested_difficulty": "easier" if attempt_number <= 2 else "much_easier",
            "attempt_number": attempt_number + 1,
        }

    def _get_next_topic(self, current_topic_id: str) -> str:
        """Get the next topic in sequence."""
        try:
            idx = TOPIC_ORDER.index(current_topic_id)
            if idx + 1 < len(TOPIC_ORDER):
                return TOPIC_ORDER[idx + 1]
        except ValueError:
            pass
        return None
