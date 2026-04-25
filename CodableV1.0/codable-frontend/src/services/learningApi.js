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

  // Get chapter-level practice questions (after completing all topics)
  getChapterPracticeQuestions: async (chapterId, difficulty = 'easy', num = 5) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/learning/chapters/${chapterId}/practice-questions`,
        { params: { difficulty, num } }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching chapter practice questions:', error);
      throw error;
    }
  },

  // Validate student's solution (basic validation)
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

  /**
   * Validate chapter practice solution using embedding-based comparison
   * 
   * Uses semantic similarity via embeddings to compare expected output
   * with user's code output. Minor differences in spacing, punctuation,
   * or slight wording don't cause answers to be marked incorrect.
   * 
   * @param {string} code - The user's submitted code
   * @param {object} question - The question object with expectedOutput & validation rules
   * @param {string} actualOutput - Output from executing the user's code
   * @param {number} threshold - Optional similarity threshold (default: 0.92)
   * @returns {Promise<{success: boolean, validation: object}>}
   */
  validateChapterPractice: async (code, question, actualOutput, threshold = 0.92) => {
    try {
      const response = await axios.post(`${API_URL}/api/learning/validate-chapter-practice`, {
        code,
        question,
        actualOutput,
        threshold
      });
      return response.data;
    } catch (error) {
      console.error('Error validating chapter practice:', error);
      throw error;
    }
  },

  /**
   * Compare two outputs using embedding-based similarity
   * Quick check without full validation - useful for testing
   * 
   * @param {string} expectedOutput - The expected output
   * @param {string} userOutput - The user's actual output
   * @param {number} threshold - Optional similarity threshold (default: 0.92)
   * @returns {Promise<{similarityScore: number, isCorrect: boolean}>}
   */
  compareOutputs: async (expectedOutput, userOutput, threshold = 0.92) => {
    try {
      const response = await axios.post(`${API_URL}/api/learning/compare-outputs`, {
        expectedOutput,
        userOutput,
        threshold
      });
      return response.data;
    } catch (error) {
      console.error('Error comparing outputs:', error);
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

  // Course-specific virtual assistant (Java learning only)
  askAssistant: async (message, chapterId = null) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/learning/assistant/chat`,
        { message, chapter_id: chapterId },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error chatting with assistant:', error);
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
  getRemedialQuestions: async (topicId, weakConcepts, mistakeDetails, attemptNumber = 2, numQuestions = 2, remediationContent = null) => {
    try {
      const response = await axios.post(`${API_URL}/api/learning/remediation/questions`, {
        topic_id: topicId,
        weak_concepts: weakConcepts,
        mistake_details: mistakeDetails,
        attempt_number: attemptNumber,
        num_questions: numQuestions,
        remediation_content: remediationContent
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching remedial questions:', error);
      throw error;
    }
  },

  // Emit analytics events to backend (practice submission, quiz completion, hint usage)
  emitAnalyticsEvent: async (eventType, payload) => {
    try {
      const response = await axios.post(
        `${API_URL}/student/metrics/event`,
        { eventType, ...payload },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error emitting analytics event:', error);
      // Don't throw - analytics errors shouldn't interrupt learning
      return { success: false };
    }
  }
};

export default learningApi;
