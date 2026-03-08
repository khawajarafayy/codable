"""
Remediation Generator — Generates targeted remedial learning content and follow-up
questions based on a student's specific weaknesses and mistakes.
Uses Mistral AI with rule-based fallbacks when the LLM is unavailable.
"""

from langchain_core.prompts import ChatPromptTemplate
from vector import get_relevant_context
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
            temperature=0.4,
            max_tokens=4096
        )
    except Exception as e:
        print(f"⚠️ Could not initialize Mistral for RemediationGenerator: {e}")
        return None


class RemediationGenerator:
    def __init__(self):
        self.model = _create_mistral_model()

        self.remedial_content_template = """You are an expert Java programming tutor. A student just attempted a quiz on "{topic_title}" and struggled with specific concepts. Generate TARGETED remedial learning material.

STUDENT CONTEXT:
- Proficiency Level: {proficiency_level}
- Topic: {topic_title}
- Attempt Number: {attempt_number} (they've tried this topic {attempt_number} time(s))
- Overall mastery so far: {overall_mastery}%

SPECIFIC MISTAKES THE STUDENT MADE:
{mistake_details}

RELEVANT TEXTBOOK CONTENT:
{book_content}

INSTRUCTIONS:
1. Do NOT re-teach the entire topic. Focus ONLY on the concepts the student got wrong.
2. Start by acknowledging the specific mistake pattern (without being condescending).
3. Explain the concept differently from how it was taught before — use analogies, different examples, visual explanations.
4. Provide 2-3 small worked examples that directly address each weak concept.
5. Include a "common pitfall" callout for each mistake type.
6. If this is attempt {attempt_number}, make explanations progressively simpler and more step-by-step.
7. End with a brief summary of key takeaways.

Return ONLY valid JSON with this structure:
{{
  "sections": [
    {{
      "title": "Understanding [Weak Concept]",
      "type": "remedial",
      "targetConcept": "concept-tag",
      "content": "explanation with markdown formatting",
      "examples": ["code example 1", "code example 2"],
      "commonPitfall": "description of common mistake",
      "keyTakeaway": "one-line summary"
    }}
  ],
  "summary": "Overall summary of what was reviewed"
}}"""

        self.remedial_questions_template = """You are an expert Java tutor. Generate practice questions that specifically target the student's weak areas.

STUDENT'S WEAK CONCEPTS:
{weak_concepts}

SPECIFIC MISTAKES THEY MADE:
{mistake_details}

TOPIC: {topic_title}
PROFICIENCY: {proficiency_level}
ATTEMPT: {attempt_number}

RELEVANT CONTENT:
{book_content}

RULES:
1. Generate exactly {num_questions} questions.
2. Each question MUST test one of the weak concepts listed above.
3. Questions should be SLIGHTLY EASIER than the ones they failed — build confidence.
4. Include questions that directly address the type of mistake they made.
5. For each question, include the concept_tags it tests.
6. If attempt > 2, include more guided/scaffolded questions with hints built in.

Return ONLY valid JSON:
{{
  "questions": [
    {{
      "id": "rq1",
      "type": "multiple_choice",
      "concept_tags": ["concept-tag"],
      "difficulty": "easy",
      "question": "question text",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": 0,
      "explanation": "why this is correct",
      "hint": "helpful hint"
    }}
  ]
}}"""

    def generate_remedial_content(self, topic_info: dict, weak_concepts: list,
                                   mistake_details: list, proficiency_level: str = "beginner",
                                   attempt_number: int = 2, concept_masteries: dict = None):
        """Generate targeted remedial learning material."""
        # Get relevant RAG content focused on weak areas (needed for both LLM and fallback)
        search_queries = [f"Java {wc.get('concept', '')} {topic_info.get('title', '')}"
                          for wc in weak_concepts[:3]]
        if not search_queries:
            search_queries = [topic_info.get('title', 'Java programming')]

        all_context = []
        for query in search_queries:
            try:
                docs = get_relevant_context(query, k=4)
                if docs:
                    all_context.extend(docs)
            except Exception:
                pass

        book_content = "\n\n".join(set(all_context))[:4000] if all_context else ""

        # Format mistake details
        mistakes_str = "\n".join([
            f"- Concept: {m.get('concept', 'unknown')}\n"
            f"  Question: {m.get('question_text', 'N/A')}\n"
            f"  Student answered: {m.get('user_said', m.get('user_answer', 'N/A'))}\n"
            f"  Correct answer: {m.get('correct_was', m.get('correct_answer', 'N/A'))}\n"
            f"  Error type: {m.get('what_went_wrong', m.get('error_type', 'unknown'))}\n"
            f"  Detail: {m.get('detail', m.get('error_detail', ''))}"
            for m in mistake_details
        ]) if mistake_details else "No specific mistake details available."

        avg_mastery = 50
        if concept_masteries:
            scores = list(concept_masteries.values())
            avg_mastery = round((sum(scores) / len(scores)) * 100) if scores else 50

        # Try LLM generation if model is available
        if self.model:
            try:
                prompt = ChatPromptTemplate.from_template(self.remedial_content_template)
                chain = prompt | self.model

                result = chain.invoke({
                    "topic_title": topic_info.get("title", "Unknown Topic"),
                    "proficiency_level": proficiency_level,
                    "attempt_number": attempt_number,
                    "overall_mastery": avg_mastery,
                    "mistake_details": mistakes_str,
                    "book_content": book_content,
                })

                response_text = result.content.strip()

                # Parse JSON
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                if json_match:
                    cleaned = json_match.group()
                    cleaned = re.sub(r'[\x00-\x1f]', lambda m: {
                        '\n': '\\n', '\r': '\\r', '\t': '\\t'
                    }.get(m.group(), ''), cleaned)
                    try:
                        parsed = json.loads(cleaned)
                        return {"success": True, "content": parsed}
                    except json.JSONDecodeError:
                        pass

                return {"success": True, "content": {"sections": [{"title": "Remedial Content", "type": "remedial", "content": response_text}], "summary": "Review the material above."}}

            except Exception as e:
                print(f"⚠️ LLM remedial content generation failed: {e}, using RAG fallback")

        # Fallback: build content from RAG context + mistake details
        return self._build_fallback_content(topic_info, weak_concepts, mistake_details, book_content)

    def _build_fallback_content(self, topic_info, weak_concepts, mistake_details, book_content):
        """Build remedial content from RAG context when LLM is unavailable."""
        topic_title = topic_info.get("title", "this topic")
        sections = []

        # Section 1: What you got wrong
        if mistake_details:
            mistake_bullets = []
            for m in mistake_details:
                concept = m.get('concept', 'Unknown concept')
                user_said = m.get('user_said', m.get('user_answer', 'N/A'))
                correct_was = m.get('correct_was', m.get('correct_answer', 'N/A'))
                mistake_bullets.append(
                    f"**{concept}**: You answered \"{user_said}\" — the correct answer is \"{correct_was}\"."
                )
            sections.append({
                "title": f"Your Mistakes on {topic_title}",
                "type": "remedial",
                "targetConcept": ", ".join(wc.get("concept", "") for wc in weak_concepts[:3]),
                "content": "Let's review what went wrong:\n\n" + "\n\n".join(mistake_bullets),
                "commonPitfall": "A common mistake is confusing similar-sounding concepts. Focus on what makes each one unique.",
                "keyTakeaway": "Read each concept carefully and understand its specific purpose."
            })

        # Section 2: Review material from the textbook
        if book_content:
            # Split into meaningful chunks
            paragraphs = [p.strip() for p in book_content.split('\n\n') if p.strip() and len(p.strip()) > 50]
            content_text = "\n\n".join(paragraphs[:6]) if paragraphs else book_content[:2000]
            sections.append({
                "title": f"Review: {topic_title}",
                "type": "remedial",
                "content": content_text,
                "keyTakeaway": "Focus on the concepts you missed and try to understand why the correct answers are right."
            })

        # Section 3: Concepts to remember
        if weak_concepts:
            concept_list = "\n".join(
                f"• **{wc.get('concept', 'Unknown')}** — mastery: {int(wc.get('mastery', 0) * 100)}%"
                for wc in weak_concepts
            )
            sections.append({
                "title": "Concepts to Strengthen",
                "type": "remedial",
                "content": f"These are the areas where you need more practice:\n\n{concept_list}",
                "keyTakeaway": "Focus on these concepts before trying the quiz again."
            })

        if not sections:
            sections.append({
                "title": f"Review: {topic_title}",
                "type": "remedial",
                "content": "Please review the topic material carefully before attempting the quiz again.",
                "keyTakeaway": "Take your time to understand each concept."
            })

        return {
            "success": True,
            "content": {
                "sections": sections,
                "summary": f"Review the material above, focusing on the concepts you missed. When you feel ready, try the quiz again."
            }
        }

    def generate_remedial_questions(self, topic_info: dict, weak_concepts: list,
                                     mistake_details: list, proficiency_level: str = "beginner",
                                     attempt_number: int = 2, num_questions: int = 2):
        """Generate targeted practice questions for weak areas."""
        search_query = " ".join([wc.get("concept", "") for wc in weak_concepts[:5]])
        docs = get_relevant_context(search_query, k=5) if search_query else []
        book_content = "\n\n".join(docs)[:3000] if docs else ""

        mistakes_str = "\n".join([
            f"- {m.get('concept', 'unknown')}: answered '{m.get('user_said', m.get('user_answer', 'N/A'))}' "
            f"instead of '{m.get('correct_was', m.get('correct_answer', 'N/A'))}' "
            f"({m.get('what_went_wrong', m.get('error_type', 'unknown'))})"
            for m in mistake_details
        ]) if mistake_details else "No specific details."

        if self.model:
            try:
                prompt = ChatPromptTemplate.from_template(self.remedial_questions_template)
                chain = prompt | self.model

                result = chain.invoke({
                    "topic_title": topic_info.get("title", "Unknown"),
                    "weak_concepts": ", ".join([wc.get("concept", "") for wc in weak_concepts]),
                    "mistake_details": mistakes_str,
                    "proficiency_level": proficiency_level,
                    "attempt_number": attempt_number,
                    "book_content": book_content,
                    "num_questions": num_questions,
                })

                response_text = result.content.strip()

                # Parse JSON
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                if json_match:
                    cleaned = json_match.group()
                    cleaned = re.sub(r'[\x00-\x1f]', lambda m: {
                        '\n': '\\n', '\r': '\\r', '\t': '\\t'
                    }.get(m.group(), ''), cleaned)
                    try:
                        parsed = json.loads(cleaned)
                        questions = parsed.get("questions", [])
                        for q in questions:
                            ca = q.get("correctAnswer")
                            if isinstance(ca, str):
                                mapping = {"A": 0, "B": 1, "C": 2, "D": 3}
                                q["correctAnswer"] = mapping.get(ca.upper().strip(), 0)
                        return {"success": True, "questions": questions}
                    except json.JSONDecodeError:
                        pass

            except Exception as e:
                print(f"⚠️ LLM remedial question generation failed: {e}, using fallback")

        # Fallback: build questions from mistake details
        return self._build_fallback_questions(topic_info, weak_concepts, mistake_details, num_questions)

    def _build_fallback_questions(self, topic_info, weak_concepts, mistake_details, num_questions):
        """Build remedial questions from mistake details when LLM is unavailable."""
        questions = []
        topic_title = topic_info.get("title", "Java")

        for i, m in enumerate(mistake_details[:num_questions]):
            concept = m.get('concept', 'Java concept')
            question_text = m.get('question_text', '')
            correct = m.get('correct_was', m.get('correct_answer', ''))
            user_said = m.get('user_said', m.get('user_answer', ''))

            if question_text and correct:
                # Re-ask the same question they got wrong
                options = m.get('options', [])
                correct_idx = 0
                if options:
                    for idx, opt in enumerate(options):
                        if str(opt).strip() == str(correct).strip():
                            correct_idx = idx
                            break
                    questions.append({
                        "question": f"[Review] {question_text}",
                        "options": options,
                        "correctAnswer": correct_idx,
                        "concept_tags": [concept],
                        "explanation": f"The correct answer is \"{correct}\". Review this concept carefully.",
                        "difficulty": "medium"
                    })
                else:
                    # No options stored — create a true/false style question
                    questions.append({
                        "question": f"True or False: Regarding {concept} in {topic_title}, the correct answer to \"{question_text}\" is \"{correct}\".",
                        "options": ["True", "False", f"The answer is {user_said}", "None of the above"],
                        "correctAnswer": 0,
                        "concept_tags": [concept],
                        "explanation": f"Yes, the correct answer is \"{correct}\".",
                        "difficulty": "medium"
                    })

        if not questions:
            # Generic fallback
            for wc in weak_concepts[:num_questions]:
                concept = wc.get('concept', 'Java')
                questions.append({
                    "question": f"Which of the following best describes {concept} in Java?",
                    "options": [
                        f"{concept} is a core Java concept",
                        f"{concept} is not used in Java",
                        f"{concept} only applies to Python",
                        f"{concept} is deprecated in Java"
                    ],
                    "correctAnswer": 0,
                    "concept_tags": [concept],
                    "explanation": f"{concept} is an important Java concept that you should review.",
                    "difficulty": "easy"
                })

        return {"success": True, "questions": questions}
