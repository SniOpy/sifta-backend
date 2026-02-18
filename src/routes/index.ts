import { Router } from 'express';
import authRoutes from '../domains/auth/routes';
import userRoutes from '../domains/user/routes';
import tripRoutes from '../domains/trip/routes';
import courierRoutes from '../domains/courier/routes';
import healthRoutes from './health';

const router = Router();

// Routes de santé
router.use('/', healthRoutes);

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes utilisateur
router.use('/users', userRoutes);

// Routes trajets
router.use('/trips', tripRoutes);

// Routes livreurs (compte, settle)
router.use('/couriers', courierRoutes);

export default router;
