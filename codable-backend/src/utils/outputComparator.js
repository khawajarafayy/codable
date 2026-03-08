/**
 * Output Comparator Utility
 * 
 * Compares expected output with user's code output using embeddings and cosine similarity.
 * Designed for chapter practice question validation.
 * 
 * Uses semantic similarity to handle minor differences in spacing, punctuation,
 * and slight wording variations that shouldn't cause answers to be marked incorrect.
 */

import axios from 'axios';

// Mistral Embedding API configuration
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/embeddings';
const EMBEDDING_MODEL = 'mistral-embed';

// Similarity threshold for marking answer as correct
const SIMILARITY_THRESHOLD = 0.92;

/**
 * Normalizes output text before comparison
 * - Trims leading/trailing whitespace
 * - Converts to lowercase
 * - Removes extra spaces (multiple spaces become single space)
 * - Normalizes line breaks (\r\n -> \n)
 * - Removes empty lines
 * 
 * @param {string} text - The text to normalize
 * @returns {string} - Normalized text
 */
function normalizeOutput(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Normalize line breaks to \n
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    // Remove empty lines
    .filter(line => line.length > 0)
    // Join back
    .join('\n')
    // Convert to lowercase
    .toLowerCase()
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Final trim
    .trim();
}

/**
 * Generates an embedding vector for the given text using Mistral's API
 * 
 * @param {string} text - The text to generate embedding for
 * @returns {Promise<number[]>} - The embedding vector
 * @throws {Error} - If embedding generation fails
 */
