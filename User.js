const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'Name is required'],
      trim: true 
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    passwordHash: { 
      type: String, 
      required: [true, 'Password hash is required'] 
    },
    
    // Skills Matrix
    skills: [{
      name: { type: String, required: true },
      proficiency: { type: Number, default: 0, min: 0, max: 100 }
    }],

    // Targeted Company Roadmap
    targetCompany: { type: String, default: 'D. E. Shaw' },
    companyRoadmap: [{
      stepTitle: { type: String, required: true },
      category: { type: String, enum: ['Core CS', 'DSA', 'System Design', 'HR'] },
      completed: { type: Boolean, default: false }
    }],

    // Goals & Tracker
    weeklyGoals: [{
      goalText: { type: String, required: true },
      isCompleted: { type: Boolean, default: false }
    }],
    dsaTopics: [{
      topicName: { type: String, required: true },
      solvedCount: { type: Number, default: 0 },
      totalCount: { type: Number, default: 10 },
      isMastered: { type: Boolean, default: false }
    }],

    // Resume Profile Metadata
    resumeUrl: { type: String, default: '' },
    resumeTextSummary: { type: String, default: '' },

    // Gamification & Streaks
    streakCount: { type: Number, default: 1 },
    lastActiveDate: { type: Date, default: Date.now },

    // AI Mock Interview Logs
    mockInterviewLogs: [{
      question: { type: String, required: true },
      userAnswer: { type: String, required: true },
      aiFeedback: { type: String, required: true },
      score: { type: Number, required: true, min: 0, max: 10 },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);