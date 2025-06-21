const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resumeSchema = new Schema({
    fileUrl: {
        type: String,
        required: false  // make it required if necessary
    },
    title: {
        type: String,
        required: true
    },
    summary: String,
    skills: [String],
    education: [
        {
            institution: String,
            degree: String,
            field: String,
            startYear: Number,
            endYear: Number
        }
    ],
    experience: [
        {
            company: String,
            role: String,
            startDate: Date,
            endDate: Date,
            description: String
        }
    ],
    project: [
        {
            name: String,
            description: String
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    candidate: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    score: {
        type: Number,
        min: 0,
        max: 100,
        default: null
    },
    scoreMap: {
    type: Map,
    of: Number, // jobId -> score (0–100)
    default: {},
    }

    }, { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
