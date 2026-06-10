const express = require('express');
const router = express.Router();

const employeeController = require('../controllers/employeeController');
const { authenticate, isHR, isAdmin } = require('../middlewares/authMiddleware');

// All routes need a valid token
router.use(authenticate);

router.get('/me', employeeController.getMyProfile);           
router.get('/', isHR, employeeController.getAllEmployees);
router.get('/:id', isHR, employeeController.getEmployee);   
router.post('/', isHR, employeeController.createEmployee);
router.put('/:id', isHR, employeeController.updateEmployee); 
router.delete('/:id', isAdmin, employeeController.deleteEmployee);

module.exports = router;