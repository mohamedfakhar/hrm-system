const assistantService = require('../services/assistantService');

// POST /api/intelligence/assistant/chat
exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    const result = await assistantService.processQuery(req.user.id, message);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/intelligence/assistant/logs
exports.getLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await assistantService.getAuditLogs(limit);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};
