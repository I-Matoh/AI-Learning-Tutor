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

const getNextQuotaReset = () => {
  const resetAt = new Date();
  resetAt.setHours(24, 0, 0, 0);
  return resetAt.toISOString();
};

const consumeQuota = async ({ userId, eventType, meta = {} }) => {
  const { data, error } = await supabaseAdmin.rpc('consume_generation_quota', {
    p_user_id: userId,
    p_daily_limit: DAILY_LIMIT,
    p_event_type: eventType,
    p_event_meta: meta,
  });

  if (error) {
    throw new Error(`quota consume failed: ${error.message}`);
  }

  return data?.[0] || { granted: false, daily_used: 0, resets_at: getNextQuotaReset() };
};

const releaseQuota = async (userId) => {
  const { error } = await supabaseAdmin.rpc('release_generation_quota', {
    p_user_id: userId,
  });
  if (error) {
    console.warn('[quota] release failed:', error.message);
  }
};

const getUsageCount = async (userId) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const today = start.toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from('usage_daily_counters')
    .select('used_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .maybeSingle();

  if (error) {
    console.warn('[usage_daily_counters] read failed:', error.message);
    return 0;
  }
  return data?.used_count || 0;
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
      resetsAt: getNextQuotaReset(),
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

  let quotaSnapshot;
  try {
    quotaSnapshot = await consumeQuota({
      userId: req.user.id,
      eventType: 'generate_course',
      meta: { topic: parsed.data.topic },
    });
  } catch (error) {
    console.error('[generate/course] quota error', error);
    return res.status(503).json({ error: { code: 'USAGE_UNAVAILABLE', message: 'Usage service unavailable. Please retry shortly.' } });
  }

  if (!quotaSnapshot.granted) {
    return res.status(429).json({
      error: {
        code: 'QUOTA_EXCEEDED',
        message: 'Daily generation quota exceeded.',
        details: {
          dailyLimit: DAILY_LIMIT,
          dailyGenerations: quotaSnapshot.daily_used || DAILY_LIMIT,
          resetsAt: quotaSnapshot.resets_at || getNextQuotaReset(),
        },
      },
    });
  }

  try {
    const course = await generateCourse(parsed.data);
    const validated = courseResponseSchema.parse(course);
    return res.json({ data: validated });
  } catch (error) {
    await releaseQuota(req.user.id);
    console.error('[generate/course] error', error);
    return res.status(500).json({ error: { code: 'GENERATION_FAILED', message: 'Unable to generate course right now.' } });
  }
});

router.post('/generate/lesson', authMiddleware, async (req, res) => {
  const parsed = generateLessonRequestSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request payload', details: parsed.error.flatten() } });
  }

  let quotaSnapshot;
  try {
    quotaSnapshot = await consumeQuota({
      userId: req.user.id,
      eventType: 'generate_lesson',
      meta: { lessonTitle: parsed.data.lessonTitle },
    });
  } catch (error) {
    console.error('[generate/lesson] quota error', error);
    return res.status(503).json({ error: { code: 'USAGE_UNAVAILABLE', message: 'Usage service unavailable. Please retry shortly.' } });
  }

  if (!quotaSnapshot.granted) {
    return res.status(429).json({
      error: {
        code: 'QUOTA_EXCEEDED',
        message: 'Daily generation quota exceeded.',
        details: {
          dailyLimit: DAILY_LIMIT,
          dailyGenerations: quotaSnapshot.daily_used || DAILY_LIMIT,
          resetsAt: quotaSnapshot.resets_at || getNextQuotaReset(),
        },
      },
    });
  }

  try {
    const content = await generateLesson(parsed.data);
    return res.json({ data: { content } });
  } catch (error) {
    await releaseQuota(req.user.id);
    console.error('[generate/lesson] error', error);
    return res.status(500).json({ error: { code: 'GENERATION_FAILED', message: 'Unable to generate lesson right now.' } });
  }
});

router.post('/generate/quiz', authMiddleware, async (req, res) => {
  const parsed = generateQuizRequestSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request payload', details: parsed.error.flatten() } });
  }

  let quotaSnapshot;
  try {
    quotaSnapshot = await consumeQuota({
      userId: req.user.id,
      eventType: 'generate_quiz',
      meta: { context: parsed.data.context },
    });
  } catch (error) {
    console.error('[generate/quiz] quota error', error);
    return res.status(503).json({ error: { code: 'USAGE_UNAVAILABLE', message: 'Usage service unavailable. Please retry shortly.' } });
  }

  if (!quotaSnapshot.granted) {
    return res.status(429).json({
      error: {
        code: 'QUOTA_EXCEEDED',
        message: 'Daily generation quota exceeded.',
        details: {
          dailyLimit: DAILY_LIMIT,
          dailyGenerations: quotaSnapshot.daily_used || DAILY_LIMIT,
          resetsAt: quotaSnapshot.resets_at || getNextQuotaReset(),
        },
      },
    });
  }

  try {
    const quiz = await generateQuiz(parsed.data);
    const validated = quizResponseSchema.parse(quiz);
    return res.json({ data: validated });
  } catch (error) {
    await releaseQuota(req.user.id);
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
