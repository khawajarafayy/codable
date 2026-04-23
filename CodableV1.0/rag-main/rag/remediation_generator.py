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
import os


def _create_mistral_model():
    """Create Mistral model, return None if unavailable."""
    try:
        from langchain_mistralai import ChatMistralAI
        return ChatMistralAI(
            model="mistral-large-latest",
            mistral_api_key=MISTRAL_API_KEY,
            temperature=0.4,
            max_tokens=8192
        )
    except Exception as e:
        print(f"⚠️ Could not initialize Mistral for RemediationGenerator: {e}")
        return None


def _load_topic_content(topic_id: str) -> dict:
    """Load topic content from generated_content JSON files."""
    try:
        # Try to load the topic file
        content_dir = os.path.join(os.path.dirname(__file__), 'generated_content')
        topic_file = os.path.join(content_dir, f'topic_{topic_id}.json')
        
        if os.path.exists(topic_file):
            with open(topic_file, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"⚠️ Could not load topic file for {topic_id}: {e}")
    return None


def _extract_topic_explanation(topic_data: dict) -> str:
    """Extract the explanation content from topic data."""
    if not topic_data or 'sections' not in topic_data:
        return ""
    
    explanations = []
    for section in topic_data.get('sections', []):
        section_type = section.get('type', '')
        content = section.get('content', '')
        
        # Get explanation and introduction sections
        if section_type in ['explanation', 'introduction'] and content:
            explanations.append(content)
        
        # Also get key points
        if section_type == 'keypoints':
            points = section.get('points', [])
            if points:
                explanations.append("Key Points:\n• " + "\n• ".join(points))
    
    return "\n\n".join(explanations)


