import { Request, Response, NextFunction } from "express";

export default (err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500);
  res.json({
    global: [ err?.message && process.env.HIDE_EXCEPTIONS !== 'yes' ? err.message : 'api.validation.fatalError' ],
  });
};
