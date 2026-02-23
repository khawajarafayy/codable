"""
Java Learning Assistant - Main Application
MongoDB-integrated RAG system with personalized learning
"""
import sys
from user_model import UserDatabase
from question_generator import QuestionGenerator
from config import COMMON_TOPICS, SKILL_LEVELS


class JavaLearningAssistant:
    def __init__(self):
        """Initialize the learning assistant"""
        try:
            print("🚀 Initializing Java Learning Assistant...")
            self.db = UserDatabase()
            self.question_gen = QuestionGenerator()
            self.current_user = None
            print("✅ System ready!")
        except Exception as e:
            print(f"❌ Initialization failed: {e}")
            sys.exit(1)
    
    def display_header(self):
        """Display application header"""
        print("\n" + "=" * 70)
        print("🎓 JAVA PROGRAMMING LEARNING ASSISTANT")
        print("   Powered by Groq AI + MongoDB + RAG")
        print("=" * 70)
    
    def register_user(self):
        """Handle user registration"""
        print("\n" + "━" * 70)
        print("📝 USER REGISTRATION")
        print("━" * 70)
        
        username = input("\n👤 Enter username (min 3 characters): ").strip()
        if not username:
            print("❌ Username cannot be empty")
            return False
        
        email = input("📧 Enter email: ").strip()
        if not email:
            print("❌ Email cannot be empty")
            return False
        
        password = input("🔒 Enter password (min 6 characters): ").strip()
        if not password:
            print("❌ Password cannot be empty")
            return False
        
        # Skill level selection
        print("\n📊 Select your skill level:")
        for i, level in enumerate(SKILL_LEVELS, 1):
            print(f"   {i}. {level.capitalize()}")
        
        skill_choice = input(f"\nEnter choice (1-{len(SKILL_LEVELS)}): ").strip()
        skill_level = SKILL_LEVELS[int(skill_choice) - 1] if skill_choice.isdigit() and 1 <= int(skill_choice) <= len(SKILL_LEVELS) else "beginner"
        
        # Topics of interest
        print("\n📚 Select topics of interest (comma-separated):")
        print("   Examples:", ", ".join(COMMON_TOPICS[:10]))
        print(f"   Or choose from: {', '.join(COMMON_TOPICS)}")
        
        topics_input = input("\n📌 Your topics: ").strip()
        topics_of_interest = [t.strip().lower() for t in topics_input.split(",")] if topics_input else []
        
        # Register user
        result = self.db.register_user(username, email, password, skill_level, topics_of_interest)
        
        if result["success"]:
            print(f"\n✅ Registration successful! Welcome, {username}!")
            print("💡 You can now login with your credentials")
            return True
        else:
            print(f"\n❌ Registration failed: {result['error']}")
            return False
    
    def login_user(self):
        """Handle user login"""
        print("\n" + "━" * 70)
        print("🔐 USER LOGIN")
        print("━" * 70)
        
        username = input("\n👤 Username: ").strip()
        if not username:
            print("❌ Username cannot be empty")
            return False
        
        password = input("🔒 Password: ").strip()
        if not password:
            print("❌ Password cannot be empty")
            return False
        
        result = self.db.authenticate_user(username, password)
        
        if result["success"]:
            self.current_user = result["user"]
            print(f"\n✅ Welcome back, {self.current_user['username']}!")
            return True
        else:
            print(f"\n❌ Login failed: {result['error']}")
            return False
    
    def display_user_dashboard(self):
        """Display user dashboard with stats"""
        stats = self.db.get_user_statistics(self.current_user['username'])
        
        print("\n" + "=" * 70)
        print(f"🎓 Welcome, {self.current_user['username'].upper()}!")
        print("=" * 70)
        print(f"📊 Skill Level: {self.current_user['skill_level'].capitalize()}")
        print(f"📚 Topics of Interest: {', '.join(self.current_user.get('topics_of_interest', ['None']))}")
        print(f"✅ Completed Topics: {len(self.current_user.get('completed_topics', []))}")
        
        if stats:
            print(f"📈 Questions Attempted: {stats['total_attempted']}")
            print(f"🎯 Accuracy: {stats['accuracy']}%")
        
        print("=" * 70)
    
    def generate_questions_menu(self):
        """Menu for generating practice questions"""
        print("\n" + "━" * 70)
        print("📝 GENERATE PRACTICE QUESTIONS")
        print("━" * 70)
        
        print("\n1. Use my topics of interest")
        print("2. Specify a custom topic")
        
        choice = input("\nEnter choice (1-2): ").strip()
        
        topic = None
        if choice == "2":
            topic = input("📌 Enter topic: ").strip()
        
        num_input = input("🔢 How many questions? (1-10, default: 5): ").strip()
        num_questions = int(num_input) if num_input.isdigit() and 1 <= int(num_input) <= 10 else 5
        
        print(f"\n⏳ Generating {num_questions} personalized questions...")
        
        result = self.question_gen.generate_questions(self.current_user, topic, num_questions)
        
        if result["success"]:
            print("\n" + "=" * 70)
            print("📝 YOUR PERSONALIZED QUESTIONS")
            print("=" * 70)
            print(result["questions"])
            print("\n" + "=" * 70)
            
            # Update stats
            self.db.increment_question_stats(self.current_user['username'], attempted=num_questions)
        else:
            print(f"\n❌ Error: {result['error']}")
    
    def ask_question_menu(self):
        """Menu for asking a Java question"""
        print("\n" + "━" * 70)
        print("💭 ASK A JAVA QUESTION")
        print("━" * 70)
        
        question = input("\n❓ Your question: ").strip()
        
        if not question:
            print("❌ Question cannot be empty")
            return
        
        result = self.question_gen.answer_question(self.current_user, question)
        
        if result["success"]:
            print("\n" + "=" * 70)
            print("💡 ANSWER")
            print("=" * 70)
            print(result["answer"])
            print("\n" + "=" * 70)
            
            # Ask for feedback
            helpful = input("\n👍 Was this answer helpful? (y/n): ").strip().lower()
            if helpful == 'y':
                print("✅ Great! Keep learning!")
        else:
            print(f"\n❌ Error: {result['error']}")
    
    def view_progress_menu(self):
        """Display learning progress"""
        print("\n" + "━" * 70)
        print("📊 LEARNING PROGRESS")
        print("━" * 70)
        
        stats = self.db.get_user_statistics(self.current_user['username'])
        
        if stats:
            print(f"\n📈 Total Questions Attempted: {stats['total_attempted']}")
            print(f"✅ Total Correct: {stats['total_correct']}")
            print(f"🎯 Accuracy: {stats['accuracy']}%")
            print(f"📚 Completed Topics: {stats['completed_topics']}")
            print(f"📖 Topics in Progress: {stats['topics_in_progress']}")
        
        print("\n✅ Completed Topics:")
        completed = self.current_user.get('completed_topics', [])
        if completed:
            for topic in completed:
                print(f"   • {topic}")
        else:
            print("   (No topics completed yet)")
        
        print("\n📊 Learning Progress by Topic:")
        progress = self.current_user.get('learning_progress', {})
        if progress:
            for topic, score in progress.items():
                bar = "█" * int(score / 10) + "░" * (10 - int(score / 10))
                print(f"   {topic:20} [{bar}] {score}%")
        else:
            print("   (No progress recorded yet)")
    
    def update_profile_menu(self):
        """Update user profile"""
        print("\n" + "━" * 70)
        print("⚙️  UPDATE PROFILE")
        print("━" * 70)
        
        print("\n1. Change skill level")
        print("2. Update topics of interest")
        print("3. Back to main menu")
        
        choice = input("\nEnter choice (1-3): ").strip()
        
        if choice == "1":
            print("\n📊 Select new skill level:")
            for i, level in enumerate(SKILL_LEVELS, 1):
                current = " (current)" if level == self.current_user['skill_level'] else ""
                print(f"   {i}. {level.capitalize()}{current}")
            
            skill_choice = input(f"\nEnter choice (1-{len(SKILL_LEVELS)}): ").strip()
            
            if skill_choice.isdigit() and 1 <= int(skill_choice) <= len(SKILL_LEVELS):
                new_skill = SKILL_LEVELS[int(skill_choice) - 1]
                result = self.db.update_skill_level(self.current_user['username'], new_skill)
                
                if result["success"]:
                    self.current_user['skill_level'] = new_skill
                    print(f"✅ Skill level updated to {new_skill}!")
                else:
                    print("❌ Failed to update skill level")
        
        elif choice == "2":
            print("\n📚 Current topics:", ", ".join(self.current_user.get('topics_of_interest', [])))
            print(f"\n💡 Suggested topics: {', '.join(COMMON_TOPICS[:15])}")
            
            topics_input = input("\n📌 Enter new topics (comma-separated): ").strip()
            topics = [t.strip().lower() for t in topics_input.split(",")]
            
            result = self.db.update_topics_of_interest(self.current_user['username'], topics)
            
            if result["success"]:
                self.current_user['topics_of_interest'] = topics
                print("✅ Topics updated successfully!")
            else:
                print("❌ Failed to update topics")
    
    def main_menu(self):
        """Display and handle main menu"""
        while True:
            self.display_user_dashboard()
            
            print("\n🎯 MAIN MENU")
            print("━" * 70)
            print("1. 📝 Generate Practice Questions")
            print("2. 💭 Ask a Java Question")
            print("3. 📊 View Learning Progress")
            print("4. ⚙️  Update Profile")
            print("5. 🚪 Logout")
            print("━" * 70)
            
            choice = input("\n👉 Enter your choice (1-5): ").strip()
            
            if choice == "1":
                self.generate_questions_menu()
            elif choice == "2":
                self.ask_question_menu()
            elif choice == "3":
                self.view_progress_menu()
            elif choice == "4":
                self.update_profile_menu()
            elif choice == "5":
                print(f"\n👋 Goodbye, {self.current_user['username']}! Keep learning!")
                self.current_user = None
                break
            else:
                print("\n❌ Invalid choice. Please try again.")
            
            input("\n⏎ Press Enter to continue...")
    
    def run(self):
        """Main application loop"""
        self.display_header()
        
        while True:
            if self.current_user:
                self.main_menu()
            else:
                print("\n🏠 WELCOME")
                print("━" * 70)
                print("1. 🔐 Login")
                print("2. 📝 Register")
                print("3. 🚪 Exit")
                print("━" * 70)
                
                choice = input("\n👉 Enter your choice (1-3): ").strip()
                
                if choice == "1":
                    self.login_user()
                elif choice == "2":
                    self.register_user()
                elif choice == "3":
                    print("\n👋 Thank you for using Java Learning Assistant!")
                    print("💡 Keep coding and learning!")
                    break
                else:
                    print("\n❌ Invalid choice. Please try again.")


def main():
    """Application entry point"""
    try:
        app = JavaLearningAssistant()
        app.run()
    except KeyboardInterrupt:
        print("\n\n👋 Application terminated by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
    finally:
        print("\n🔚 Shutting down...")


if __name__ == "__main__":
    main()
