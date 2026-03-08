"""
Generate Chapter Practice Questions
Pre-generates 5 practice questions per chapter (medium and hard difficulty).
Questions are stored in generated_content/chapter_X_practice.json
"""
import os
import sys
import json
import time

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from vector import get_relevant_context, load_existing_vector_store
from config import GROQ_API_KEY

# Import CHAPTER_TOPICS from api
from api import CHAPTER_TOPICS

GENERATED_CONTENT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_content")


def generate_chapter_questions(chapter_id, chapter_title, topics, num_questions=5):
    """Generate practice questions for a chapter with medium/hard difficulty"""
    
    model = ChatGroq(
        model="llama-3.3-70b-versatile",
        groq_api_key=GROQ_API_KEY,
        temperature=0.4,
        max_tokens=8192
    )
    
    # Build topics summary
    topics_summary = '\n'.join([f"- {t['title']}: {t['description']}" for t in topics])
    all_keywords = []
    for topic in topics:
        all_keywords.extend(topic.get('keywords', []))
    keywords_str = ', '.join(list(set(all_keywords))[:40])
    
    # Get relevant content from the book
    combined_query = f"{chapter_title} {keywords_str}"
    relevant_content = get_relevant_context(combined_query, k=8)
    book_context = '\n\n'.join(relevant_content) if relevant_content else ''
    
    prompt_template = """You are an expert Java programming instructor creating comprehensive practice questions for students who have completed a chapter.

CHAPTER {chapter_id}: {chapter_title}

TOPICS COVERED IN THIS CHAPTER:
{topics_summary}

KEY CONCEPTS: {keywords}

RELEVANT BOOK CONTENT:
{book_context}

YOUR TASK: Generate exactly {num_questions} Java coding practice questions that thoroughly test the student's understanding of this chapter.

DIFFICULTY DISTRIBUTION:
- 2-3 questions should be MEDIUM difficulty
- 2-3 questions should be HARD difficulty
- NO easy questions - these are for students who have completed all topics

QUESTION REQUIREMENTS:
1. Each question must focus on different concepts from the chapter
2. Questions should be practical coding exercises that require writing actual Java code
3. Include clear expected outputs that can be verified
4. Questions should progressively build on chapter concepts
5. Hard questions should combine multiple concepts from the chapter

Generate exactly {num_questions} questions as a JSON array:

[
  {{
    "id": 1,
    "title": "Clear descriptive title",
    "topic": "Primary topic this tests",
    "difficulty": "medium",
    "description": "Detailed problem description. Explain what the student needs to code, what input to handle (if any), and what output to produce.",
    "constraints": ["constraint 1", "constraint 2", "constraint 3"],
    "examples": [
      {{"input": "example input if applicable", "output": "exact expected output"}}
    ],
    "hints": ["helpful hint 1", "helpful hint 2", "helpful hint 3"],
    "starterCode": "public class Solution {{\\n    public static void main(String[] args) {{\\n        // Your code here\\n    }}\\n}}",
    "expectedOutput": "The EXACT expected console output",
    "testCases": [
      {{"input": "", "expectedOutput": "exact output line 1\\nexact output line 2"}}
    ],
    "solutionKeywords": ["keyword1", "keyword2"],
    "mustContain": ["required code pattern"],
    "mustNotContain": [],
    "conceptsTested": ["concept1", "concept2"]
  }}
]

DIFFICULTY GUIDELINES:
- MEDIUM: Apply concepts with some complexity, require understanding of multiple aspects
- HARD: Combine multiple chapter concepts, require problem-solving skills, handle edge cases

IMPORTANT:
- Return ONLY valid JSON array
- Do NOT include any text before or after the JSON
- expectedOutput must be EXACT text that will appear in console
- Questions should be solvable using ONLY concepts from this chapter
"""
    
    prompt = ChatPromptTemplate.from_template(prompt_template)
    chain = prompt | model
    
    print(f"  🤖 Generating questions for Chapter {chapter_id}...")
    
    result = chain.invoke({
        "chapter_id": chapter_id,
        "chapter_title": chapter_title,
        "topics_summary": topics_summary,
        "keywords": keywords_str,
        "num_questions": num_questions,
        "book_context": book_context[:4000]
    })
    
    response_text = result.content.strip()
    
    # Parse JSON
    try:
        if response_text.startswith('```'):
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
        
        questions = json.loads(response_text.strip())
        
        # Validate and ensure proper structure
        for i, q in enumerate(questions):
            q['id'] = i + 1
            if 'difficulty' not in q:
                q['difficulty'] = 'medium' if i < 3 else 'hard'
            if 'conceptsTested' not in q:
                q['conceptsTested'] = [q.get('topic', 'Java')]
        
        return questions
        
    except json.JSONDecodeError as e:
        print(f"  ⚠️ JSON parse error: {e}")
        # Try to extract JSON
        import re
        json_match = re.search(r'\[[\s\S]*\]', response_text)
        if json_match:
            try:
                questions = json.loads(json_match.group())
                return questions
            except:
                pass
        
        # Return fallback
        return generate_fallback_questions(chapter_id, chapter_title, topics, num_questions)


