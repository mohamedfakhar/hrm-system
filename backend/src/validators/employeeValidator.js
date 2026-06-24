const Joi = require('joi');

//  Schema Definitions 
const createEmployeeSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.email': 'Enter a valid email',
        'any.required': 'Email is required',
        'string.empty': 'Email is required'
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

    department: Joi.string().max(100).optional().allow(''),
    phone: Joi.string().pattern(/^\+?[\d\s\-]{7,15}$/).optional().allow('').messages({
        'string.pattern.base': 'Enter a valid phone number'
    }),
    address: Joi.string().max(300).optional().allow(''),

    basic_salary: Joi.number().positive().required().messages({
        'number.positive': 'Salary must be greater than 0',
        'any.required': 'Basic salary is required'
    }),

    hire_date: Joi.date().iso().required().messages({
        'date.format': 'Date format must be YYYY-MM-DD',
        'any.required': 'Hire date is required'
    }),

    annual_leave_balance: Joi.number().integer().min(0).max(365).optional()
});

const updateEmployeeSchema = Joi.object({
    full_name: Joi.string().min(2).max(100).optional(),
    job_role: Joi.string().max(100).optional(),
    department: Joi.string().max(100).optional().allow(''),
    phone: Joi.string().pattern(/^\+?[\d\s\-]{7,15}$/).optional().allow(''),
    address: Joi.string().max(300).optional().allow(''),
    basic_salary: Joi.number().positive().optional(),
    hire_date: Joi.date().iso().optional(),
    annual_leave_balance: Joi.number().integer().min(0).max(365).optional()
}).min(1).messages({
    'object.min': 'Provide at least one field to update'
});

//  Middleware Factory 
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
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