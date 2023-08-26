import { Schema as _Schema, model } from 'mongoose';
const Schema = _Schema;

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['tutor', 'student'],
    required: true,
  },
});

UserSchema.index({ email: 1, studentId: 1 }, { unique: true });

export default model('User', UserSchema);