class RemediationGenerator:
    def __init__(self):
        self.model = _create_mistral_model()

        self.remedial_content_template = """You are an AI tutor generating a remediation lesson.

A student answered a multiple choice question incorrectly.
Your job is to help the student understand the concept by explaining the correct idea clearly.

You MUST use the provided topic explanation as your main teaching material.
Do NOT invent generic programming explanations.

IMPORTANT RULES:
- Do NOT say things like "this concept is important" or "don't worry".
- Do NOT repeat the question multiple times.
- Do NOT generate vague statements.
- Use the provided topic explanation as the main teaching material.
- Expand the explanation so the student clearly understands the concept.
- If two concepts are confused, explain their difference clearly.

INPUT DATA:

Topic: {topic_title}

TOPIC EXPLANATION (use this as your main teaching material):
{topic_explanation}

STUDENT'S MISTAKE:
{mistake_details}

ADDITIONAL CONTEXT:
{book_content}

Create the remediation lesson using these sections:

1. What Went Wrong - Explain briefly why the student's answer is incorrect.
2. Concept Explanation - Rewrite and expand the topic explanation so the student understands it clearly.
3. Concept Comparison - Explain the difference between the correct answer and the student's answer.
4. Example - Provide a simple real-world or programming example that illustrates the concept.
5. Key Points - Provide 3-5 short bullet points summarizing the concept.

Return ONLY valid JSON in this exact format:

{{
  "whatWentWrong": "Brief explanation of why their answer was wrong",
  "conceptExplanation": "Expanded explanation of the concept using the topic explanation provided. At least 3-4 sentences.",
  "conceptComparison": "Clear comparison between correct answer and student's wrong answer",
  "example": "A practical example or code snippet demonstrating the concept",
  "keyPoints": ["Point 1", "Point 2", "Point 3"]
}}

RULES:
1. conceptExplanation must be based on the TOPIC EXPLANATION provided above
2. keyPoints must contain 3-5 specific items
3. Return ONLY valid JSON, no markdown fences
4. All content must be specific to the student's misunderstanding"""

        self.remedial_questions_template = """You are a Java tutor creating follow-up questions to check if the student understood the remediation lesson.

TOPIC: {topic_title}

THE REMEDIATION LESSON THE STUDENT JUST READ:
{remediation_content}

THE STUDENT'S ORIGINAL MISTAKE:
{mistake_details}

YOUR TASK: Create {num_questions} multiple-choice questions that TEST whether the student understood the concept explained in the remediation lesson above.

CRITICAL RULES:
- Questions must directly test understanding of the remediation content
- Use similar examples or scenarios from the remediation lesson
- Questions should be slightly easier than the original quiz
- DO NOT create generic questions like "Which statement about X is true?"
- Create SPECIFIC questions that check actual understanding
- NEVER reveal the answer in the option text itself (no "The correct answer is..." in options)
- All 4 options should look like plausible answers - do not make wrong options obviously wrong
- Wrong options should be reasonable distractors, not absurd statements

Return ONLY this JSON:
{{
  "questions": [
    {{
      "id": "rq1",
      "type": "multiple_choice",
      "concept_tags": ["concept-tag"],
      "difficulty": "easy",
      "question": "A specific question testing the concept from the remediation lesson",
      "options": ["Plausible answer A", "Plausible answer B", "Plausible answer C", "Plausible answer D"],
      "correctAnswer": 0,
      "explanation": "This is correct because [brief explanation based on remediation content]"
    }}
  ]
}}

RULES:
1. Generate exactly {num_questions} questions
2. Questions must relate to what was taught in the remediation lesson
3. correctAnswer is the 0-based index of the correct option
4. All options must be plausible - no option should say "correct answer" or "N/A"
5. Return ONLY valid JSON, no markdown fences"""

    def generate_remedial_content(self, topic_info: dict, weak_concepts: list,
                                   mistake_details: list, proficiency_level: str = "beginner",
                                   attempt_number: int = 2, concept_masteries: dict = None):
        """Generate targeted remedial learning material."""
        
        # 1. Load topic explanation from topic JSON file
        topic_id = topic_info.get('id', '')
        topic_data = _load_topic_content(topic_id) if topic_id else None
        topic_explanation = _extract_topic_explanation(topic_data) if topic_data else ""
        
        # 2. Get additional context from RAG for supplementary material
        search_queries = [f"Java {wc.get('concept', '')} {topic_info.get('title', '')}"
                          for wc in weak_concepts[:3]]
        if not search_queries:
            search_queries = [topic_info.get('title', 'Java programming')]

        all_context = []
        for query in search_queries:
            try:
                docs = get_relevant_context(query, k=5)
                if docs:
                    all_context.extend(docs)
            except Exception:
                pass

        book_content = "\n\n".join(set(all_context))[:4000] if all_context else ""

        # 3. Format mistake details - focus on the first mistake
        if mistake_details:
            m = mistake_details[0]
            mistakes_str = (
                f"Question: {m.get('question_text', 'N/A')}\n"
                f"Student's Answer: {m.get('user_said', m.get('user_answer', 'N/A'))}\n"
                f"Correct Answer: {m.get('correct_was', m.get('correct_answer', 'N/A'))}\n"
                f"Concept: {m.get('concept', 'unknown')}"
            )
        else:
            mistakes_str = "No specific mistake details available."

        # 4. Try LLM generation if model is available
        if self.model:
            try:
                prompt = ChatPromptTemplate.from_template(self.remedial_content_template)
                chain = prompt | self.model

                result = chain.invoke({
                    "topic_title": topic_info.get("title", "Unknown Topic"),
                    "topic_explanation": topic_explanation if topic_explanation else "No topic explanation available.",
                    "mistake_details": mistakes_str,
                    "book_content": book_content,
                })

                response_text = result.content.strip()

                # Remove markdown code fences if present
                if '```' in response_text:
                    response_text = re.sub(r'```json\s*', '', response_text)
                    response_text = re.sub(r'```\s*', '', response_text)
                    response_text = response_text.strip()

                # Extract JSON object
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                if json_match:
                    json_str = json_match.group()
                    json_str = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', json_str)
                    
                    try:
                        parsed = json.loads(json_str)
                        return {"success": True, "content": parsed}
                    except json.JSONDecodeError as e:
                        print(f"⚠️ JSON parse error: {e}")
                        print(f"Attempted to parse: {json_str[:500]}...")

                print("⚠️ Could not parse JSON, using fallback")
                return self._build_fallback_content(topic_info, weak_concepts, mistake_details, topic_explanation, book_content)

            except Exception as e:
                print(f"⚠️ LLM remedial content generation failed: {e}, using fallback")

        # Fallback: build content from topic explanation + RAG context
        return self._build_fallback_content(topic_info, weak_concepts, mistake_details, topic_explanation, book_content)

    def _build_fallback_content(self, topic_info, weak_concepts, mistake_details, topic_explanation, book_content):
        """Build remedial content when LLM is unavailable.
        Uses structure: whatWentWrong, conceptExplanation, conceptComparison, example, keyPoints.
        """
        topic_title = topic_info.get("title", "this topic")
        
        # Get first mistake details
        if mistake_details:
            m = mistake_details[0]
            concept = m.get('concept', 'Unknown concept')
            user_said = m.get('user_said', m.get('user_answer', 'N/A'))
            correct_was = m.get('correct_was', m.get('correct_answer', 'N/A'))
            question_text = m.get('question_text', '')
        else:
            concept = weak_concepts[0].get('concept', 'Unknown') if weak_concepts else topic_title
            user_said = "N/A"
            correct_was = "N/A"
            question_text = ""

        # 1. What Went Wrong
        what_went_wrong = f"You selected \"{user_said}\" but the correct answer is \"{correct_was}\". "
        what_went_wrong += f"This shows a misunderstanding about {concept}."

        # 2. Concept Explanation - use topic explanation if available
        if topic_explanation and len(topic_explanation) > 100:
            concept_explanation = topic_explanation[:1500]
        elif book_content:
            paragraphs = book_content.split('\n\n')
            relevant = []
            for p in paragraphs:
                p_clean = p.strip()
                if len(p_clean) > 80:
                    relevant.append(p_clean)
                if len(relevant) >= 3:
                    break
            concept_explanation = " ".join(relevant)[:1000] if relevant else ""
        else:
            concept_explanation = ""
        
        if not concept_explanation:
            concept_explanation = f"{concept} is a key concept in Java programming. "
            concept_explanation += f"The correct answer \"{correct_was}\" accurately describes how {concept} works. "
            concept_explanation += f"Understanding this distinction is essential for writing correct Java code."

        # 3. Concept Comparison
        concept_comparison = f"\"{correct_was}\" is correct because it accurately describes {concept}. "
        concept_comparison += f"\"{user_said}\" is incorrect because it does not apply to {concept} in this context."

        # 4. Example
        example = f"When working with {concept} in Java, remember that \"{correct_was}\" is the correct approach. "
        example += f"This ensures your code functions as expected."

        # 5. Key Points
        key_points = [
            f"The correct answer is: {correct_was}",
            f"{concept} works differently than you might have thought",
            "Review the concept explanation above carefully",
            "Practice with more examples to reinforce understanding"
        ]

        return {
            "success": True,
            "content": {
                "whatWentWrong": what_went_wrong,
                "conceptExplanation": concept_explanation,
                "conceptComparison": concept_comparison,
                "example": example,
                "keyPoints": key_points
            }
        }

    def generate_remedial_questions(self, topic_info: dict, weak_concepts: list,
                                     mistake_details: list, remediation_content: dict = None,
                                     num_questions: int = 2):
        """Generate targeted practice questions based on remediation content."""
        
        # Format remediation content for the prompt
        remediation_str = ""
        if remediation_content:
            if isinstance(remediation_content, dict):
                parts = []
                if remediation_content.get('whatWentWrong'):
                    parts.append(f"What Went Wrong: {remediation_content['whatWentWrong']}")
                if remediation_content.get('conceptExplanation'):
                    parts.append(f"Concept Explanation: {remediation_content['conceptExplanation']}")
                if remediation_content.get('conceptComparison'):
                    parts.append(f"Comparison: {remediation_content['conceptComparison']}")
                if remediation_content.get('example'):
                    parts.append(f"Example: {remediation_content['example']}")
                if remediation_content.get('keyPoints'):
                    points = remediation_content['keyPoints']
                    if isinstance(points, list):
                        parts.append("Key Points:\n• " + "\n• ".join(points))
                remediation_str = "\n\n".join(parts)
        
        if not remediation_str:
            remediation_str = "No remediation content available."

        # Format mistake details
        if mistake_details:
            m = mistake_details[0]
            mistakes_str = (
                f"Question: {m.get('question_text', 'N/A')}\n"
                f"Student answered: {m.get('user_said', m.get('user_answer', 'N/A'))}\n"
                f"Correct answer: {m.get('correct_was', m.get('correct_answer', 'N/A'))}\n"
                f"Concept: {m.get('concept', 'unknown')}"
            )
        else:
            mistakes_str = "No specific mistake details."

        if self.model:
            try:
                prompt = ChatPromptTemplate.from_template(self.remedial_questions_template)
                chain = prompt | self.model

                result = chain.invoke({
                    "topic_title": topic_info.get("title", "Unknown Topic"),
                    "remediation_content": remediation_str,
                    "mistake_details": mistakes_str,
                    "num_questions": num_questions,
                })

                response_text = result.content.strip()

                # Remove markdown fences
                if '```' in response_text:
                    response_text = re.sub(r'```json\s*', '', response_text)
                    response_text = re.sub(r'```\s*', '', response_text)
                    response_text = response_text.strip()

                # Parse JSON
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                if json_match:
                    json_str = json_match.group()
                    json_str = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', json_str)
                    
                    try:
                        parsed = json.loads(json_str)
                        questions = parsed.get("questions", [])
                        
                        # Normalize correctAnswer to int index
                        for q in questions:
                            ca = q.get("correctAnswer")
                            if isinstance(ca, str):
                                # Handle "A", "B", "C", "D" format
                                mapping = {"A": 0, "B": 1, "C": 2, "D": 3}
                                q["correctAnswer"] = mapping.get(ca.upper().strip()[0], 0)
                        
                        return {"success": True, "questions": questions}
                    except json.JSONDecodeError as e:
                        print(f"⚠️ JSON parse error in questions: {e}")

            except Exception as e:
                print(f"⚠️ LLM remedial question generation failed: {e}, using fallback")

        # Fallback: build questions from mistake details
        return self._build_fallback_questions(topic_info, weak_concepts, mistake_details, remediation_content, num_questions)

    def _build_fallback_questions(self, topic_info, weak_concepts, mistake_details, remediation_content, num_questions):
        """Build remedial questions from mistake details and remediation content when LLM is unavailable."""
        questions = []
        topic_title = topic_info.get("title", "Java Programming")

        # Extract data from mistake details
        original_question = None
        original_options = []
        correct_answer = ""
        user_answer = ""
        concept = topic_title

        if mistake_details and len(mistake_details) > 0:
            m = mistake_details[0]
            original_question = m.get('question_text', '')
            original_options = m.get('options', [])
            correct_answer = m.get('correct_was', m.get('correct_answer', ''))
            user_answer = m.get('user_said', m.get('user_answer', ''))
            concept = m.get('concept', topic_title)

        # Extract remediation content
        what_went_wrong = ""
        concept_explanation = ""
        key_points = []
        example = ""

        if remediation_content and isinstance(remediation_content, dict):
            what_went_wrong = remediation_content.get('whatWentWrong', '')
            concept_explanation = remediation_content.get('conceptExplanation', '')
            key_points = remediation_content.get('keyPoints', [])
            example = remediation_content.get('example', '')
            if isinstance(key_points, str):
                key_points = [key_points]

        # Question 1: Re-ask the original question they got wrong (slightly reworded)
        if original_question and original_options and len(original_options) >= 4 and correct_answer:
            # Find correct answer index
            correct_idx = 0
            for idx, opt in enumerate(original_options):
                opt_str = str(opt).lower().strip()
                correct_str = str(correct_answer).lower().strip()
                if correct_str in opt_str or opt_str in correct_str:
                    correct_idx = idx
                    break

            questions.append({
                "id": "rq1",
                "type": "multiple_choice",
                "question": f"After reviewing the lesson, answer again: {original_question}",
                "options": original_options,
                "correctAnswer": correct_idx,
                "concept_tags": [concept],
                "explanation": f"The correct answer is \"{correct_answer}\". This was explained in the remediation lesson.",
                "difficulty": "easy"
            })

        # Question 2: Create question from key points if available
        if key_points and len(key_points) >= 2 and num_questions >= 2:
            # Use key points to create meaningful options
            # Shuffle to make it less obvious
            import random
            correct_point = key_points[0]
            
            # Create plausible wrong options by modifying key points or using common misconceptions
            wrong_options = []
            if len(key_points) >= 2:
                # Use other key points but negate or modify them
                for kp in key_points[1:3]:
                    if "is" in kp:
                        wrong_options.append(kp.replace(" is ", " is not ", 1))
                    elif "can" in kp:
                        wrong_options.append(kp.replace(" can ", " cannot ", 1))
                    else:
                        wrong_options.append(f"Unlike {concept}, " + kp.lower())
            
            # Fill remaining wrong options
            while len(wrong_options) < 3:
                wrong_options.append(f"{concept} requires additional configuration to work")
            wrong_options = wrong_options[:3]
            
            all_options = [correct_point] + wrong_options
            random.shuffle(all_options)
            correct_idx = all_options.index(correct_point)

            questions.append({
                "id": "rq2",
                "type": "multiple_choice",
                "question": f"Based on the lesson about {concept}, which statement is accurate?",
                "options": all_options,
                "correctAnswer": correct_idx,
                "concept_tags": [concept],
                "explanation": f"Correct! As explained in the lesson: {correct_point}",
                "difficulty": "easy"
            })

        # Question 3: If we have concept explanation but limited key points
        elif concept_explanation and num_questions >= 2 and correct_answer:
            # Create a question comparing what they thought vs what's correct
            questions.append({
                "id": "rq2",
                "type": "multiple_choice",
                "question": f"What did the lesson clarify about {concept}?",
                "options": [
                    correct_answer,
                    user_answer if user_answer and user_answer != correct_answer else f"A different interpretation of {concept}",
                    f"An alternative approach to {concept}",
                    f"A simplified version of {concept}"
                ],
                "correctAnswer": 0,
                "concept_tags": [concept],
                "explanation": f"The lesson explained that '{correct_answer}' is the correct understanding.",
                "difficulty": "easy"
            })

        # Ensure we have at least one question
        if not questions:
            # Re-ask original question with shuffled options if available
            if correct_answer:
                options = [
                    correct_answer,
                    user_answer if user_answer and user_answer != correct_answer else f"Alternative to {concept}",
                    f"A common misconception about {concept}",
                    f"An unrelated concept"
                ]
                questions.append({
                    "id": "rq1",
                    "type": "multiple_choice",
                    "question": f"After reading the lesson, what is the correct answer about {concept}?",
                    "options": options,
                    "correctAnswer": 0,
                    "concept_tags": [concept],
                    "explanation": f"The lesson explained that '{correct_answer}' is correct.",
                    "difficulty": "easy"
                })

        return {"success": True, "questions": questions}
