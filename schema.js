// schema.js
const Joi = require("joi");

module.exports.jobSchema = Joi.object({
  title: Joi.string().required(),
  company: Joi.string().required(),
  location: Joi.string().required(),
  salary: Joi.number().min(0).required(),
  description: Joi.string().required(),
  // note: file upload is handled by multer, not Joi
});

module.exports.userSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('admin', 'candidate', 'recruiter').required(),
});

module.exports.resumeSchema = Joi.object({
  title: Joi.string().required(),
  summary: Joi.string().allow(''),
  skills: Joi.array().items(Joi.string()).default([]),
});

module.exports.applicationSchema = Joi.object({
  job: Joi.string().required(),
  resume: Joi.string().required(),
  // candidate is set from logged-in user
  note: Joi.string().allow(''),
  message: Joi.string().allow(''),
});
