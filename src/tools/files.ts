import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Tool } from "../registry";

export const listFiles: Tool<{ dir?: string }> = {
    name: "list_files",
    description: "List files in a directory (relative to the project root). Defaults to the root.",
    parameters: {
        type: "object",
        properties: {
            dir: { type: "string", description: "Directory path, e.g. 'src' or 'src/tools'" },
        },
        required: [],
        additionalProperties: false,
    },
    async execute({ dir = "." }) {
        const entries = await readdir(join(process.cwd(), dir), { withFileTypes: true });
        return entries.map((e) => (e.isDirectory() ? e.name + "/" : e.name)).join("\n") || "(empty)";
    },
};