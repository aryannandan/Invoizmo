export interface AuthUser {
  _id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  emailVerified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
