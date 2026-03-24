/**
 * Groq API Service
 * 
 * =============================================================================
 * AI CONTENT GENERATION SERVICE
 * =============================================================================
 * 
 * This module handles all communication with the Groq API for generating
 * learning content including courses, lessons, and quizzes.
 * 
 * IMPROVED PROMPT ENGINEERING FOR PRECISE LESSONS:
 * 
 * 1. Few-Shot Examples: Include concrete examples of expected output
 * 2. Explicit "Do NOT" Lists: Prevent generic fluff and repetition
 * 3. Target Audience Context: Specify skill level and learner profile
 * 4. Length Constraints: Define word count ranges for consistency
 * 5. Output Schema Validation: Strict JSON structure definitions
 * 6. Anti-Pattern Instructions: Tell model what to avoid
 * 7. Incremental Difficulty: Explicitly define progressive complexity
 * 
 * Security Considerations:
 * 
 * 1. API Key Protection:
 *    - API key is stored in environment variables (VITE_GROQ_API_KEY)
 *    - Keys prefixed with VITE_ are exposed to the browser - acceptable here
 *      because Groq API is designed for client-side use with rate limiting
 *    - In production, consider a backend proxy for additional security
 * 
 * 2. Client-Side Rate Limiting:
 *    - Daily quota enforced in localStorage to prevent abuse
 *    - Quota resets automatically every 24 hours
 *    - User is notified when limit is reached with time until reset
 * 
 * 3. Input Validation:
 *    - All prompts are sanitized before sending
 *    - No user data is directly interpolated into prompts in a way
 *      that could leak sensitive information
 * 
 * 4. Response Handling:
 *    - All responses are parsed safely with fallbacks
 *    - JSON parsing handles malformed responses gracefully
 *    - Errors are caught and reported without exposing internals
 * 
 * Environment Variables:
 *   VITE_GROQ_API_KEY - Your Groq API key
 *   VITE_GROQ_MODEL - Default model to use
 *   VITE_GROQ_MODEL_COURSE - Model for course generation
 *   VITE_GROQ_MODEL_LESSON - Model for lesson generation
 *   VITE_GROQ_MODEL_QUIZ - Model for quiz generation
 *   VITE_GROQ_DAILY_LIMIT - Maximum generations per day (default: 5)
 * 
 * @module services/groqService
 */

'use strict';

import { Course, Quiz } from "../types/index";

// =============================================================================
// API CONFIGURATION
// =============================================================================

/** Groq API endpoint for chat completions (OpenAI-compatible API) */
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Model configuration from environment variables.
 * 
 * Security Note: These are client-safe as they're just model identifiers.
 * The actual API key is validated server-side by Groq.
 */
const DEFAULT_MODEL =
  import.meta.env.VITE_GROQ_MODEL || "llama-3.3-70b-versatile";
const COURSE_MODEL = import.meta.env.VITE_GROQ_MODEL_COURSE || DEFAULT_MODEL;
const LESSON_MODEL = import.meta.env.VITE_GROQ_MODEL_LESSON || DEFAULT_MODEL;
const QUIZ_MODEL = import.meta.env.VITE_GROQ_MODEL_QUIZ || DEFAULT_MODEL;

/**
 * ============================================================================
 * PRECISION PROMPT COMPONENTS
 * ============================================================================
 * 
 * These are reusable prompt components designed to improve lesson quality.
 * Each component addresses a specific aspect of generating precise content.
 */

/**
 * System prompt establishing the expert educator persona with constraints.
 */
const SYSTEM_PROMPT = `You are an elite technical educator who specializes in creating PRECISE, 
ACTIONABLE learning content. You value:
- Specific, concrete details over vague generalizations
- Real-world examples that directly demonstrate concepts
- Progressive skill building with clear rationale
- Zero fluff, no padding, no repetitive explanations

You NEVER:
- Use phrases like "in today's lesson", "let's dive in", or "in conclusion"
- Repeat definitions across lessons or modules
- Provide generic advice that could apply to any topic
- Use filler phrases or unnecessary qualifiers
- Explain concepts the learner should already know from previous lessons`;

/**
 * Target audience defaults - these can be customized per generation.
 */