def generate_fallback_questions(chapter_id, chapter_title, topics, num_questions):
    """Fallback questions when AI generation fails"""
    questions = []
    difficulties = ['medium', 'medium', 'hard', 'hard', 'hard']
    
    for i in range(num_questions):
        topic = topics[i % len(topics)]
        questions.append({
            "id": i + 1,
            "title": f"Practice: {topic['title']}",
            "topic": topic['title'],
            "difficulty": difficulties[i] if i < len(difficulties) else 'hard',
            "description": f"Write a Java program that demonstrates your understanding of {topic['title']}. {topic['description']}",
            "constraints": [
                "Your code must compile without errors",
                "Use proper Java syntax and conventions",
                "Include appropriate comments"
            ],
            "examples": [{"input": "", "output": "Your output demonstrating the concept"}],
            "hints": [
                f"Review the key concepts of {topic['title']}",
                "Start with the basic structure and build up",
                "Test your code incrementally"
            ],
            "starterCode": "public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n        \n    }\n}",
            "expectedOutput": "",
            "testCases": [],
            "solutionKeywords": topic.get('keywords', [])[:5],
            "mustContain": ["public class", "public static void main"],
            "mustNotContain": [],
            "conceptsTested": topic.get('concept_tags', [topic['title']])
        })
    
    return questions


def save_chapter_questions(chapter_id, questions):
    """Save questions to JSON file"""
    filepath = os.path.join(GENERATED_CONTENT_DIR, f"chapter_{chapter_id}_practice.json")
    
    data = {
        "chapter_id": chapter_id,
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "num_questions": len(questions),
        "difficulty_distribution": {
            "medium": sum(1 for q in questions if q.get('difficulty') == 'medium'),
            "hard": sum(1 for q in questions if q.get('difficulty') == 'hard')
        },
        "questions": questions
    }
    
    os.makedirs(GENERATED_CONTENT_DIR, exist_ok=True)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"  ✅ Saved to {filepath}")
    return filepath


def main():
    """Generate practice questions for all chapters"""
    print("=" * 60)
    print("📚 Chapter Practice Question Generator")
    print("=" * 60)
    
    # Load vector store first
    print("\n🔄 Loading vector store...")
    try:
        load_existing_vector_store()
        print("✅ Vector store loaded")
    except Exception as e:
        print(f"⚠️ Warning: {e}")
    
    total_chapters = len(CHAPTER_TOPICS)
    generated = 0
    failed = 0
    
    for chapter_id, chapter_data in sorted(CHAPTER_TOPICS.items()):
        print(f"\n📖 Chapter {chapter_id}: {chapter_data['title']}")
        print(f"   Topics: {len(chapter_data['topics'])}")
        
        try:
            questions = generate_chapter_questions(
                chapter_id=chapter_id,
                chapter_title=chapter_data['title'],
                topics=chapter_data['topics'],
                num_questions=5
            )
            
            if questions:
                save_chapter_questions(chapter_id, questions)
                generated += 1
                print(f"   ✅ Generated {len(questions)} questions")
            else:
                failed += 1
                print(f"   ❌ Failed to generate questions")
            
            # Rate limiting - avoid hitting API limits
            time.sleep(2)
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"📊 Summary: {generated}/{total_chapters} chapters generated")
    if failed > 0:
        print(f"   ⚠️ {failed} chapters failed")
    print("=" * 60)


if __name__ == "__main__":
    main()
