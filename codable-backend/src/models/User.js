import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "instructor"], default: "student" },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
    const user = this;

    if(!user.modifiedPaths){
        next();
    }

    try {
        const saltRound = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, saltRound);
        user.password = hashedPassword;
    } catch (error) {
        next(error);
    }
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