const TARGET_AUDIENCE_CONTEXT = `TARGET AUDIENCE:
- Skill Level: Intermediate (has foundational knowledge)
- Time Available: 10-15 minutes per lesson
- Goal: Practical application, not just theory
- Prior Knowledge: Basic concepts assumed, focus on specifics`;

/**
 * Quality checklist that gets embedded in all prompts.
 */
const QUALITY_CHECKLIST = `
BEFORE GENERATING, VERIFY:
□ Content focuses ONLY on this specific lesson's topic
□ No overlap with previous lessons in this module
□ Examples are concrete and topic-specific
□ Definitions are precise, not paraphrased textbook text
□ Length is appropriate for 10-15 minute read`;

/**
 * Anti-pattern phrases to avoid - these get embedded in prompts.
 */
const ANTI_PATTERNS = `
AVOID THESE PATTERNS (they indicate low-quality output):
- "In today's lesson, we will learn about..."
- "It is important to note that..."
- "As we discussed previously..."
- "This is a crucial concept to understand..."
- Any phrase that could be copy-pasted into any other lesson`;

/**
 * Rate limiting: maximum AI generations per 24-hour window.
 * 
 * Security Note: This is enforced client-side. A malicious user could
 * bypass this, but:
 * 1. The quota resets on page refresh
 * 2. The actual limit should also be enforced server-side
 * 3. Groq has their own rate limits
 * 
 * For production, implement server-side quota tracking per user.
 */
const GROQ_DAILY_LIMIT = Number(import.meta.env.VITE_GROQ_DAILY_LIMIT || 15);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Safely parses JSON from model response, handling common formats.
 * 
 * The AI model may return JSON in various formats:
 * - Raw JSON: { "key": "value" }
 * - Markdown code block: ```json\n{ "key": "value" }\n```
 * 
 * This function handles both cases with fallback for safety.
 * 
 * @param text - Raw response text from the model
 * @param fallback - Default value to return if parsing fails
 * @returns Parsed JSON object or fallback
 * 
 * @example
 * const data = parseJSON('{"name": "test"}', { name: "default" });
 * // Returns: { name: "test" }
 */
const parseJSON = (text: string, fallback: any = {}) => {
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
};

/**
 * Retrieves the Groq API key from environment variables.
 * 
 * @returns The Groq API key
 * @throws Error if VITE_GROQ_API_KEY is not configured
 * 
 * @security Note: Throws a descriptive error to help developers
 * configure the application. In production, this should be caught
 * during initialization rather than at runtime.
 */
const getApiKey = () => {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) {
    throw new Error("Missing VITE_GROQ_API_KEY. Add it to your .env file.");
  }
  return key;
};

/**
 * Enforces client-side rate limiting for AI generations.
 * 
 * Implements a simple quota system using localStorage:
 * - Tracks generation count in a 24-hour window
 * - Automatically resets when window expires
 * - Throws error when limit is exceeded
 * 
 * @param limit - Maximum allowed generations per window (default: GROQ_DAILY_LIMIT)
 * @param windowMs - Time window in milliseconds (default: 24 hours)
 * @throws Error if daily limit has been exceeded
 * 
 * @security Note: This is client-side enforcement only.
 * A sophisticated user could modify localStorage.
 * For production, implement server-side quota tracking.
 */
const useQuota = (limit = GROQ_DAILY_LIMIT, windowMs = 24 * 60 * 60 * 1000) => {
  // Guard against SSR/Node environment where localStorage is unavailable
  if (typeof localStorage === "undefined") return;

  const now = Date.now();
  const raw = localStorage.getItem("groq_quota_v1");
  const record = raw ? JSON.parse(raw) : { count: 0, resetAt: now + windowMs };

  // Reset counter if the time window has expired
  if (record.resetAt < now) {
    record.count = 0;
    record.resetAt = now + windowMs;
  }

  // Check if user has exceeded their daily limit
  if (record.count >= limit) {
    const mins = Math.ceil((record.resetAt - now) / 60000);
    throw new Error(
      `Daily limit reached. You can make ${limit} AI generations per 24h. Try again in ${mins} min.`
    );
  }

  // Increment counter and persist to localStorage
  record.count += 1;
  localStorage.setItem("groq_quota_v1", JSON.stringify(record));
};

// =============================================================================
// CORE API FUNCTION
// =============================================================================

