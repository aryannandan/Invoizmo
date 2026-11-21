import type { Request, Response, NextFunction } from 'express';

/**
 * Express 5 compatible in-place NoSQL sanitization middleware.
 * Removes any keys beginning with '$' or containing '.' in-place
 * to respect Express 5's read-only getter for `req.query`.
 */
function cleanInPlace(obj: any): void {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      cleanInPlace(item);
    }
    return;
  }

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else {
      cleanInPlace(obj[key]);
    }
  }
}

export function mongoSanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    cleanInPlace(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    cleanInPlace(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    cleanInPlace(req.params);
  }
  next();
}
