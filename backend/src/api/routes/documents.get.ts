import type { Request, Response } from "express";

export async function listDocuments(_req: Request, res: Response) {
  res.json({ documents: [] });
}


