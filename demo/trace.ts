import type { AgentEvent } from "../src/agent";

const short = (s: string, n = 120) => (s.length > n ? s.slice(0, n).replaceAll("\n", " ") + "…" : s.replaceAll("\n", " "));

export function trace(e: AgentEvent) {
    switch (e.type) {
        case "turn":
            console.log(`\n(${e.agent}) — loop iteration ${e.n}: sending ${e.n === 1 ? "task" : "tool results"} to the model`);
            break;
        case "tool_call":
            console.log(`(${e.agent}) → model wants tool: ${e.name}(${short(e.args, 100)})`);
            break;
        case "tool_result":
            console.log(`(${e.agent}) ← tool returned: ${short(e.result)}`);
            break;
        case "text":
            console.log(`(${e.agent}) ✦ final answer:\n${e.text}\n`);
            break;
    }
}
