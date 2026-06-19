import { runAgent } from "../src/agent";
import { ToolRegistry } from "../src/registry";
import { listFiles } from "../src/tools/files";
import { trace } from "./trace";

const tools = new ToolRegistry().register(listFiles);

const answer = await runAgent(
    {
        name: "explorer",
        systemPrompt:
            "You are code project structure reporter",
        tools,
        onEvent: (e) => {
            trace(e);
        },
    },
    "list the contents of node_modules/"
);

console.log("=== RESULT ===\n" + answer);
