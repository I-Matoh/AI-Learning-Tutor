'use strict';

const { z } = require('zod');

const skillLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate');

const generateCourseRequestSchema = z.object({
  topic: z.string().trim().min(2).max(200),
  skillLevel: skillLevelSchema.optional(),
});

const generateLessonRequestSchema = z.object({
  courseTitle: z.string().trim().min(2).max(200),
  moduleTitle: z.string().trim().min(2).max(200),
  lessonTitle: z.string().trim().min(2).max(200),
  previousLessons: z.array(z.string().trim().min(1).max(200)).max(20).optional().default([]),
});

const generateQuizRequestSchema = z.object({
  courseTitle: z.string().trim().min(2).max(200),
  context: z.string().trim().min(2).max(250),
  lessonContent: z.string().max(12000).optional(),
});

const lessonSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  isCompleted: z.boolean(),
  isLocked: z.boolean(),
  content: z.string().optional(),
});

const moduleSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  lessons: z.array(lessonSchema).min(1),
});

const courseResponseSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  createdAt: z.number(),
  modules: z.array(moduleSchema).min(1),
});

const quizResponseSchema = z.object({
  title: z.string().min(1),
  questions: z.array(z.object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).length(4),
    correctAnswerIndex: z.number().int().min(0).max(3),
    explanation: z.string().min(1),
  })).min(1),
});

module.exports = {
  generateCourseRequestSchema,
  generateLessonRequestSchema,
  generateQuizRequestSchema,
  courseResponseSchema,
  quizResponseSchema,
};
