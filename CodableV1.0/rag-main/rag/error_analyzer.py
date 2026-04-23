"""
Error Analyzer — Uses LLM to classify student mistakes on quiz questions.
Determines whether the error is conceptual, syntax, logic, or careless.
Falls back to rule-based classification when the LLM is unavailable.
"""

from langchain_core.prompts import ChatPromptTemplate
from config import MISTRAL_API_KEY
import json
import re


def _create_mistral_model():
    """Create Mistral model, return None if unavailable."""
    try:
        from langchain_mistralai import ChatMistralAI
        return ChatMistralAI(
            model="mistral-large-latest",
            mistral_api_key=MISTRAL_API_KEY,
            temperature=0.1,
            max_tokens=300
        )
    except Exception as e:
        print(f"⚠️ Could not initialize Mistral for ErrorAnalyzer: {e}")
        return None


class ErrorAnalyzer:
    def __init__(self):
        self.model = _create_mistral_model()

        self.template = """Analyze this Java quiz mistake concisely.

Question: {question}
Student's Answer: {user_answer}
Correct Answer: {correct_answer}
Topic: {topic}

Classify the error as ONE of:
- "conceptual" — student doesn't understand the underlying concept
- "syntax" — student knows the concept but made a syntax mistake
- "logic" — student understands syntax but applied wrong logic
- "careless" — answer is very close, likely just a slip

Return ONLY valid JSON (no other text):
{{"error_type": "...", "explanation": "one sentence explaining what they misunderstood"}}"""

    def analyze(self, question: str, user_answer: str, correct_answer: str, topic: str) -> dict:
        """
        Analyze a single incorrect answer and return error classification.
        Returns dict with 'error_type' and 'explanation'.
        """
        if not self.model:
            return self._rule_based_classify(question, user_answer, correct_answer)

        try:
            prompt = ChatPromptTemplate.from_template(self.template)
            chain = prompt | self.model

            result = chain.invoke({
                "question": question,
                "user_answer": user_answer,
                "correct_answer": correct_answer,
                "topic": topic,
            })

            response_text = result.content.strip()

            # Try to parse JSON from response
            json_match = re.search(r'\{[^}]+\}', response_text)
            if json_match:
                parsed = json.loads(json_match.group())
                error_type = parsed.get("error_type", "unknown")
                if error_type not in ("conceptual", "syntax", "logic", "careless"):
                    error_type = "unknown"
                return {
                    "error_type": error_type,
                    "explanation": parsed.get("explanation", "Unable to determine specific mistake.")
                }

            return {"error_type": "unknown", "explanation": "Unable to analyze the mistake."}

        except Exception as e:
            print(f"⚠️ LLM error analysis failed: {e}")
            return self._rule_based_classify(question, user_answer, correct_answer)

    def _rule_based_classify(self, question: str, user_answer: str, correct_answer: str) -> dict:
        """Simple rule-based fallback when LLM is unavailable."""
        ua = (user_answer or '').lower().strip()
        ca = (correct_answer or '').lower().strip()

        # Check for close match (careless)
        if ua and ca:
            common = set(ua.split()) & set(ca.split())
            if len(common) >= len(ca.split()) * 0.5:
                return {"error_type": "careless", "explanation": "Your answer was close but not quite right."}

        # Default to conceptual
        return {"error_type": "conceptual", "explanation": f"Review the concept — the correct answer is: {correct_answer}"}

    def analyze_batch(self, responses: list, topic_title: str) -> list:
        """
        Analyze a batch of incorrect responses.
        Each item should have: question_text, user_answer, correct_answer
        Returns list of dicts with error_type and explanation added.
        """
        analyzed = []
        for resp in responses:
            if not resp.get("is_correct", True):
                analysis = self.analyze(
                    question=resp.get("question_text", ""),
                    user_answer=resp.get("user_answer", ""),
                    correct_answer=resp.get("correct_answer", ""),
                    topic=topic_title,
                )
                resp["error_type"] = analysis["error_type"]
                resp["error_detail"] = analysis["explanation"]
            else:
                resp["error_type"] = None
                resp["error_detail"] = None
            analyzed.append(resp)
        return analyzed
