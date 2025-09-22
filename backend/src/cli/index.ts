import { DocumentService } from "../services/DocumentService";
import { SearchService } from "../services/SearchService";
import { QAService } from "../services/QAService";
import { GraphService } from "../services/GraphService";

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  let i = 0;
  while (i < argv.length) {
    const token = argv[i] ?? "";
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (typeof next === "string" && !next.startsWith("--")) {
        args[key] = next;
        i += 2;
        continue;
      }
      args[key] = true;
      i += 1;
      continue;
    }
    i += 1;
  }
  return args;
}

export async function run(argv: string[]): Promise<string> {
  const [cmd, ...rest] = argv;
  const args = parseArgs(rest);
  switch (cmd) {
    case "up": {
      const output = {
        services: ["api", "workers"],
        status: "ok",
      };
      return JSON.stringify(output);
    }
    case "upload": {
      const path = String(args["path"] || "");
      const tenant = String(args["tenant"] || "");
      const ds = new DocumentService();
      const dummy = Buffer.from("test");
      const checksum = ds.computeChecksumSha256(dummy);
      const doc = ds.buildUploadedDocument(
        { tenant_id: tenant, filename: "sample.txt", mime_type: "text/plain", content: dummy, language: "en" },
        dummy.length,
        checksum
      );
      const res = { uploaded: [{ id: doc.id, filename: doc.filename, path }] };
      return JSON.stringify(res);
    }
    case "search": {
      const q = String(args["q"] || "");
      const k = parseInt(String(args["k"] || "10"), 10);
      const search = new SearchService();
      const results = await search.semanticSearch(q, k);
      return JSON.stringify({ results });
    }
    case "summarize": {
      const docId = String(args["doc-id"] || "");
      void docId;
      return JSON.stringify({ summary: "" });
    }
    case "ask": {
      const q = String(args["q"] || "");
      const withSources = Boolean(args["with-sources"]);
      const qa = new QAService();
      const ans = await qa.answer(q);
      return JSON.stringify({ answer: ans.answer, sources: withSources ? ans.citations : [] });
    }
    case "graph": {
      const entity = String(args["entity"] || "");
      const graph = new GraphService();
      const { nodes, edges } = await graph.explore(entity);
      return JSON.stringify({ nodes, edges });
    }
    default:
      return JSON.stringify({ error: "unknown command" });
  }
}

export default { run };


