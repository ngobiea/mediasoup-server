import { validationResult } from 'express-validator';

import bcrypt from 'bcryptjs';
import User from '../../../model/userModel.js';
import { statusCode } from '../../../util/statusCodes.js';

export const signup = async (req, res, next)=> {
  let newUser;
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new Error('Validation failed');
      error.statusCode = statusCode.UNPROCESSABLE_ENTITY;
      error.data = errors.array();
      throw error;
    }
    const {  accountType, email, password } =
      req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error(
        'A user with this email already exists. Login or choose another email'
      );
      error.statusCode = statusCode.CONFLICT;
      error.type = 'email';
      throw error;
    }
    const hashedPassword = await bcrypt.hash(
      password,
      parseFloat(process.env.SALT)
    );
    newUser = new User({
      email,
      password: hashedPassword,
      role: accountType,
    });
    await newUser.save(); 
    res
      .status(statusCode.CREATED)
      .json({ message: `New ${accountType} created` });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = statusCode.INTERNAL_SERVER_ERROR;
    }
    next(err);
  }
}
