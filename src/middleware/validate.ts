import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { normalizePhone } from '../shared/utils/phoneValidator';
import { validationErrorResponse } from '../shared/responses/apiResponse';

/**
 * Middleware pour vérifier les résultats de validation
 * Doit être utilisé après les validateurs express-validator
 */
export function checkValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors: Record<string, string> = {};
    errors.array().forEach((error) => {
      if (error.type === 'field') {
        formattedErrors[error.path] = error.msg;
      }
    });

    validationErrorResponse(res, formattedErrors);
    return;
  }

  // Le téléphone a été normalisé par le sanitizer, on le remet dans le body
  if (req.body.phone) {
    req.body.phone = normalizePhone(req.body.phone);
  }

  next();
}
