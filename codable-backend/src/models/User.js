import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "instructor"], default: "student" },
  googleId: { type: String, default: null },
  avatar: { type: String, default: null },
  authProvider: { type: String, enum: ["local", "google"], default: "local" },
}, { timestamps: true });

userSchema.pre('save', async function () {
    // Skip password hashing for Google auth users or if password not modified
    if (!this.isModified('password') || this.authProvider === 'google') {
        return;
    }

    const saltRound = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, saltRound);
});

userSchema.methods.comparePassword = async function (plainPassword) {
    try {
        return bcrypt.compare(plainPassword, this.password);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

userSchema.methods.generateToken = async function () {
    try {
        return jwt.sign({
            userId: this._id.toString(),
            email: this.email
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "10d"
        }
        )
    } catch (error) {
        console.error(error);
        
    }
}

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;