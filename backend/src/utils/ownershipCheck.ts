import { type Model, Types } from 'mongoose';

export class AppError extends Error {
  statusCode: number;
  code: string;
  fields?: Record<string, string[]>;

  constructor(message: string, statusCode: number, code: string, fields?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Asserts that a resource exists and belongs to the given user.
 * Always throws 404 (never 403) to prevent IDOR resource enumeration.
 */
export async function assertOwnership<T>(
  ModelClass: Model<T>,
  resourceId: string,
  userId: string,
  additionalFilter: Record<string, any> = {}
): Promise<T> {
  if (!Types.ObjectId.isValid(resourceId) || !Types.ObjectId.isValid(userId)) {
    throw new AppError('Resource not found', 404, 'NOT_FOUND');
  }

  const query = {
    _id: new Types.ObjectId(resourceId),
    userId: new Types.ObjectId(userId),
    ...additionalFilter,
  };

  const doc = await ModelClass.findOne(query);

  if (!doc) {
    throw new AppError('Resource not found', 404, 'NOT_FOUND');
  }

  return doc;
}
