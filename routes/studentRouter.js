import express from 'express';
import { body } from 'express-validator';
import { signup, login } from '../controllers/shared/shareController';

const studentRouter = express.Router();
import auth from '../middlewares/is-auth';

studentRouter.post(
  '/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password is too shot'),
    body('accountType').notEmpty().withMessage('Invalid Account Type'),
  ],
  signup
);
studentRouter.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password is too short'),
    body('accountType').notEmpty().withMessage('Invalid Account Type'),
  ],
  login
);



export default studentRouter ;
