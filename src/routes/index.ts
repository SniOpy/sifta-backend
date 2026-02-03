import { Router } from 'express';
import authRoutes from '../domains/auth/routes';
import healthRoutes from './health';

const router = Router();

// Routes de santé
router.use('/', healthRoutes);

// Routes d'authentification
router.use('/auth', authRoutes);

export default router;
