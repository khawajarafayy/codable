"""
Configuration management for Java Learning Assistant
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "java_learning_app")
USERS_COLLECTION = "users"

# Groq API Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Mistral API Configuration
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

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
