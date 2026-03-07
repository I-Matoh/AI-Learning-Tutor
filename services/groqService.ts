import { Course, Quiz } from "../types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL =
  import.meta.env.VITE_GROQ_MODEL || "llama-3.3-70b-versatile";
const COURSE_MODEL = import.meta.env.VITE_GROQ_MODEL_COURSE || DEFAULT_MODEL;
const LESSON_MODEL = import.meta.env.VITE_GROQ_MODEL_LESSON || DEFAULT_MODEL;
const QUIZ_MODEL = import.meta.env.VITE_GROQ_MODEL_QUIZ || DEFAULT_MODEL;

const parseJSON = (text: string, fallback: any = {}) => {
  try {
    return JSON.parse(text);
  } catch {
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

const getApiKey = () => {
  const key = import.meta.env.VITE_GROQ_API_KEY;
  if (!key) {
    throw new Error("Missing VITE_GROQ_API_KEY. Add it to your .env file.");
  }
  return key;
};

const callGroq = async (
  prompt: string,
  model: string,
  jsonMode = false
): Promise<string> => {
  const apiKey = getApiKey();

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
      temperature: 0.3,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq request failed (${response.status}): ${detail}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content ?? "";
};

type GenerateOptions = {
  model?: string;
};

export const generateCourse = async (
  topic: string,
  options?: GenerateOptions
): Promise<Course> => {
  const prompt = `Create a comprehensive, structured learning path for the topic "${topic}".
Return ONLY valid JSON with this shape:
{
  "title": "string",
  "description": "string",
  "modules": [
    {
      "title": "string",
      "description": "string",
      "lessons": [{ "title": "string", "description": "string" }]
    }
  ]
}
Use 3-5 modules and 3-5 lessons per module.`;

  const responseText = await callGroq(
    prompt,
    options?.model || COURSE_MODEL,
    true
  );
  const data = parseJSON(responseText, {
    title: topic,
    description: `Learning path for ${topic}`,
    modules: [],
  });

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
        isLocked: !(mIdx === 0 && lIdx === 0),
      })),
    })),
  };
};

export const generateLessonContent = async (
  courseTitle: string,
  moduleTitle: string,
  lessonTitle: string,
  options?: GenerateOptions
): Promise<string> => {
  const prompt = `You are an expert tutor. Write a comprehensive lesson in Markdown.
Course: ${courseTitle}
Module: ${moduleTitle}
Lesson: ${lessonTitle}

Include:
1) Introduction
2) Key Concepts (bullets)
3) Detailed Explanation (subheadings)
4) Practical Example
5) Summary`;

  const responseText = await callGroq(
    prompt,
    options?.model || LESSON_MODEL,
    false
  );
  return responseText || "Failed to generate content.";
};

export const generateQuiz = async (
  courseTitle: string,
  context: string,
  options?: GenerateOptions
): Promise<Quiz> => {
  const prompt = `Create a multiple-choice quiz for: ${courseTitle} - ${context}.
Generate 3 to 5 questions.
Return ONLY valid JSON:
{
  "title": "string",
  "questions": [
    {
      "question": "string",
      "options": ["string"],
      "correctAnswerIndex": 0,
      "explanation": "string"
    }
  ]
}`;

  const responseText = await callGroq(
    prompt,
    options?.model || QUIZ_MODEL,
    true
  );
  return parseJSON(responseText, {
    title: `${courseTitle} Quiz`,
    questions: [],
  }) as Quiz;
};
