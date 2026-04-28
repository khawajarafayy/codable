import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" }
}, { timestamps: true });

adminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
}

adminSchema.methods.generateToken = function () {
  return jwt.sign({ userId: this._id.toString(), email: this.email, name: this.name, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '10d' });
}

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

export default Admin;
