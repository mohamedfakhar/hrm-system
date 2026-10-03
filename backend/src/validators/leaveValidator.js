const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: error.details.map(e => ({ field: e.path[0], message: e.message }))
        });
    }
    next();
};

const createLeaveSchema = Joi.object({
    leave_type: Joi.string()
        .valid('annual', 'sick', 'emergency', 'unpaid')
        .required().messages({
            'any.only': 'Type must be: annual, sick, emergency, or unpaid',
            'any.required': 'Leave type is required'
        }),

    start_date: Joi.date().iso().required().messages({
        'date.format': 'Start date format: YYYY-MM-DD',
        'any.required': 'Start date is required'
    }),

    end_date: Joi.date().iso().min(Joi.ref('start_date')).required().messages({
        'date.format': 'End date format: YYYY-MM-DD',
        'date.min': 'End date must be after start date',
        'any.required': 'End date is required'
    }),

    reason: Joi.string().max(500).optional().allow('')
});

const rejectLeaveSchema = Joi.object({
    rejection_reason: Joi.string().max(500).optional().allow('')
});

exports.validateCreateLeave = validate(createLeaveSchema);
exports.validateRejectLeave = validate(rejectLeaveSchema);