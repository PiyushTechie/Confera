import express from 'express';
import { submitContactForm } from '../controllers/contactController.js';
import { apiLimiter } from '../middlewares/limiters.js';

const router = express.Router();

router.post('/', apiLimiter, submitContactForm);

export default router;
