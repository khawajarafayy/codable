# 🎓 Java Learning Assistant

An intelligent, personalized Java programming learning system powered by AI, MongoDB, and Retrieval-Augmented Generation (RAG).

## ✨ Features

- **🔐 User Authentication**: Secure registration and login with MongoDB
- **📊 Personalized Learning**: Adapts to your skill level (beginner/intermediate/advanced)
- **🤖 AI-Powered Questions**: Generates custom practice questions based on your interests
- **💡 Intelligent Tutoring**: Provides skill-appropriate answers using RAG
- **📈 Progress Tracking**: Monitor your learning journey and statistics
- **📚 Book-Grounded**: Uses "Introduction to Java Programming" by Liang as knowledge base

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| **LLM** | Groq (Llama 3.3-70b-versatile) |
| **Embeddings** | Hugging Face (sentence-transformers/all-MiniLM-L6-v2) |
| **Vector DB** | ChromaDB |
| **Database** | MongoDB |
| **Framework** | LangChain |
| **Security** | bcrypt (password hashing) |

## 📋 Prerequisites

1. **Python 3.8+**
2. **MongoDB** (local or MongoDB Atlas)
3. **Groq API Key** (free tier available)

## 🚀 Installation

### 1. Clone/Download the Project
```powershell
cd C:\Users\rafay\Desktop\rag
```

### 2. Activate Virtual Environment
```powershell
& .\new_env\Scripts\Activate.ps1
```

### 3. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 4. Set Up MongoDB

**Option A: Local MongoDB**
- Download from [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- Install and start MongoDB service
- Default connection: `mongodb://localhost:27017/`

**Option B: MongoDB Atlas (Cloud - Recommended)**
1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Update `.env` file

### 5. Configure Environment Variables

Edit `.env` file:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/
# Or for Atlas: mongodb+srv://username:password@cluster.mongodb.net/

# Groq API Key (get from https://console.groq.com/keys)
GROQ_API_KEY=your_groq_api_key_here
```

### 6. Create Vector Database (if not already done)
```powershell
python vector.py
```

## 🎮 Usage

### Start the Application
```powershell
python main_app.py
```

### First Time Users

1. **Register**
   - Choose username and password
   - Select skill level (beginner/intermediate/advanced)
   - Pick topics of interest

2. **Login**
   - Use your credentials

3. **Explore Features**
   - Generate personalized practice questions
   - Ask Java questions and get AI answers
   - Track your learning progress
   - Update your profile as you improve

## 📊 User Data Structure

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "skill_level": "beginner",
  "topics_of_interest": ["loops", "arrays", "OOP"],
  "completed_topics": ["variables", "data types"],
  "learning_progress": {
    "loops": 85,
    "arrays": 70
  },
  "total_questions_attempted": 25,
  "total_questions_correct": 20,
  "created_at": "2025-11-25T10:00:00",
  "last_login": "2025-11-25T14:30:00"
}
```

## 🎯 How It Works

### 1. User Authentication Flow
```
Registration → MongoDB Storage (bcrypt hashing) → Profile Creation
Login → Credential Verification → Session Management
```

### 2. Question Generation Flow
```
User Profile + Topics → Vector DB Search → Relevant Book Content
→ Groq AI → Personalized Questions (skill-appropriate)
```

### 3. Answer Flow
```
User Question → Semantic Search → Top 3-5 Book Sections
→ Groq AI + User Context → Personalized Answer
```

## 📁 Project Structure

```
rag/
├── main_app.py                    # Main application with MongoDB integration
├── user_model.py                  # MongoDB user operations
├── question_generator.py          # AI question/answer generation
├── config.py                      # Configuration management
├── vector.py                      # Vector database operations
├── .env                           # Environment variables
├── requirements.txt               # Python dependencies
├── chroma_db/                     # Vector database storage
└── Introduction_to_Java_Programming_Comprehensive_Version_Liang.csv
```

## 🎨 User Interface

### Main Dashboard
```
🎓 Welcome, JOHN_DOE!
══════════════════════════════════════════════════════════════════════
📊 Skill Level: Intermediate
📚 Topics of Interest: loops, arrays, OOP
✅ Completed Topics: 3
📈 Questions Attempted: 25
🎯 Accuracy: 80.0%
══════════════════════════════════════════════════════════════════════

🎯 MAIN MENU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 📝 Generate Practice Questions
2. 💭 Ask a Java Question
3. 📊 View Learning Progress
4. ⚙️  Update Profile
5. 🚪 Logout
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🔒 Security Features

- ✅ **Password Hashing**: bcrypt with 12 rounds
- ✅ **No Plain Text Storage**: Passwords never stored in plain text
- ✅ **Environment Variables**: API keys and sensitive data in `.env`
- ✅ **Input Validation**: Email, username, password validation
- ✅ **Unique Constraints**: Username and email uniqueness enforced

## 📊 API Rate Limits

### Groq (Free Tier)
- **Daily**: 14,400 requests
- **Per Minute**: 30 requests
- **Tokens**: 8,192 max per request

### Hugging Face Embeddings
- **Unlimited**: Local processing, no API calls
- **Free Forever**: No charges or quotas

## 🐛 Troubleshooting

### MongoDB Connection Issues
```
❌ MongoDB connection error
```
**Solution**: 
- Check MongoDB is running: `mongod --version`
- Verify connection string in `.env`
- For Atlas: Check network access whitelist

### Import Errors
```
ModuleNotFoundError: No module named 'pymongo'
```
**Solution**: 
```powershell
pip install -r requirements.txt
```

### Groq API Errors
```
Error: Invalid API key
```
**Solution**: 
- Get new key from https://console.groq.com/keys
- Update `GROQ_API_KEY` in `.env`

### Vector Database Missing
```
No relevant content found
```
**Solution**: 
```powershell
python vector.py  # Recreate vector database
```

## 📈 Performance

- **Question Generation**: 3-5 seconds
- **Answer Generation**: 2-4 seconds
- **Vector Search**: <100ms
- **MongoDB Queries**: <50ms

## 🎓 Skill Levels Explained

### Beginner
- Focus: Syntax, basic concepts, simple examples
- Topics: Variables, data types, operators, control flow
- Questions: Step-by-step, heavily guided

### Intermediate
- Focus: OOP, data structures, error handling
- Topics: Classes, inheritance, collections, exceptions
- Questions: Practical scenarios, code analysis

### Advanced
- Focus: Design patterns, algorithms, optimization
- Topics: Multithreading, streams, advanced OOP
- Questions: Complex problems, architecture decisions

## 🤝 Contributing

This is a learning project. Feel free to:
- Add more topics
- Improve prompts
- Enhance UI
- Add new features

## 📝 License

Educational project - free to use and modify

## 🙏 Acknowledgments

- **Book**: "Introduction to Java Programming" by Y. Daniel Liang
- **LLM**: Groq (fast inference)
- **Embeddings**: Hugging Face Transformers
- **Framework**: LangChain

## 📞 Support

For issues:
1. Check MongoDB connection
2. Verify Groq API key
3. Ensure virtual environment is activated
4. Check dependencies are installed

---

**Built with ❤️ for Java learners**
