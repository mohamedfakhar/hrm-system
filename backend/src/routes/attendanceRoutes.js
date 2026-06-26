const express = require('express');
const router  = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, isHR } = require('../middlewares/authMiddleware');
const { validateGetAttendance } = require('../validators/attendanceValidator');

router.use(authenticate);

router.post('/checkin',  attendanceController.checkIn);        
router.post('/checkout', attendanceController.checkOut);       
router.get('/me',  attendanceController.getMyAttendance);
router.get('/today', attendanceController.getTodayStatus); 
router.get('/', isHR, validateGetAttendance, attendanceController.getAllAttendance);

module.exports = router;