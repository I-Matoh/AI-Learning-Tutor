'use strict';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const COURSE_MODEL = process.env.GROQ_MODEL_COURSE || DEFAULT_MODEL;
const LESSON_MODEL = process.env.GROQ_MODEL_LESSON || DEFAULT_MODEL;
const QUIZ_MODEL = process.env.GROQ_MODEL_QUIZ || DEFAULT_MODEL;

const parseJSON = (text, fallback = {}) => {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) {
      try {
        return JSON.parse(fenced[1].trim());
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
};

const callGroq = async ({ prompt, model, jsonMode = false }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Missing GROQ_API_KEY on server');

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq request failed (${response.status}): ${detail}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
};

const toCourse = (topic, data) => ({
  id: crypto.randomUUID(),
  title: data.title || topic,
  description: data.description || `Comprehensive course on ${topic}`,
  createdAt: Date.now(),
  modules: (data.modules || []).map((m, mIdx) => ({
    id: `m-${mIdx}`,
    title: m.title,
    description: m.description,
    lessons: (m.lessons || []).map((l, lIdx) => ({
      id: `l-${mIdx}-${lIdx}`,
      title: l.title,
      description: l.description,
      isCompleted: false,
      isLocked: !(mIdx === 0 && lIdx === 0),
    })),
  })),
});

const generateCourse = async ({ topic, skillLevel }) => {
  const prompt = `Create a practical 5-module course for \"${topic}\" at ${skillLevel || 'intermediate'} level. Return JSON only with keys: title, description, modules[]. Each module needs title, description, and exactly 4 lessons[] with title and description.`;
  const responseText = await callGroq({ prompt, model: COURSE_MODEL, jsonMode: true });
  return toCourse(topic, parseJSON(responseText, { title: topic, description: `Learning path for ${topic}`, modules: [] }));
};

const generateLesson = async ({ courseTitle, moduleTitle, lessonTitle, previousLessons }) => {
  const prompt = `Write markdown lesson content for course \"${courseTitle}\", module \"${moduleTitle}\", lesson \"${lessonTitle}\". Avoid repeating prior lessons: ${previousLessons.join(', ') || 'none'}. Include sections: Introduction, Key Concepts, Detailed Explanation, Practical Example, Key Takeaways.`;
  return callGroq({ prompt, model: LESSON_MODEL });
};

const generateQuiz = async ({ courseTitle, context, lessonContent }) => {
  const prompt = `Create a 4-question MCQ quiz for \"${courseTitle}\" and lesson context \"${context}\". Return JSON only with title and questions[]. Each question has question, options (4), correctAnswerIndex, explanation. Use lesson context: ${lessonContent ? lessonContent.slice(0, 1500) : 'not provided'}`;
  const responseText = await callGroq({ prompt, model: QUIZ_MODEL, jsonMode: true });
  return parseJSON(responseText, { title: `Quiz: ${context}`, questions: [] });
};

module.exports = {
  generateCourse,
  generateLesson,
  generateQuiz,
};
