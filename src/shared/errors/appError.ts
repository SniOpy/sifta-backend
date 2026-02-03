/**
 * Classe de base pour les erreurs personnalisées de l'application
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintenir la stack trace pour le débogage
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreur de validation
 */
export class ValidationError extends AppError {
  public readonly details?: Record<string, string>;

  constructor(message: string, details?: Record<string, string>) {
    super(message, 400);
    this.details = details;
    this.name = 'ValidationError';
  }
}

/**
 * Erreur pour ressource non trouvée
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Ressource non trouvée') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Erreur d'authentification
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Non autorisé') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Erreur d'accès interdit
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Accès interdit') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Erreur de conflit (ex: ressource déjà existante)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Conflit') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Erreur de trop de requêtes (rate limiting)
 */
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Trop de requêtes') {
    super(message, 429);
    this.name = 'TooManyRequestsError';
  }
}

/**
 * Erreur interne du serveur
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Erreur interne du serveur') {
    super(message, 500);
    this.name = 'InternalServerError';
  }
}