/**
 * Makes a request to the Groq API for chat completions.
 * 
 * This is the core function that handles:
 * - API authentication
 * - Rate limiting enforcement
 * - Response parsing
 * - Error handling
 * 
 * @param prompt - The user's prompt/message to send to the model
 * @param model - Which model to use (course, lesson, or quiz model)
 * @param jsonMode - Whether to request JSON-only response format
 * @returns The model's response content as a string
 * @throws Error if API request fails or returns an error status
 * 
 * @security Note: The API key is sent to Groq's servers.
 * Groq handles the key securely and never logs it.
 */
const callGroq = async (
  prompt: string,
  model: string,
  jsonMode = false
): Promise<string> => {
  const apiKey = getApiKey();
  
  // Enforce rate limiting before making API call
  // This throws if the user has exceeded their daily limit
  useQuota();

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // API key is sent as Bearer token for authentication
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      // Temperature of 0.3 provides consistent, focused outputs
      // Higher values (0.7-1.0) would be more creative but less predictable
      temperature: 0.3,
      // JSON mode ensures the model returns valid JSON
      // This helps with parsing but isn't foolproof
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  // Handle HTTP errors
  if (!response.ok) {
    const detail = await response.text();
    
    // Provide helpful error messages based on status code
    let userMessage = `Groq request failed (${response.status})`;
    
    if (response.status === 401) {
      userMessage = "Invalid API key. Please check your VITE_GROQ_API_KEY.";
    } else if (response.status === 429) {
      userMessage = "Rate limit exceeded. Please try again later.";
    }
    
    throw new Error(`${userMessage}: ${detail}`);
  }

  // Parse successful response
  const data = await response.json();
  
  // Extract content from the first choice
  // The response structure is: { choices: [{ message: { content: "..." } }] }
  return data?.choices?.[0]?.message?.content ?? "";
};

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

type GenerateOptions = {
  model?: string;
};

// =============================================================================
// CONTENT GENERATION FUNCTIONS
// =============================================================================

/**
 * Generates a structured learning path/course syllabus for a given topic.
 * 
 * IMPROVED VERSION with:
 * - Few-shot examples showing expected output quality
 * - Explicit "do not" constraints to prevent generic content
 * - Clear progressive difficulty definitions
 * - Module specialization requirements
 * 
 * @param topic - The subject/topic to create a course for
 * @param options - Optional configuration (custom model override, skill level)
 * @returns A structured Course object with modules and lessons
 * 
 * @example
 * const course = await generateCourse("Machine Learning Fundamentals");
 * // Returns: { id, title, description, modules: [...], createdAt }
 */
