"""
Personalized Question Generator using AI and RAG
"""
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from vector import get_relevant_context
from config import GROQ_API_KEY, VECTOR_SEARCH_K


class QuestionGenerator:
    def __init__(self):
        """Initialize the question generator with Groq model"""
        self.model = ChatGroq(
            model="llama-3.3-70b-versatile",
            groq_api_key=GROQ_API_KEY,
            temperature=0.3,
            max_tokens=2048
        )
        
        # Template for generating personalized questions
        self.question_template = """
You are an expert Java programming tutor creating personalized practice questions.

USER PROFILE:
- Skill Level: {skill_level}
- Topics of Interest: {topics_of_interest}
- Completed Topics: {completed_topics}
- Current Progress: {learning_progress}

RELEVANT BOOK CONTENT:
{book_content}

TASK:
Generate {num_questions} Java programming questions that are:
1. Appropriate for a {skill_level} level programmer
2. Focused on these topics: {focus_topics}
3. Based on the book content provided above
4. Progressive in difficulty
5. Varied in type (multiple choice, code completion, debugging, concept explanation)

DIFFICULTY GUIDELINES:
- Beginner: Focus on syntax, basic concepts, simple examples, step-by-step explanations
- Intermediate: Include OOP principles, data structures, error handling, code analysis
- Advanced: Complex algorithms, design patterns, optimization, architecture decisions

FORMAT EACH QUESTION AS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Question [Number]: [Type] | Difficulty: [Easy/Medium/Hard]
Topic: [Topic Name]

[Question Text]

[Options if multiple choice, or code snippet if applicable]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate the questions now:
"""
        
        # Template for providing personalized answers
        self.answer_template = """
You are an expert Java programming tutor helping a {skill_level} level student.

USER PROFILE:
- Skill Level: {skill_level}
- Learning Focus: {topics_of_interest}
- Completed Topics: {completed_topics}

RELEVANT BOOK CONTENT:
{book_content}

STUDENT'S QUESTION:
{question}

TASK:
Provide a clear, educational answer that:
1. Is appropriate for their {skill_level} level
2. Uses content from the book provided above
3. Explains concepts clearly with examples
4. Includes code snippets when helpful
5. Suggests related topics to explore next

RESPONSE STYLE BY LEVEL:
- Beginner: Simple language, step-by-step explanations, basic examples
- Intermediate: Technical terms with explanations, practical examples, best practices
- Advanced: Concise, technical depth, design considerations, performance implications

Provide your answer now:
"""
    
    def generate_questions(self, user_profile, topic=None, num_questions=5):
        """Generate personalized questions based on user profile"""
        try:
            # Determine search query
            if topic:
                search_query = topic
                focus_topics = topic
            elif user_profile.get('topics_of_interest'):
                focus_topics = ", ".join(user_profile['topics_of_interest'])
                search_query = focus_topics
            else:
                skill = user_profile.get('skill_level', 'beginner')
                search_query = f"Java {skill} programming concepts"
                focus_topics = "Java fundamentals"
            
            # Get relevant content from vector database
            print(f"🔍 Searching for content related to: {search_query}")
            relevant_content = get_relevant_context(search_query, k=VECTOR_SEARCH_K)
            
            if not relevant_content:
                return {
                    "success": False,
                    "error": "Unable to find relevant content in the book"
                }
            
            print(f"📚 Found {len(relevant_content)} relevant sections")
            book_content = "\n\n".join(relevant_content)
            
            # Format learning progress
            progress = user_profile.get('learning_progress', {})
            progress_str = ", ".join([f"{k}: {v}%" for k, v in progress.items()]) if progress else "No progress yet"
            
            # Create prompt
            prompt = ChatPromptTemplate.from_template(self.question_template)
            chain = prompt | self.model
            
            print("🤖 Generating personalized questions...")
            
            # Generate questions
            result = chain.invoke({
                "skill_level": user_profile.get('skill_level', 'beginner'),
                "topics_of_interest": ", ".join(user_profile.get('topics_of_interest', ['Java basics'])),
                "completed_topics": ", ".join(user_profile.get('completed_topics', [])) or "None",
                "learning_progress": progress_str,
                "book_content": book_content[:3000],  # Limit context size
                "num_questions": num_questions,
                "focus_topics": focus_topics
            })
            
            return {
                "success": True,
                "questions": result.content,
                "topic": focus_topics
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Question generation failed: {str(e)}"
            }
    
    def answer_question(self, user_profile, question):
        """Provide personalized answer to user's question"""
        try:
            print(f"🔍 Searching for relevant content...")
            
            # Get relevant content from vector database
            relevant_content = get_relevant_context(question, k=3)
            
            if not relevant_content:
                return {
                    "success": False,
                    "error": "Unable to find relevant information in the book"
                }
            
            print(f"📚 Found {len(relevant_content)} relevant sections")
            book_content = "\n\n".join(relevant_content)
            
            # Create prompt
            prompt = ChatPromptTemplate.from_template(self.answer_template)
            chain = prompt | self.model
            
            print("🤖 Generating personalized answer...")
            
            # Generate answer
            result = chain.invoke({
                "skill_level": user_profile.get('skill_level', 'beginner'),
                "topics_of_interest": ", ".join(user_profile.get('topics_of_interest', ['Java basics'])),
                "completed_topics": ", ".join(user_profile.get('completed_topics', [])) or "None",
                "book_content": book_content,
                "question": question
            })
            
            return {
                "success": True,
                "answer": result.content
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"Answer generation failed: {str(e)}"
            }
