const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, isHR, isAdmin } = require('../middlewares/authMiddleware');
const { validateCreateEmployee, validateUpdateEmployee } = require('../validators/employeeValidator');

// All routes need a valid token
router.use(authenticate);

router.get('/me', employeeController.getMyProfile);           
router.get('/', isHR, employeeController.getAllEmployees);
router.get('/:id', isHR, employeeController.getEmployee);   
router.post('/', isHR, validateCreateEmployee, employeeController.createEmployee);
router.put('/:id', isHR, validateUpdateEmployee, employeeController.updateEmployee); 
router.delete('/:id', isAdmin, employeeController.deleteEmployee);

module.exports = router;