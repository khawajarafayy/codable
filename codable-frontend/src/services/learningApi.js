import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  }
};

export default learningApi;
