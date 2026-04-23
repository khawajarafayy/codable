"""
Bayesian Knowledge Tracing (BKT) Engine for Adaptive Learning.
Tracks mastery probability per concept per user.
"""


class KnowledgeTracer:
    """
    Bayesian Knowledge Tracing for each concept.
    Maintains P(mastery) per concept per user.
    """

    # BKT parameters (tunable)
    P_INIT = 0.3       # Prior probability of knowing a concept
    P_TRANSIT = 0.1    # Probability of learning after each opportunity
    P_SLIP = 0.1       # Probability of a mistake despite knowing
    P_GUESS = 0.25     # Probability of guessing correctly without knowing

    def update_mastery(self, prior_mastery: float, is_correct: bool) -> float:
        """
        Update mastery probability after a quiz response using Bayes' theorem.
        Returns new P(mastery).
        """
        if is_correct:
            p_correct_given_knew = 1 - self.P_SLIP
            p_correct_given_didnt = self.P_GUESS
            p_correct = (prior_mastery * p_correct_given_knew +
                         (1 - prior_mastery) * p_correct_given_didnt)
            p_knew = (prior_mastery * p_correct_given_knew) / p_correct if p_correct > 0 else prior_mastery
        else:
            p_incorrect_given_knew = self.P_SLIP
            p_incorrect_given_didnt = 1 - self.P_GUESS
            p_incorrect = (prior_mastery * p_incorrect_given_knew +
                           (1 - prior_mastery) * p_incorrect_given_didnt)
            p_knew = (prior_mastery * p_incorrect_given_knew) / p_incorrect if p_incorrect > 0 else prior_mastery

        # Account for learning transition
        new_mastery = p_knew + (1 - p_knew) * self.P_TRANSIT
        return round(min(new_mastery, 1.0), 4)

    def should_advance(self, concept_masteries: dict, threshold: float = 0.75) -> bool:
        """
        Decide if user has mastered enough concepts to advance.
        All concepts for a topic must be above threshold.
        """
        if not concept_masteries:
            return False
        return all(m >= threshold for m in concept_masteries.values())

    def get_weak_concepts(self, concept_masteries: dict, threshold: float = 0.75) -> list:
        """Return concepts below mastery threshold."""
        return [
            {"concept": concept, "mastery": score}
            for concept, score in concept_masteries.items()
            if score < threshold
        ]
