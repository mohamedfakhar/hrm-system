const db = require('../config/db');

class Employee {

  // Get all employees with filters
  static async findAll(filter = {}) {
    try {
      let query = `
        SELECT 
          e.id,
          e.employee_code,
          e.full_name,
          e.job_role,
          e.department,
          e.basic_salary,
          e.annual_leave_balance,
          e.hire_date,
          e.phone,
          e.address,
          e.profile_picture,
          e.created_at,
          u.email,
          u.role,
          u.is_active
        FROM employees e
        INNER JOIN users u ON e.user_id = u.id
        WHERE 1=1
      `;

      const params = [];

      // Search
      if (filter.search) {
        query += ` AND (e.full_name LIKE ? OR e.employee_code LIKE ? OR u.email LIKE ?)`;
        const searchTerm = `%${filter.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Department
      if (filter.department) {
        query += ` AND e.department = ?`;
        params.push(filter.department);
      }

      // Job Role
      if (filter.job_role) {
        query += ` AND e.job_role = ?`;
        params.push(filter.job_role);
      }

      // Active status
      if (filter.is_active !== undefined) {
        query += ` AND u.is_active = ?`;
        params.push(filter.is_active);
      }

      query += ` ORDER BY e.created_at DESC`;

      const [rows] = await db.query(query, params);
      return rows;

    } catch (error) {
      console.error('Employee.findAll error:', error);
      throw error;
    }
  }

  // Get employee by ID
  static async findById(id) {
    try {
      const query = `
        SELECT 
          e.*,
          u.email,
          u.role,
          u.is_active,
          u.last_login
        FROM employees e
        INNER JOIN users u ON e.user_id = u.id
        WHERE e.id = ?
      `;

      const [rows] = await db.query(query, [id]);
      return rows[0] || null;

    } catch (error) {
      console.error('Employee.findById error:', error);
      throw error;
    }
  }

  // Get employee by user ID
  static async findByUserId(userId) {
    try {
      const query = `
        SELECT 
          e.*,
          u.email,
          u.role,
          u.is_active
        FROM employees e
        INNER JOIN users u ON e.user_id = u.id
        WHERE e.user_id = ?
      `;

      const [rows] = await db.query(query, [userId]);
      return rows[0] || null;

    } catch (error) {
      console.error('Employee.findByUserId error:', error);
      throw error;
    }
  }

  // Get employee by code
  static async findByEmployeeCode(employeeCode) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM employees WHERE employee_code = ?',
        [employeeCode]
      );
      return rows[0] || null;

    } catch (error) {
      console.error('Employee.findByEmployeeCode error:', error);
      throw error;
    }
  }

  // Create employee
  static async create(employeeData) {
    try {
      const {
        user_id,
        employee_code,
        full_name,
        job_role,
        department,
        basic_salary,
        annual_leave_balance = 21,
        hire_date,
        phone,
        address,
        profile_picture
      } = employeeData;

      const query = `
        INSERT INTO employees (
          user_id, employee_code, full_name, job_role, department,
          basic_salary, annual_leave_balance, hire_date, phone, address, profile_picture
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.query(query, [
        user_id,
        employee_code,
        full_name,
        job_role,
        department,
        basic_salary,
        annual_leave_balance,
        hire_date,
        phone,
        address,
        profile_picture
      ]);

      return { id: result.insertId, ...employeeData };

    } catch (error) {
      console.error('Employee.create error:', error);
      throw error;
    }
  }

  // Update employee
  static async update(id, employeeData) {
    try {
      const fields = [];
      const values = [];

      const allowedFields = [
        'full_name',
        'job_role',
        'department',
        'basic_salary',
        'annual_leave_balance',
        'hire_date',
        'phone',
        'address',
        'profile_picture'
      ];

      allowedFields.forEach(field => {
        if (employeeData[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(employeeData[field]);
        }
      });

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      values.push(id);

      const query = `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`;

      const [result] = await db.query(query, values);
      return result.affectedRows > 0;

    } catch (error) {
      console.error('Employee.update error:', error);
      throw error;
    }
  }

  // Delete employee (cascade)
  static async delete(id) {
    try {
      const employee = await this.findById(id);
      if (!employee) return false;

      const [result] = await db.query(
        'DELETE FROM users WHERE id = ?',
        [employee.user_id]
      );

      return result.affectedRows > 0;

    } catch (error) {
      console.error('Employee.delete error:', error);
      throw error;
    }
  }

  // Deactivate
  static async deactivate(id) {
    try {
      const employee = await this.findById(id);
      if (!employee) return false;

      const [result] = await db.query(
        'UPDATE users SET is_active = 0 WHERE id = ?',
        [employee.user_id]
      );

      return result.affectedRows > 0;

    } catch (error) {
      console.error('Employee.deactivate error:', error);
      throw error;
    }
  }

  // Activate
  static async activate(id) {
    try {
      const employee = await this.findById(id);
      if (!employee) return false;

      const [result] = await db.query(
        'UPDATE users SET is_active = 1 WHERE id = ?',
        [employee.user_id]
      );

      return result.affectedRows > 0;

    } catch (error) {
      console.error('Employee.activate error:', error);
      throw error;
    }
  }

  // Generate employee code
  static async generateEmployeeCode() {
    try {
      const [rows] = await db.query(
        'SELECT employee_code FROM employees ORDER BY id DESC LIMIT 1'
      );

      if (rows.length === 0) return 'EMP00001';

      const lastCode = rows[0].employee_code;
      const num = parseInt(lastCode.replace('EMP', '')) + 1;

      return `EMP${String(num).padStart(5, '0')}`;

    } catch (error) {
      console.error('Employee.generateEmployeeCode error:', error);
      throw error;
    }
  }

  // Stats
  static async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) AS total_employees,
          COUNT(CASE WHEN u.is_active = 1 THEN 1 END) AS active_employees,
          COUNT(CASE WHEN u.is_active = 0 THEN 1 END) AS inactive_employees,
          AVG(e.basic_salary) AS avg_salary,
          SUM(e.basic_salary) AS total_salary
        FROM employees e
        INNER JOIN users u ON e.user_id = u.id
      `;

      const [rows] = await db.query(query);
      return rows[0];

    } catch (error) {
      console.error('Employee.getStats error:', error);
      throw error;
    }
  }

  // Departments
  static async getDepartments() {
    try {
      const [rows] = await db.query(
        'SELECT DISTINCT department FROM employees WHERE department IS NOT NULL ORDER BY department'
      );
      return rows.map(r => r.department);

    } catch (error) {
      console.error('Employee.getDepartments error:', error);
      throw error;
    }
  }

  // Job roles
  static async getJobRoles() {
    try {
      const [rows] = await db.query(
        'SELECT DISTINCT job_role FROM employees WHERE job_role IS NOT NULL ORDER BY job_role'
      );
      return rows.map(r => r.job_role);

    } catch (error) {
      console.error('Employee.getJobRoles error:', error);
      throw error;
    }
  }
}

module.exports = Employee;