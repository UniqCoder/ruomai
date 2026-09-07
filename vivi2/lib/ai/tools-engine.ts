export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: Record<string, any>) => Promise<any>;
}

export class ToolsRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  async executeTool(name: string, args: Record<string, any>): Promise<any> {
    const tool = this.getTool(name);
    if (!tool) {
      throw new Error(`Tool "${name}" is not registered.`);
    }
    return await tool.execute(args);
  }
}

export const globalToolsRegistry = new ToolsRegistry();

// Example registered tool: Memory Search Tool
globalToolsRegistry.registerTool({
  name: 'search_memories',
  description: 'Search long-term and episodic user memories semantically',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search term or question' },
    },
    required: ['query'],
  },
  execute: async (args: Record<string, any>) => {
    return { status: 'success', query: args.query || '' };
  },
});
