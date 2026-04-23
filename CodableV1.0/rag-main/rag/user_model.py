"""
MongoDB User Model and Database Operations
"""
from pymongo import MongoClient, ASCENDING
import bcrypt
from datetime import datetime
from config import MONGODB_URI, DATABASE_NAME, USERS_COLLECTION
import re


class UserDatabase:
    def __init__(self):
        """Initialize MongoDB connection"""
        try:
            self.client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
            # Test connection
            self.client.server_info()
            self.db = self.client[DATABASE_NAME]
            self.users = self.db[USERS_COLLECTION]
            self._create_indexes()
            print("✅ Connected to MongoDB successfully")
        except Exception as e:
            print(f"❌ MongoDB connection error: {e}")
            print("💡 Make sure MongoDB is running or check your connection string")
            raise
    
    def _create_indexes(self):
        """Create indexes for better performance"""
        try:
            self.users.create_index([("username", ASCENDING)], unique=True)
            self.users.create_index([("email", ASCENDING)], unique=True)
        except Exception as e:
            print(f"⚠️  Index creation warning: {e}")
    
    def _validate_email(self, email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def _hash_password(self, password):
        """Hash password using bcrypt"""
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12))
    
    def _verify_password(self, password, hashed):
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed)
    
    def register_user(self, username, email, password, skill_level="beginner", topics_of_interest=None):
        """Register a new user"""
        try:
            # Validation
            if not username or len(username) < 3:
                return {"success": False, "error": "Username must be at least 3 characters"}
            
            if not self._validate_email(email):
                return {"success": False, "error": "Invalid email format"}
            
            if not password or len(password) < 6:
                return {"success": False, "error": "Password must be at least 6 characters"}
            
            if skill_level not in ["beginner", "intermediate", "advanced"]:
                skill_level = "beginner"
            
            # Create user document
            user_data = {
                "username": username.lower().strip(),
                "email": email.lower().strip(),
                "password": self._hash_password(password),
                "skill_level": skill_level,
                "topics_of_interest": topics_of_interest or [],
                "completed_topics": [],
                "learning_progress": {},
                "total_questions_attempted": 0,
                "total_questions_correct": 0,
                "created_at": datetime.now(),
                "last_login": datetime.now()
            }
            
            result = self.users.insert_one(user_data)
            return {
                "success": True,
                "user_id": str(result.inserted_id),
                "username": username
            }
        
        except Exception as e:
            error_msg = str(e)
            if "duplicate key" in error_msg.lower():
                if "username" in error_msg.lower():
                    return {"success": False, "error": "Username already exists"}
                elif "email" in error_msg.lower():
                    return {"success": False, "error": "Email already registered"}
            return {"success": False, "error": f"Registration failed: {error_msg}"}
    
    def authenticate_user(self, username, password):
        """Authenticate user and return user data"""
        try:
            user = self.users.find_one({"username": username.lower().strip()})
            
            if not user:
                return {"success": False, "error": "Invalid username or password"}
            
            if not self._verify_password(password, user["password"]):
                return {"success": False, "error": "Invalid username or password"}
            
            # Update last login
            self.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"last_login": datetime.now()}}
            )
            
            # Remove password from returned data
            user.pop("password")
            user["_id"] = str(user["_id"])
            
            return {"success": True, "user": user}
        
        except Exception as e:
            return {"success": False, "error": f"Authentication failed: {str(e)}"}
    
    def get_user_profile(self, username):
        """Get user profile information"""
        try:
            user = self.users.find_one(
                {"username": username.lower().strip()},
                {"password": 0}
            )
            if user:
                user["_id"] = str(user["_id"])
                return user
            return None
        except Exception as e:
            print(f"Error getting user profile: {e}")
            return None
    
    def update_skill_level(self, username, new_skill_level):
        """Update user's skill level"""
        try:
            if new_skill_level not in ["beginner", "intermediate", "advanced"]:
                return {"success": False, "error": "Invalid skill level"}
            
            result = self.users.update_one(
                {"username": username.lower().strip()},
                {"$set": {"skill_level": new_skill_level}}
            )
            
            return {"success": result.modified_count > 0}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update_topics_of_interest(self, username, topics):
        """Update user's topics of interest"""
        try:
            result = self.users.update_one(
                {"username": username.lower().strip()},
                {"$set": {"topics_of_interest": topics}}
            )
            return {"success": result.modified_count > 0}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update_learning_progress(self, username, topic, score):
        """Update user's learning progress for a specific topic"""
        try:
            self.users.update_one(
                {"username": username.lower().strip()},
                {
                    "$set": {f"learning_progress.{topic}": score},
                    "$addToSet": {"completed_topics": topic}
                }
            )
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def increment_question_stats(self, username, attempted=1, correct=0):
        """Increment question statistics"""
        try:
            self.users.update_one(
                {"username": username.lower().strip()},
                {
                    "$inc": {
                        "total_questions_attempted": attempted,
                        "total_questions_correct": correct
                    }
                }
            )
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_user_statistics(self, username):
        """Get user learning statistics"""
        try:
            user = self.get_user_profile(username)
            if not user:
                return None
            
            total_attempted = user.get("total_questions_attempted", 0)
            total_correct = user.get("total_questions_correct", 0)
            accuracy = (total_correct / total_attempted * 100) if total_attempted > 0 else 0
            
            return {
                "total_attempted": total_attempted,
                "total_correct": total_correct,
                "accuracy": round(accuracy, 2),
                "completed_topics": len(user.get("completed_topics", [])),
                "topics_in_progress": len(user.get("learning_progress", {}))
            }
        except Exception as e:
            print(f"Error getting statistics: {e}")
            return None
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
