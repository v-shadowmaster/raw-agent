import type { ChatCompletionTool } from "openai/resources/chat/completions";

export interface Tool<Args = any> {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    execute: (args: Args) => string | Promise<string>
}

export class ToolRegistry {
    private tools = new Map<string, Tool>();

    register(tool: Tool): this {
        this.tools.set(tool.name, tool);
        return this;
    }

    list(): Tool[] {
        return [...this.tools.values()];
    }

    with(...extra: Tool[]): ToolRegistry {
        const r = new ToolRegistry();
        for (const t of this.list()) r.register(t);
        for (const t of extra) r.register(t);
        return r;
    }

    toOpenAI(): ChatCompletionTool[] | undefined {
        const all = this.list();
        if (all.length === 0) return undefined;
        return all.map((t) => ({
            type: "function" as const,
            function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters,
            },
        }));
    }

    async execute(name: string, rawArgs: string): Promise<string> {
        const tool = this.tools.get(name);
        if (!tool) {
            return `Error: unknown tool "${name}". Available: ${this.list().map((t) => t.name).join(", ")}`;
        }
        try {
            const args = rawArgs.trim() ? JSON.parse(rawArgs) : {};
            const result = await tool.execute(args);
            return String(result);
        } catch (err) {
            return `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
    }
}