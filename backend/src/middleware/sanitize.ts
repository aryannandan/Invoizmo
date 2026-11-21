import type { Request, Response, NextFunction } from 'express';

/**
 * Express 5 compatible NoSQL sanitization middleware.
 * Strips keys beginning with '$' or containing '.' recursively.
 */
function clean(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(clean);
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Drop keys that start with '$' or contain '.'
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    cleaned[key] = clean(value);
  }
  return cleaned;
}

export function mongoSanitizeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = clean(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = clean(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = clean(req.params);
  }
  next();
}
