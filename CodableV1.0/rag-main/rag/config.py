"""
Configuration management for Java Learning Assistant
"""
import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from this package directory (rag/) and parent, regardless of cwd
_rag_dir = Path(__file__).resolve().parent
load_dotenv(_rag_dir / ".env")
load_dotenv(_rag_dir.parent / ".env")
load_dotenv()

# MongoDB Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "java_learning_app")
USERS_COLLECTION = "users"

# Groq API Configuration (strip whitespace / quotes — common .env mistakes)
# Accept GROK_API_KEY typo some .env files use
_raw_groq = (
    os.getenv("GROQ_API_KEY") or os.getenv("GROK_API_KEY") or ""
).strip().strip('"').strip("'")
GROQ_API_KEY = _raw_groq if _raw_groq else None

# Mistral API Configuration
_raw_mistral = (os.getenv("MISTRAL_API_KEY") or "").strip().strip('"').strip("'")
MISTRAL_API_KEY = _raw_mistral if _raw_mistral else None

# Application Settings
MAX_QUESTIONS_PER_REQUEST = 10
DEFAULT_QUESTIONS_COUNT = 5
VECTOR_SEARCH_K = 5  # Number of relevant chunks to retrieve

# Skill Levels
SKILL_LEVELS = ["beginner", "intermediate", "advanced"]

# Common Java Topics
COMMON_TOPICS = [
    "variables", "data types", "operators", "control flow",
    "loops", "arrays", "methods", "classes", "objects",
    "inheritance", "polymorphism", "encapsulation", "abstraction",
    "interfaces", "exceptions", "collections", "generics",
    "streams", "file I/O", "multithreading", "lambda expressions"
]
