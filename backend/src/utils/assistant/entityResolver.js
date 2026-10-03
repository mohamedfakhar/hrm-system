const mongoose = require('mongoose');
const Employee = require('../../models/Employee');
const { transliterateArabicName } = require('./arabicNormalizer');

/**
 * Entity Resolver Utility
 * Resolves an employee search query to a distinct employee record or handles ambiguity.
 * Supports Mongo ID, canonical Employee Code (EMP0001), English name, and Arabic name transliteration.
 * 
 * @param {string} query Search string (ID, code, or name)
 * @returns {Promise<{employee?: object, ambiguous?: boolean, candidates?: Array, notFound?: boolean}>}
 */
async function resolveEmployee(query) {
  if (!query || !query.trim()) {
    return { notFound: true, query };
  }

  const cleanQuery = query.trim();

  // 1. Direct Mongo ID
  if (mongoose.Types.ObjectId.isValid(cleanQuery) && cleanQuery.length === 24) {
    const emp = await Employee.findById(cleanQuery).select(
      '_id employee_code full_name job_role department hire_date basic_salary'
    );
    if (emp) return { employee: emp };
  }

  // 2. Direct Employee Code (exact case-insensitive match)
  const byCode = await Employee.findOne({
    employee_code: new RegExp(`^${cleanQuery}$`, 'i')
  }).select('_id employee_code full_name job_role department hire_date basic_salary');

  if (byCode) return { employee: byCode };

  // 3. Name Match (contains search)
  const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const byName = await Employee.find({
    full_name: new RegExp(escapedQuery, 'i')
  }).select('_id employee_code full_name job_role department hire_date basic_salary');

  if (byName.length === 1) {
    return { employee: byName[0] };
  }

  if (byName.length > 1) {
    return {
      ambiguous: true,
      candidates: byName.map((e) => ({
        id: e._id,
        code: e.employee_code,
        name: e.full_name,
        department: e.department,
        job_role: e.job_role
      }))
    };
  }

  // 4. Arabic Transliteration Match (e.g. "أحمد" -> "Ahmed", "سارة" -> "Sara")
  const transliterated = transliterateArabicName(cleanQuery);
  if (transliterated) {
    const escapedTrans = transliterated.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const byTrans = await Employee.find({
      full_name: new RegExp(escapedTrans, 'i')
    }).select('_id employee_code full_name job_role department hire_date basic_salary');

    if (byTrans.length === 1) {
      return { employee: byTrans[0] };
    }

    if (byTrans.length > 1) {
      return {
        ambiguous: true,
        candidates: byTrans.map((e) => ({
          id: e._id,
          code: e.employee_code,
          name: e.full_name,
          department: e.department,
          job_role: e.job_role
        }))
      };
    }
  }

  return { notFound: true, query: cleanQuery };
}

module.exports = {
  resolveEmployee
};
