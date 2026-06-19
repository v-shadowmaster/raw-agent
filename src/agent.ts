import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { ToolRegistry } from "./registry";

export const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
});

export const DEFAULT_MODEL = process.env.MODEL ?? "gpt-5-nano";

export type AgentEvent =
    | { type: "turn"; agent: string; n: number }
    | { type: "text"; agent: string; text: string }
    | { type: "tool_call"; agent: string; name: string; args: string }
    | { type: "tool_result"; agent: string; name: string; result: string }

export interface AgentOptions {
    name?: string;
    model?: string;
    systemPrompt: string;
    tools?: ToolRegistry;
    maxTurns?: number;
    responseSchema?: { name: string; schema: Record<string, unknown> };
    onEvent?: (e: AgentEvent) => void;
}

export async function runAgent(opts: AgentOptions, userMessage: string): Promise<string> {
    const name = opts.name ?? "agent";
    const emit = opts.onEvent ?? (() => { });

    const messages: ChatCompletionMessageParam[] = [
        { role: "system", content: opts.systemPrompt },
        { role: "user", content: userMessage },
    ];

    const maxTurns = opts.maxTurns ?? 20;

    for (let turn = 1; turn <= maxTurns; turn++) {
        emit({ type: "turn", agent: name, n: turn });

        const res = await client.chat.completions.create({
            model: opts.model ?? DEFAULT_MODEL,
            messages,
            tools: opts.tools?.toOpenAI(),
            response_format: opts.responseSchema
                ? {
                    type: "json_schema",
                    json_schema: {
                        name: opts.responseSchema.name,
                        schema: opts.responseSchema.schema,
                        strict: true,
                    },
                }
                : undefined,
        })

        const msg = res.choices[0]!.message;

        messages.push(msg as ChatCompletionMessageParam);

        const toolCalls = (msg.tool_calls ?? []).filter((tc) => tc.type === "function");

        if (toolCalls.length === 0) {
            const text = msg.content ?? "";
            emit({ type: "text", agent: name, text });
            return text;
        }

        const results = await Promise.all(
            toolCalls.map(async (tc) => {
                emit({ type: "tool_call", agent: name, name: tc.function.name, args: tc.function.arguments });
                const result = opts.tools
                    ? await opts.tools.execute(tc.function.name, tc.function.arguments)
                    : `Error: no tools available`;
                emit({ type: "tool_result", agent: name, name: tc.function.name, result });
                // Wire format: a `role:"tool"` message linked to the request by id.
                return { role: "tool" as const, tool_call_id: tc.id, content: result };
            })
        );
        messages.push(...results);
    }

    return `(stopped: hit maxTurns=${maxTurns} without a final answer)`;
}