const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    emplotee_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    check_out: {
        type: String,
        default: null
    },
    working_hours: {
        type: Number,
        default:0
    },
    status: {
        type: String,
        enum: ['Present' , 'Absent', 'Late', 'half_day'],
        default: 'Absent'
    },
    notes: {
        type: String,
        default: null
    }
},{ timestamps: true });
attendanceSchema.index({ employee_id: 1, date: 1} , { unique: true});
module.exports = mongoose.model('Attendance', attendanceSchema);