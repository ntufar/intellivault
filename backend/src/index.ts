import express from "express";
import { listDocuments } from "./api/routes/documents.get";
import { uploadDocument } from "./api/routes/documents.post";
import { search } from "./api/routes/search.get";
import { qa } from "./api/routes/qa.post";

const app = express();
app.use(express.json());

app.get("/v1/documents", listDocuments);
app.post("/v1/documents", uploadDocument);
app.get("/v1/search", search);
app.post("/v1/qa", qa);

if (require.main === module) {
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`IntelliVault API listening on :${port}`);
  });
}

export default app;
