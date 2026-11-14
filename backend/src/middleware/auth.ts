import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
export type AuthUser = { id:string; workspaceId:string; role:string; email:string };
declare global { namespace Express { interface Request { user?: AuthUser } } }
export function auth(req:Request,res:Response,next:NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i,'');
  if (!token) return res.status(401).json({error:'Missing bearer token'});
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;
    next();
  } catch { return res.status(401).json({error:'Invalid or expired token'}); }
}
