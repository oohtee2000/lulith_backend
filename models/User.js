

const mongoose = require('mongoose');
console.log("✅ USER MODEL LOADED FROM:", __filename);




const userSchema = new mongoose.Schema({
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
        enum: ['user', 'admin', 'super_admin'],
        default: 'user',
    },

    // 🔐 Password reset fields
  resetPasswordToken: String,
  resetPasswordExpires: Date,
   
},
{timestamps: true});
console.log("✅ User enum:", userSchema.path("role").enumValues);
// module.exports = mongoose.model('User', userSchema);
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
// console.log("✅ User enum:", userSchema.path("role").enumValues);