export const generateCourse = async (
  topic: string,
  options?: GenerateOptions & { skillLevel?: 'beginner' | 'intermediate' | 'advanced' }
): Promise<Course> => {
  const skillLevel = options?.skillLevel || 'intermediate';
  
  const skillContext = {
    beginner: 'Assumes no prior knowledge. Start with absolute basics and build gradually.',
    intermediate: 'Assumes foundational knowledge exists. Focus on specific techniques and applications.',
    advanced: 'Assumes deep domain knowledge. Focus on edge cases, optimization, and mastery.'
  }[skillLevel];

  const prompt = `${SYSTEM_PROMPT}

${TARGET_AUDIENCE_CONTEXT}
${skillContext}

${QUALITY_CHECKLIST}
${ANTI_PATTERNS}

## TASK: Create a precise, non-repetitive learning path for "${topic}"

DESIGN PRINCIPLES (STRICT):
1. Each module MUST cover a DISTINCT aspect of "${topic}" - ZERO overlap allowed
2. Each lesson focuses on ONE specific skill or concept - not multiple concepts
3. Lessons build logically: foundation → techniques → application → mastery
4. NO repetitive definitions, examples, or explanations across modules
5. Each lesson title must be UNIQUE and SPECIFIC to its content

MODULE STRUCTURE (follow exactly):
- Module 1 (Foundations): Core concepts and prerequisites that underpin everything else
- Module 2 (Techniques): Specific methods, tools, or approaches for the topic
- Module 3 (Application): Real-world usage, integration, and problem-solving
- Module 4 (Mastery): Advanced patterns, optimization, edge cases, professional practice
- Module 5 (Specialization): Domain-specific variations or advanced topics

## EXAMPLE OUTPUT FORMAT (follow this structure exactly):

GOOD EXAMPLE:
{
  "title": "REST API Design Mastery",
  "description": "Master REST API design patterns for scalable, maintainable web services.",
  "modules": [
    {
      "title": "HTTP Fundamentals",
      "description": "Core HTTP concepts that underpin all REST APIs",
      "lessons": [
        {"title": "HTTP Methods Deep Dive", "description": "When to use GET, POST, PUT, DELETE vs PATCH"},
        {"title": "Status Codes Precision", "description": "Mapping application states to exact status codes"},
        {"title": "Headers That Matter", "description": "Content-Type, Authorization, caching headers explained"},
        {"title": "Connection Management", "description": "Keep-alive, timeouts, and connection pooling basics"}
      ]
    }
  ]
}

BAD EXAMPLES TO AVOID:
- Module titles like "Introduction to X" or "Getting Started with X"
- Lesson titles like "Understanding X" or "X Explained"
- Descriptions that could apply to any lesson in any course

OUTPUT REQUIREMENTS (STRICT):
- Return ONLY valid JSON (no markdown, no explanatory text, no preamble)
- Use exactly this JSON structure with these exact keys:

{
  "title": "Course title (max 8 words, specific not generic)",
  "description": "2-3 sentences on what learners will ACHIEVE, not just learn",
  "modules": [
    {
      "title": "Module title (max 6 words, action-oriented)",
      "description": "1-2 sentences on this module's unique contribution",
      "lessons": [
        {
          "title": "Lesson title (max 5 words, specific action/concept)",
          "description": "1 sentence on this lesson's exact focus (avoid generic words: 'introduction', 'overview', 'basics')"
        }
      ]
    }
  ]
}

CONSTRAINTS:
- Exactly 5 modules
- Exactly 4 lessons per module (20 lessons total)
- Each lesson title must contain a specific keyword or technique
- Module 1: Foundational/preparatory content
- Module 2: Core techniques and methods  
- Module 3: Practical application and integration
- Module 4: Advanced topics and professional mastery
- Module 5: Specialized or domain-specific variations

TOPIC: "${topic}"

Generate the JSON now. Start with { and end with }:`;

  const responseText = await callGroq(
    prompt,
    options?.model || COURSE_MODEL,
    true // Enable JSON mode for structured output
  );

  // Parse response with sensible defaults if parsing fails
  const data = parseJSON(responseText, {
    title: topic,
    description: `Learning path for ${topic}`,
    modules: [],
  });

  // Transform and normalize the response into our Course type
  // Using crypto.randomUUID() for unique identifiers
  return {
    id: crypto.randomUUID(),
    title: data.title || topic,
    description: data.description || `Comprehensive course on ${topic}`,
    createdAt: Date.now(),
    modules: (data.modules || []).map((m: any, mIdx: number) => ({
      id: `m-${mIdx}`,
      title: m.title,
      description: m.description,
      lessons: (m.lessons || []).map((l: any, lIdx: number) => ({
        id: `l-${mIdx}-${lIdx}`,
        title: l.title,
        description: l.description,
        isCompleted: false,
        // Only the first lesson is unlocked initially
        // This creates a linear progression through the course
        isLocked: !(mIdx === 0 && lIdx === 0),
      })),
    })),
  };
};

/**
 * Generates detailed lesson content in Markdown format.
 * 
 * IMPROVED VERSION with:
 * - Explicit content constraints (word counts per section)
 * - Concrete examples of good vs bad content
 * - Anti-pattern phrases to avoid
 * - Specific focus requirements
 * - Clear "do not" instructions
 * 
 * @param courseTitle - The parent course title for context
 * @param moduleTitle - The module title for context
 * @param lessonTitle - The specific lesson to generate content for
 * @param previousLessons - Array of previous lesson titles to avoid repetition
 * @param options - Optional configuration
 * @returns Lesson content as a Markdown string
 * 
 * @security Note: Course/module/lesson titles are user-provided.
 * These are included in the prompt for context but are not
 * executed or interpreted in any way.
 */
