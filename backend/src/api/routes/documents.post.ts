import type { Request, Response } from "express";

export async function uploadDocument(_req: Request, res: Response) {
  res.status(202).json({ job: { id: "job_queued" } });
}


