export type GraphNode = { id: string; label: string; type: string };
export type GraphEdge = { id: string; source_id: string; target_id: string; relation: string };

export class GraphService {
  public async explore(entity: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    // Stub: return empty graph for now
    return { nodes: [], edges: [] };
  }
}


