import type { NextFunction, Request, RequestHandler, Response } from "express";

export const asyncHandler = (reqHandler: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(reqHandler(req, res, next)).catch((error) => next(error));
  };
};
