import type { Request, Response } from "express";

export async function qa(_req: Request, res: Response) {
  res.json({ answer: "", citations: [] });
}


