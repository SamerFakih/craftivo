import Joi from 'joi';

// Environment variables validation schema (fail fast on invalid config)
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  FRONTEND_URL: Joi.string().uri().required(),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),

  // AI (optional)
  GEMINI_API_KEY: Joi.string().optional(),

  // Mail (all optional: if absent we fall back to Ethereal or log-only mode)
  MAIL_HOST: Joi.string().optional(),
  MAIL_PORT: Joi.number().integer().min(1).max(65535).optional(),
  MAIL_USER: Joi.string().optional(),
  MAIL_PASS: Joi.string().optional(),
  MAIL_FROM: Joi.string().optional(),
  APP_BASE_URL: Joi.string().uri().optional(),

  // Invoices ingest automation (required to enable the automation route)
  INCOICES_INGEST_API_KEY: Joi.any().forbidden().messages({
    'any.unknown':
      'INCOICES_INGEST_API_KEY is a typo; use INVOICES_INGEST_API_KEY instead',
  }),
  INVOICES_INGEST_API_KEY: Joi.string().min(32).required(),
  INVOICES_INGEST_USER_ID: Joi.number().integer().positive().required(),
});
