const mongoose = require('mongoose');

const userShema = new mongoose.Schema({
    name: {
        type: String,  
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true

    },
    password: {
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },

    // 🔐 Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date,
   
},
{timestamps: true});

module.exports = mongoose.model('User', userShema);