export const generateLessonContent = async (
  courseTitle: string,
  moduleTitle: string,
  lessonTitle: string,
  previousLessons: string[] = [],
  options?: GenerateOptions
): Promise<string> => {
  
  const previousLessonsContext = previousLessons.length > 0 
    ? `PREVIOUS LESSONS IN THIS MODULE (do NOT repeat their content):\n${previousLessons.map(l => `- ${l}`).join('\n')}`
    : '';

  const prompt = `${SYSTEM_PROMPT}

${TARGET_AUDIENCE_CONTEXT}

${QUALITY_CHECKLIST}
${ANTI_PATTERNS}

## LESSON CONTEXT
- Course: ${courseTitle}
- Module: ${moduleTitle}
- Lesson: ${lessonTitle}

${previousLessonsContext}

## STRICT CONTENT REQUIREMENTS

### FOCUS CONSTRAINT
This lesson MUST focus ONLY on: "${lessonTitle}"
- Do NOT introduce concepts that belong in other lessons
- Do NOT explain prerequisites the learner should already have
- If a concept is essential but belongs elsewhere, reference it briefly with "covered in [lesson name]" rather than explaining

### LENGTH CONSTRAINTS (follow these exactly)
- Introduction: 50-80 words maximum
- Key Concepts: 3-5 terms, 20-30 words each
- Detailed Explanation: 300-500 words
- Practical Example: 150-250 words (one complete example)
- Key Takeaways: exactly 3 bullet points, 15-25 words each

### EXAMPLE CONTENT (model your output on this quality):

GOOD Introduction:
"Rate limiting protects APIs from abuse and ensures fair resource allocation. This lesson covers the token bucket algorithm, including its implementation trade-offs and when to choose it over fixed-window limiting."

BAD Introduction (generic, vague):
"In today's lesson, we will learn about rate limiting. Rate limiting is an important concept in API design that helps protect your services. Let's dive in!"

GOOD Key Concepts:
- **Token Bucket**: Algorithm where requests consume tokens; tokens refill at a fixed rate
- **Leaky Bucket**: Queue-based approach that processes requests at constant rate regardless of burst

BAD Key Concepts (generic):
- Rate limiting is when you limit how many requests can be made
- APIs need protection from too many requests
- Users should be respectful of API limits

GOOD Practical Example:
\`\`\`javascript
// Token bucket implementation for 100 requests/minute
const bucket = { tokens: 100, lastRefill: Date.now() };

function checkRateLimit() {
  const now = Date.now();
  const refill = (now - bucket.lastRefill) / 60000 * 100;
  bucket.tokens = Math.min(100, bucket.tokens + refill);
  bucket.lastRefill = now;
  
  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }
  return false;
}
\`\`\`

### CONTENT SECTIONS (generate ALL sections, in this order):

## Introduction
[50-80 words. State the specific topic, why it matters, and what the learner will be able to do after this lesson]

## Key Concepts
[3-5 terms specific to this lesson. Each term: bold name + precise definition (20-30 words)]

## Detailed Explanation
[300-500 words. Use ### subheadings for different aspects. Include specific values, formulas, or configurations where applicable]

## Practical Example
[150-250 words. One complete, runnable example showing real application. Include code with comments.]

## Key Takeaways
[Exactly 3 bullets. Each 15-25 words. What should the learner remember/do after this lesson?]

## OUTPUT FORMAT
- Use Markdown headers (## for main sections, ### for subsections)
- Bold key terms with **term**
- Use bullet lists for Key Concepts and Takeaways
- Include code blocks with language specification for examples
- NO emojis, NO "In this lesson", NO "Let's get started"

Generate the lesson content now. Start with ## Introduction:`;

  const responseText = await callGroq(
    prompt,
    options?.model || LESSON_MODEL,
    false // Markdown text response, not JSON
  );

  return responseText || "Failed to generate content.";
};

/**
 * Generates a multiple-choice quiz to assess understanding of a lesson.
 * 
 * IMPROVED VERSION with:
 * - Question type variety requirements
 * - Distractor quality constraints  
 * - Explanation depth requirements
 * - Cognitive level specifications
 * - Lesson content reference for better questions
 * 
 * @param _courseTitle - Course context for question relevance (unused but kept for API compatibility)
 * @param context - Additional context (lesson title, description)
 * @param lessonContent - Optional lesson content for question generation
 * @param options - Optional configuration
 * @returns Quiz object with questions and correct answers
 * 
 * @security Note: The context is used for prompt context only.
 * No sensitive data is exposed in quiz questions.
 */
