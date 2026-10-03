const Joi = require('joi');

const createEmployeeSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Enter a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  }),
  full_name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must be less than 100 characters',
    'any.required': 'Full name is required'
  }),
  job_role: Joi.string().max(100).required().messages({
    'any.required': 'Job role is required'
  }),
  department: Joi.string().max(100).optional().allow('', null),
  phone: Joi.string().pattern(/^\+?[\d\s\-]{7,20}$/).required().messages({
    'string.pattern.base': 'Enter a valid phone number (7-20 digits)',
    'any.required': 'Phone number is required'
  }),
  address: Joi.string().max(300).optional().allow('', null),
  basic_salary: Joi.number().positive().required().messages({
    'number.positive': 'Salary must be greater than 0',
    'any.required': 'Basic salary is required'
  }),
  hire_date: Joi.date().iso().required().messages({
    'date.format': 'Hire date must be in YYYY-MM-DD format',
    'any.required': 'Hire date is required'
  }),
  annual_leave_balance: Joi.number().integer().min(0).max(365).optional()
});

const updateEmployeeSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).optional(),
  job_role: Joi.string().max(100).optional(),
  department: Joi.string().max(100).optional().allow('', null),
  phone: Joi.string().pattern(/^\+?[\d\s\-]{7,20}$/).optional().allow('', null),
  address: Joi.string().max(300).optional().allow('', null),
  basic_salary: Joi.number().positive().optional(),
  hire_date: Joi.date().iso().optional(),
  annual_leave_balance: Joi.number().integer().min(0).max(365).optional()
}).min(1).messages({
  'object.min': 'Provide at least one field to update'
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: error.details.map(e => ({
        field: e.path[0],
        message: e.message
      }))
    });
  }
  next();
};

exports.validateCreateEmployee = validate(createEmployeeSchema);
exports.validateUpdateEmployee = validate(updateEmployeeSchema);