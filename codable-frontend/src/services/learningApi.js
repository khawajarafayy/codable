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
  }
};

export default learningApi;