async function generateEmbedding(text) {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text');
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  
  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY environment variable is not set');
  }

  try {
    const response = await axios.post(
      MISTRAL_API_URL,
      {
        model: EMBEDDING_MODEL,
        input: [text],
        encoding_format: 'float'
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract embedding from response
    const embedding = response.data?.data?.[0]?.embedding;
    
    if (!embedding || !Array.isArray(embedding)) {
      throw new Error('Invalid embedding response from API');
    }

    return embedding;
  } catch (error) {
    // Handle specific API errors
    if (error.response?.status === 401) {
      throw new Error('Invalid Mistral API key');
    }
    if (error.response?.status === 429) {
      throw new Error('Mistral API rate limit exceeded');
    }
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

/**
 * Calculates cosine similarity between two embedding vectors
 * 
 * Formula: cos(θ) = (A · B) / (||A|| × ||B||)
 * Where:
 *   - A · B is the dot product of vectors A and B
 *   - ||A|| and ||B|| are the magnitudes (L2 norms) of the vectors
 * 
 * @param {number[]} vecA - First embedding vector
 * @param {number[]} vecB - Second embedding vector
 * @returns {number} - Cosine similarity score between -1 and 1
 * @throws {Error} - If vectors are invalid or have different dimensions
 */
function cosineSimilarity(vecA, vecB) {
  // Validate inputs
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
    throw new Error('Both inputs must be arrays');
  }

  if (vecA.length === 0 || vecB.length === 0) {
    throw new Error('Embedding vectors cannot be empty');
  }

  if (vecA.length !== vecB.length) {
    throw new Error(`Vector dimensions must match: ${vecA.length} vs ${vecB.length}`);
  }

  // Calculate dot product: A · B = Σ(ai × bi)
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }

  // Calculate magnitudes: ||A|| = √(Σ(ai²))
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < vecA.length; i++) {
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  // Avoid division by zero
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  // Calculate cosine similarity
  const similarity = dotProduct / (magnitudeA * magnitudeB);

  // Clamp to [-1, 1] to handle floating point errors
  return Math.max(-1, Math.min(1, similarity));
}

/**
 * Compares expected output with user's output using embeddings
 * 
 * Process:
 * 1. Normalize both outputs
 * 2. If exact match after normalization, return perfect score (1.0)
 * 3. Generate embeddings for both outputs
 * 4. Calculate cosine similarity
 * 5. Return similarity score and correctness based on threshold
 * 
 * @param {string} expectedOutput - The expected output from the question
 * @param {string} userOutput - The actual output from user's code execution
 * @param {object} options - Optional configuration
 * @param {number} options.threshold - Custom similarity threshold (default: 0.92)
 * @returns {Promise<{similarityScore: number, isCorrect: boolean, normalizedExpected?: string, normalizedUser?: string}>}
 */
async function compareOutputs(expectedOutput, userOutput, options = {}) {
  const threshold = options.threshold || SIMILARITY_THRESHOLD;

  // Handle edge cases
  if (!expectedOutput && !userOutput) {
    // Both empty - consider correct
    return {
      similarityScore: 1.0,
      isCorrect: true
    };
  }

  if (!expectedOutput) {
    // No expected output - just check if user produced non-error output
    const hasValidOutput = userOutput && 
      userOutput.trim().length > 0 && 
      !userOutput.toLowerCase().includes('error');
    return {
      similarityScore: hasValidOutput ? 1.0 : 0.0,
      isCorrect: hasValidOutput
    };
  }

  if (!userOutput) {
    // Expected output but user produced nothing
    return {
      similarityScore: 0.0,
      isCorrect: false
    };
  }

  // Step 1: Normalize both outputs
  const normalizedExpected = normalizeOutput(expectedOutput);
  const normalizedUser = normalizeOutput(userOutput);

  // Step 2: Check for exact match after normalization (skip embeddings)
  if (normalizedExpected === normalizedUser) {
    return {
      similarityScore: 1.0,
      isCorrect: true,
      normalizedExpected,
      normalizedUser
    };
  }

  // Step 3: Check for substring containment (common case for extra prompts)
  if (normalizedExpected.includes(normalizedUser) || normalizedUser.includes(normalizedExpected)) {
    // High similarity but not perfect
    const shorterLen = Math.min(normalizedExpected.length, normalizedUser.length);
    const longerLen = Math.max(normalizedExpected.length, normalizedUser.length);
    const containmentScore = shorterLen / longerLen;
    
    // If reasonably close, consider it correct
    if (containmentScore >= 0.8) {
      return {
        similarityScore: Math.max(0.95, containmentScore),
        isCorrect: true,
        normalizedExpected,
        normalizedUser
      };
    }
  }

  // Step 4: Generate embeddings and calculate similarity
  try {
    const [expectedEmbedding, userEmbedding] = await Promise.all([
      generateEmbedding(normalizedExpected),
      generateEmbedding(normalizedUser)
    ]);

    // Step 5: Calculate cosine similarity
    const similarityScore = cosineSimilarity(expectedEmbedding, userEmbedding);

    // Step 6: Determine correctness based on threshold
    return {
      similarityScore: Math.round(similarityScore * 10000) / 10000, // Round to 4 decimal places
      isCorrect: similarityScore >= threshold,
      normalizedExpected,
      normalizedUser
    };
  } catch (error) {
    // If embedding fails, fall back to basic word-based similarity
    console.error('Embedding comparison failed, using fallback:', error.message);
    return fallbackComparison(normalizedExpected, normalizedUser, threshold);
  }
}

/**
 * Fallback comparison using word-based Jaccard similarity
 * Used when embedding API is unavailable
 * 
 * @param {string} expected - Normalized expected output
 * @param {string} actual - Normalized actual output
 * @param {number} threshold - Similarity threshold
 * @returns {{similarityScore: number, isCorrect: boolean}}
 */
function fallbackComparison(expected, actual, threshold) {
  const expectedWords = new Set(expected.split(/\s+/));
  const actualWords = new Set(actual.split(/\s+/));

  // Calculate Jaccard similarity: |A ∩ B| / |A ∪ B|
  const intersection = new Set([...expectedWords].filter(word => actualWords.has(word)));
  const union = new Set([...expectedWords, ...actualWords]);

  const similarityScore = union.size > 0 
    ? intersection.size / union.size 
    : 0;

  return {
    similarityScore: Math.round(similarityScore * 10000) / 10000,
    isCorrect: similarityScore >= threshold,
    usingFallback: true
  };
}

/**
 * Validates a complete solution with full scoring
 * Combines output comparison with code pattern checks
 * 
 * @param {object} params - Validation parameters
 * @param {string} params.code - The user's submitted code
 * @param {string} params.actualOutput - Output from code execution
 * @param {object} params.question - The question object with validation criteria
 * @returns {Promise<object>} - Complete validation result
 */
async function validateSolution({ code, actualOutput, question }) {
  const result = {
    isCorrect: false,
    score: 0,
    outputSimilarity: 0,
    feedback: [],
    suggestions: []
  };

  // Topic-aware static code analysis
  const allowedConcepts = question.allowedConcepts || [];
  const forbiddenConcepts = question.forbiddenConcepts || [];
  const conceptAnalysis = analyzeConcepts(code, allowedConcepts, forbiddenConcepts);
  if (conceptAnalysis.forbidden.length > 0) {
    result.feedback.push('Your code uses forbidden/advanced concepts: ' + conceptAnalysis.forbidden.join(', '));
  }
  if (conceptAnalysis.missing.length > 0) {
    result.feedback.push('Your code is missing required concepts: ' + conceptAnalysis.missing.join(', '));
  }

  // Check mustContain patterns in code
  let mustContainScore = 0;
  const mustContain = question.mustContain || [];
  for (const pattern of mustContain) {
    if (code.toLowerCase().includes(pattern.toLowerCase())) {
      mustContainScore++;
    } else {
      result.feedback.push(`Missing required pattern: ${pattern}`);
    }
  }
  const mustContainPct = mustContain.length > 0 
    ? (mustContainScore / mustContain.length) * 100 
    : 100;

  // Check mustNotContain patterns
  let hasForbidden = false;
  const mustNotContain = question.mustNotContain || [];
  for (const pattern of mustNotContain) {
    if (code.toLowerCase().includes(pattern.toLowerCase())) {
      hasForbidden = true;
      result.feedback.push(`Contains forbidden pattern: ${pattern}`);
    }
  }

  // Check solution keywords for partial credit
  let keywordScore = 0;
  const solutionKeywords = question.solutionKeywords || [];
  for (const keyword of solutionKeywords) {
    if (code.toLowerCase().includes(keyword.toLowerCase())) {
      keywordScore++;
    }
  }
  const keywordPct = solutionKeywords.length > 0 
    ? (keywordScore / solutionKeywords.length) * 100 
    : 100;

  // Determine if strict output match is required
  const expectedOutput = question.expectedOutput || '';
  const expectedIsSample = expectedOutput.length < 40 && (mustContain.length > 0 || solutionKeywords.length > 0);

  let outputComparison = { isCorrect: true, similarityScore: 1.0 };
  if (!expectedIsSample) {
    // Only compare output strictly if not just a sample
    outputComparison = await compareOutputs(expectedOutput, actualOutput);
  }
  result.outputSimilarity = outputComparison.similarityScore;

  // Calculate overall score
  let score = 0;
  if (outputComparison.isCorrect) {
    score += 50; // 50 points for correct output
  }
  score += mustContainPct * 0.2;  // 20 points max for patterns
  score += keywordPct * 0.2;       // 20 points max for keywords
  if (!hasForbidden && conceptAnalysis.forbidden.length === 0) {
    score += 10; // Bonus for not using forbidden patterns
  }
  if (conceptAnalysis.missing.length === 0 && allowedConcepts.length > 0) {
    score += 20;
  }

  result.score = Math.min(100, Math.round(score));
  result.isCorrect = result.score >= 70 && outputComparison.isCorrect && !hasForbidden && conceptAnalysis.forbidden.length === 0;

  // Add feedback
  if (result.isCorrect) {
    result.feedback.push('Great job! Your solution is correct!');
  } else {
    if (!outputComparison.isCorrect && !expectedIsSample) {
      result.suggestions.push('Check your output - it doesn\'t match the expected result');
      if (outputComparison.similarityScore > 0.7) {
        result.suggestions.push(
          `Output similarity: ${Math.round(outputComparison.similarityScore * 100)}%. ` +
          'Check spacing, punctuation, and capitalization.'
        );
      }
    }
    if (mustContainPct < 100) {
      result.suggestions.push('Make sure you\'re using the required code patterns');
    }
    if (conceptAnalysis.missing.length > 0) {
      result.suggestions.push('Use the required concepts for this topic.');
    }
    if (conceptAnalysis.forbidden.length > 0) {
      result.suggestions.push('Remove advanced/forbidden concepts for this topic.');
    }
  }

  return result;
}

/**
 * Checks code for required and forbidden concepts using regex
 * @param {string} code - User's code
 * @param {string[]} allowedConcepts - List of required concepts (keywords/classes/methods)
 * @param {string[]} forbiddenConcepts - List of forbidden concepts
 * @returns {{missing: string[], forbidden: string[]}}
 */
function analyzeConcepts(code, allowedConcepts = [], forbiddenConcepts = []) {
  const codeLower = code.toLowerCase();
  const missing = [];
  const forbidden = [];
  for (const concept of allowedConcepts) {
    // Simple substring check (can be improved with AST)
    if (!codeLower.includes(concept.toLowerCase())) {
      missing.push(concept);
    }
  }
  for (const concept of forbiddenConcepts) {
    if (codeLower.includes(concept.toLowerCase())) {
      forbidden.push(concept);
    }
  }
  return { missing, forbidden };
}

// Export functions for use in other modules
export {
  normalizeOutput,
  generateEmbedding,
  cosineSimilarity,
  compareOutputs,
  validateSolution,
  fallbackComparison,
  SIMILARITY_THRESHOLD
};