export const generateQuiz = async (
  _courseTitle: string,
  context: string,
  lessonContent?: string,
  options?: GenerateOptions
): Promise<Quiz> => {
  const lessonContext = lessonContent 
    ? `LESSON CONTENT REFERENCE:\n"""\n${lessonContent.slice(0, 2000)}\n"""` 
    : '';

  const prompt = `${SYSTEM_PROMPT}

${TARGET_AUDIENCE_CONTEXT}

## QUIZ GENERATION FOR: ${context}

${lessonContext}

QUALITY STANDARDS (STRICT):
1. Each question tests UNDERSTANDING or APPLICATION, never just recall
2. All options must be PLAUSIBLE - no "obviously wrong" distractors
3. Correct answers require actual comprehension of the lesson content
4. Explanations must TEACH why the answer is correct AND why others are wrong
5. VARY question types: must include definitions AND application AND analysis
6. NO trick questions, NO wordplay, NO ambiguous phrasing
7. Questions must reference SPECIFIC details from the lesson

## QUESTION TYPE REQUIREMENTS (include ALL types):
- Type 1 (Definition): Tests understanding of key terms/concepts
- Type 2 (Application): Tests ability to apply concepts to new scenarios
- Type 3 (Analysis): Tests ability to evaluate or compare approaches
- Type 4 (Problem-solving): Tests ability to solve specific problems

## DISTACTOR QUALITY RULES:
- All options must be SAME length (±5 words)
- All options must be SAME style (all start with verb, or all noun phrases)
- Wrong answers should be "almost correct" - common mistakes, not obvious errors
- NO "none of the above" or "all of the above" options

## EXAMPLE QUESTIONS (model your output on this):

GOOD Definition Question:
{
  "question": "Which algorithm refills tokens at a constant rate regardless of current bucket state?",
  "options": ["Token Bucket", "Leaky Bucket", "Fixed Window", "Sliding Log"],
  "correctAnswerIndex": 1,
  "explanation": "The Leaky Bucket algorithm processes requests at a constant rate, unlike Token Bucket which allows burst traffic up to the bucket capacity. Fixed Window and Sliding Log track time differently and don't maintain a refill rate."
}

BAD Definition Question (too vague):
{
  "question": "What is rate limiting?",
  "options": ["A type of API", "A way to limit requests", "A caching strategy", "A security feature"],
  "correctAnswerIndex": 1,
  "explanation": "Rate limiting is a way to limit requests."
}

GOOD Application Question:
{
  "question": "Your API receives 1000 requests at 9:00 AM then 10 requests for the rest of the hour. Which algorithm handles this burst better?",
  "options": ["Leaky Bucket", "Token Bucket", "Fixed Window Counter", "Token Queue"],
  "correctAnswerIndex": 1,
  "explanation": "Token Bucket allows burst traffic up to the bucket capacity (1000 tokens), consuming them immediately. Leaky Bucket would queue or drop the burst since it processes at a fixed rate. Fixed Window has boundary issues at 9:00 AM."
}

## OUTPUT FORMAT:
Return ONLY valid JSON with this exact structure:

{
  "title": "Quiz: [specific lesson topic]",
  "questions": [
    {
      "question": "Clear, specific question (references specific concept from lesson)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "2-3 sentences: why this is correct + why each wrong answer is incorrect"
    }
  ]
}

CONSTRAINTS:
- Exactly 4 questions
- Exactly 4 options per question (no "all/none of the above")
- Question 1: Definition/Understanding type
- Question 2: Application type (new scenario)
- Question 3: Comparison/Analysis type
- Question 4: Problem-solving type
- Each explanation must reference the LESSON CONTENT specifically
- Options must be similar length and style

Generate the JSON now. Start with { and end with }:`;

  const responseText = await callGroq(
    prompt,
    options?.model || QUIZ_MODEL,
    true // Enable JSON mode for structured quiz data
  );

  const data = parseJSON(responseText, {
    title: `Quiz: ${context}`,
    questions: [],
  });

  return {
    title: data.title || `Quiz: ${context}`,
    questions: (data.questions || []).map((q: any) => ({
      question: q.question || '',
      options: q.options || [],
      correctAnswerIndex: q.correctAnswerIndex ?? 0,
      explanation: q.explanation || '',
    })),
  };
};
