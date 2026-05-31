const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, isHR } = require('../middlewares/authMiddleware');
 
// Public/Employee routes (requires authentication only)
router.get('/me', authenticate, employeeController.getMyProfile);
 
// HR/Admin routes (requires HR or Admin role)
router.get('/', authenticate, isHR, employeeController.getAllEmployees);
router.get('/stats', authenticate, isHR, employeeController.getStats);
router.get('/departments', authenticate, isHR, employeeController.getDepartments);
router.get('/job-roles', authenticate, isHR, employeeController.getJobRoles);
router.get('/:id', authenticate, isHR, employeeController.getEmployee);
router.post('/', authenticate, isHR, employeeController.createEmployee);
router.put('/:id', authenticate, isHR, employeeController.updateEmployee);
router.delete('/:id', authenticate, isHR, employeeController.deleteEmployee);
router.patch('/:id/deactivate', authenticate, isHR, employeeController.deactivateEmployee);
router.patch('/:id/activate', authenticate, isHR, employeeController.activateEmployee);

router.get('/', authenticate, isHR, (req, res, next) => {
  console.log(' Employee route accessed by:', req.user);
  next();
}, employeeController.getAllEmployees);
 
module.exports = router;
 