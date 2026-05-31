import type { NextFunction, Request, Response } from "express";
import type { AnyZodObject } from "zod";

export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    req.body = result.body ?? req.body;
    req.query = result.query ?? req.query;
    req.params = result.params ?? req.params;
    next();
  };
}
