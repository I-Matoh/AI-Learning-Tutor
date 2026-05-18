'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { sanitize } = require('../middleware/validation');
const {
  generateCourseRequestSchema,
  generateLessonRequestSchema,
  generateQuizRequestSchema,
  courseResponseSchema,
  quizResponseSchema,
} = require('../middleware/generationSchemas');
const { generateCourse, generateLesson, generateQuiz } = require('../services/generationService');
const { supabaseAdmin } = require('../config/supabaseAdmin');

const router = express.Router();

const DAILY_LIMIT = parseInt(process.env.GROQ_DAILY_LIMIT || '15', 10);

const recordUsageEvent = async ({ userId, eventType, meta = {} }) => {
  const { error } = await supabaseAdmin.from('usage_events').insert({
    user_id: userId,
    event_type: eventType,
    event_meta: meta,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.warn('[usage_events] insert failed:', error.message);
  }
};

const getUsageCount = async (userId) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { count, error } = await supabaseAdmin
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start.toISOString())
    .in('event_type', ['generate_course', 'generate_lesson', 'generate_quiz']);

  if (error) {
    console.warn('[usage_events] count failed:', error.message);
    return 0;
  }

  return count || 0;
};

const enforceQuota = async (userId, res) => {
  const used = await getUsageCount(userId);
  if (used >= DAILY_LIMIT) {
    res.status(429).json({
      error: {
        code: 'QUOTA_EXCEEDED',
        message: 'Daily generation quota exceeded.',
        details: {
          dailyLimit: DAILY_LIMIT,
          dailyGenerations: used,
          resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    });
    return false;
  }

  return true;
};

router.get('/profile', authMiddleware, (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
    },
  });
});

router.get('/usage', authMiddleware, async (req, res) => {
  const dailyGenerations = await getUsageCount(req.user.id);

  return res.json({
    usage: {
      dailyGenerations,
      dailyLimit: DAILY_LIMIT,
      resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });
});

router.post('/validate-topic', authMiddleware, (req, res) => {
  const { topic } = req.body || {};

  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ valid: false, error: 'Topic is required' });
  }

  const sanitized = sanitize.string(topic);

  if (sanitized.length < 2) {
    return res.status(400).json({ valid: false, error: 'Topic must be at least 2 characters' });
  }

  if (sanitized.length > 200) {
    return res.status(400).json({ valid: false, error: 'Topic must be less than 200 characters' });
  }

  return res.json({ valid: true, sanitized });
});

router.post('/generate/course', authMiddleware, async (req, res) => {
  const parsed = generateCourseRequestSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request payload', details: parsed.error.flatten() } });
  }

  if (!(await enforceQuota(req.user.id, res))) return;

  try {
    const course = await generateCourse(parsed.data);
    const validated = courseResponseSchema.parse(course);
    await recordUsageEvent({ userId: req.user.id, eventType: 'generate_course', meta: { topic: parsed.data.topic } });
    return res.json({ data: validated });
  } catch (error) {
    console.error('[generate/course] error', error);
    return res.status(500).json({ error: { code: 'GENERATION_FAILED', message: 'Unable to generate course right now.' } });
  }
});

router.post('/generate/lesson', authMiddleware, async (req, res) => {
  const parsed = generateLessonRequestSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request payload', details: parsed.error.flatten() } });
  }

  if (!(await enforceQuota(req.user.id, res))) return;

  try {
    const content = await generateLesson(parsed.data);
    await recordUsageEvent({ userId: req.user.id, eventType: 'generate_lesson', meta: { lessonTitle: parsed.data.lessonTitle } });
    return res.json({ data: { content } });
  } catch (error) {
    console.error('[generate/lesson] error', error);
    return res.status(500).json({ error: { code: 'GENERATION_FAILED', message: 'Unable to generate lesson right now.' } });
  }
});

router.post('/generate/quiz', authMiddleware, async (req, res) => {
  const parsed = generateQuizRequestSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request payload', details: parsed.error.flatten() } });
  }

  if (!(await enforceQuota(req.user.id, res))) return;

  try {
    const quiz = await generateQuiz(parsed.data);
    const validated = quizResponseSchema.parse(quiz);
    await recordUsageEvent({ userId: req.user.id, eventType: 'generate_quiz', meta: { context: parsed.data.context } });
    return res.json({ data: validated });
  } catch (error) {
    console.error('[generate/quiz] error', error);
    return res.status(500).json({ error: { code: 'GENERATION_FAILED', message: 'Unable to generate quiz right now.' } });
  }
});

router.get('/health', authMiddleware, (req, res) => {
  return res.json({
    status: 'healthy',
    authenticated: true,
    userId: req.user.id,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
