import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema({
  // Reference to User
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user', 
    required: true,
    unique: true 
  },

  // Profile Information
  fullName: { 
    type: String, 
    required: true,
    trim: true
  },
  
  avatar: { 
    type: String, 
    default: null // URL or base64
  },
  
  bio: { 
    type: String, 
    maxlength: 500,
    default: ''
  },
  
  location: {
    city: { type: String, default: '' },
    country: { type: String, default: '' }
  },
  
  membershipTier: {
    type: String,
    enum: ['free', 'pro', 'premium'],
    default: 'free'
  },
  
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' }
  }

}, { timestamps: true });

// Virtual for full location
studentProfileSchema.virtual('fullLocation').get(function() {
  const { city, country } = this.location;
  return [city, country].filter(Boolean).join(', ') || 'Not specified';
});

// Method to get initials for avatar fallback
studentProfileSchema.methods.getInitials = function() {
  const name = this.fullName || 'User';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Static method to create profile for new user
studentProfileSchema.statics.createForUser = async function(userId, userData) {
  const profile = new this({
    userId,
    fullName: userData.name || userData.email.split('@')[0],
    avatar: null,
    bio: '',
    location: { city: '', country: '' },
    membershipTier: 'free',
    socialLinks: { github: '', linkedin: '', twitter: '' }
  });
  
  return await profile.save();
};

// Ensure virtuals are included in JSON
studentProfileSchema.set('toJSON', { virtuals: true });
studentProfileSchema.set('toObject', { virtuals: true });

const StudentProfile = mongoose.model("StudentProfile", studentProfileSchema);

export default StudentProfile;