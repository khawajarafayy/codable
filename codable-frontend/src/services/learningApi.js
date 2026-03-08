import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper to get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const learningApi = {
  // Get all chapters with their topic counts
  getChapters: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/learning/chapters`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chapters:', error);
      throw error;
    }
  },

  // Get topics for a specific chapter
  getChapterTopics: async (chapterId) => {
    try {
      const response = await axios.get(`${API_URL}/api/learning/chapters/${chapterId}/topics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
  },

  // Get content for a specific topic (with pagination)
  getTopicContent: async (topicId) => {
    try {
      const response = await axios.get(`${API_URL}/api/learning/topics/${topicId}/content`);
      return response.data;
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error;
    }
  },

  // Get structured practice questions for coding exercises
  getPracticeQuestions: async (topicId, difficulty = 'easy', num = 3) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/learning/topics/${topicId}/practice-questions`,
        { params: { difficulty, num } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching practice questions:', error);
      throw error;
    }
  },

  // Validate student's solution
  validateSolution: async (code, question, actualOutput) => {
    try {
      const response = await axios.post(`${API_URL}/api/learning/validate-solution`, {
        code,
        question,
        actualOutput
      });
      return response.data;
    } catch (error) {
      console.error('Error validating solution:', error);
      throw error;
    }
  },

  // Search content across all topics
  searchContent: async (query, chapter = null) => {
    try {
      const response = await axios.post(`${API_URL}/api/learning/search`, {
        query,
        chapter
      });
      return response.data;
    } catch (error) {
      console.error('Error searching:', error);
      throw error;
    }
  },

  // ============ PROGRESS TRACKING ============

  // Get user's chapters progress (locked/unlocked status)
  getChaptersProgress: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/progress/chapters`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching chapters progress:', error);
      throw error;
    }
  },

  // Get topics progress for a specific chapter
  getChapterTopicsProgress: async (chapterId) => {
    try {
      const response = await axios.get(`${API_URL}/api/progress/chapters/${chapterId}/topics`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching chapter topics progress:', error);
      throw error;
    }
  },

  // Start a chapter
  startChapter: async (chapterId) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/progress/chapters/${chapterId}/start`,
        {},
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error starting chapter:', error);
      throw error;
    }
  },

  // Complete a topic
  completeTopic: async (chapterId, topicId, timeSpent = 0) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/progress/chapters/${chapterId}/topics/${topicId}/complete`,
        { timeSpent },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error completing topic:', error);
      throw error;
    }
  },

  // Complete a chapter
  completeChapter: async (chapterId) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/progress/chapters/${chapterId}/complete`,
        {},
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error completing chapter:', error);
      throw error;
    }
  },

  // Get full user progress
  getUserProgress: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/progress`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  },

  // ============ ADAPTIVE LEARNING ============

  // Evaluate quiz results and get advance/remediate decision
  evaluateQuiz: async (topicId, responses, userConceptMastery = {}, attemptNumber = 1) => {
    try {
      const response = await axios.post(`${API_URL}/api/learning/quiz/evaluate`, {
        topic_id: topicId,
        responses,
        user_concept_mastery: userConceptMastery,
        attempt_number: attemptNumber
      });
      return response.data;
    } catch (error) {
      console.error('Error evaluating quiz:', error);
      throw error;
    }
  },

  // Get remedial learning content based on weak concepts
  getRemedialContent: async (topicId, weakConcepts, mistakeDetails, attemptNumber = 2, conceptMasteries = {}) => {
    try {
      const response = await axios.post(`${API_URL}/api/learning/remediation/content`, {
        topic_id: topicId,
        weak_concepts: weakConcepts,
        mistake_details: mistakeDetails,
        attempt_number: attemptNumber,
        concept_masteries: conceptMasteries
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching remedial content:', error);
      throw error;
    }
  },

  // Get remedial practice questions targeting weak areas
  getRemedialQuestions: async (topicId, weakConcepts, mistakeDetails, attemptNumber = 2, numQuestions = 2) => {
    try {
      const response = await axios.post(`${API_URL}/api/learning/remediation/questions`, {
        topic_id: topicId,
        weak_concepts: weakConcepts,
        mistake_details: mistakeDetails,
        attempt_number: attemptNumber,
        num_questions: numQuestions
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching remedial questions:', error);
      throw error;
    }
  }
};

export default learningApi;
