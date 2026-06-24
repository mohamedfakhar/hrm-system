const express = require('express');
const router  = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticate, isHR } = require('../middlewares/authMiddleware');
const { validateCreateLeave, validateRejectLeave } = require('../validators/leaveValidator');

router.use(authenticate);

router.post('/',  leaveController.createLeave);  
router.get('/me',  leaveController.getMyLeaves);  
router.get('/',isHR, leaveController.getAllLeaves); 
router.put('/:id/approve', isHR,  leaveController.approveLeave); 
router.put('/:id/reject',  isHR,  leaveController.rejectLeave);  

module.exports = router;