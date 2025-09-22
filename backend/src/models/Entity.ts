import { z } from "zod";

export enum EntityType {
  Person = "person",
  Org = "org",
  Location = "location",
  Date = "date",
  Money = "money",
  Other = "other",
}

export const EntitySchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(EntityType),
  value: z.string().min(1),
  canonical_id: z.string().uuid().nullable(),
});

export type Entity = z.infer<typeof EntitySchema>;


