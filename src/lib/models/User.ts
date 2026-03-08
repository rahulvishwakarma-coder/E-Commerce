import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  clerkId?: string;
  username: string;
  email: string;
  password?: string;
  avatar_url?: string;
  bio?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  created_at: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    clerkId: { type: String, unique: true, sparse: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    avatar_url: { type: String, default: "" },
    bio: { type: String, default: "" },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Hash password before saving
UserSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  
  try {
    this.password = await bcrypt.hash(this.password, 10);
  } catch (error: any) {
    throw new Error(error);
  }
});

// Method to check password validity
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
