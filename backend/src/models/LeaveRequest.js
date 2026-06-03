const mongoose = require('mongoose');

const LeaveRequestSchema = new mongoose.Schema({

    employee_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    leave_type: {
        type: String,
        enum: ['annual', 'sick', 'emergency', 'unpaid'],
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    days_count: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    reviewed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    rejection_reason: {
        type: String,
        default: null
    }


}, { timestamps: true });
module.exports = mongoose.model('LeaveRequest', LeaveRequestSchema);