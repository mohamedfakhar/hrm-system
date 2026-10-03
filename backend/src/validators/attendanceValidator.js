const Joi = require('joi');

const validate = (schema, target = 'body') => (req, res, next) => {
  const data = target === 'query' ? req.query : req.body;
  const { error } = schema.validate(data, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors:  error.details.map(e => ({ field: e.path[0], message: e.message }))
    });
  }
  next();
};

const getAttendanceSchema = Joi.object({
  date: Joi.date().iso().optional().messages({
    'date.format': 'Date format: YYYY-MM-DD'
  })
});

exports.validateGetAttendance = validate(getAttendanceSchema, 'query');