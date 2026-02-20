import { Router } from 'express';
import authRoutes from '../domains/auth/routes';
import userRoutes from '../domains/user/routes';
import tripRoutes from '../domains/trip/routes';
import sellerTripRoutes from '../domains/trip/sellerRoutes';
import courierRoutes from '../domains/courier/routes';
import healthRoutes from './health';
import { getMe } from '../domains/user/controllers/userController';
import { authenticateJWT } from '../middleware/authenticate';
import { asyncHandler } from '../shared/utils/asyncHandler';

const router = Router();

// GET /me (unifié) — avant les préfixes pour priorité
router.get('/me', authenticateJWT, asyncHandler(getMe));

// Routes de santé
router.use('/', healthRoutes);

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes utilisateur
router.use('/users', userRoutes);

// Routes trajets (création + liste + détail + annulation)
router.use('/trips', tripRoutes);

// Alias pour le front : "courses" = même resource que trips (liste, détail, création, annulation)
router.use('/courses', tripRoutes);

// Alias pour le front : "bookings" = même resource que trips (liste, détail, annulation)
router.use('/bookings', tripRoutes);

// Détail course vendeur (GET /seller/trips/:id, rôle seller + ownership)
router.use('/seller/trips', sellerTripRoutes);

// Routes livreurs (compte, settle)
router.use('/couriers', courierRoutes);

export default router;
