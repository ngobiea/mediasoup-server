import { Router } from 'express';
const shareRouter = Router();
import {
  logout,
} from '../controllers/shared/shareController';

shareRouter.post('/logout', logout);

export default shareRouter;
