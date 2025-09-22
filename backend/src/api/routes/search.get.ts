import type { Request, Response } from "express";

export async function search(_req: Request, res: Response) {
  res.json({ results: [] });
}


