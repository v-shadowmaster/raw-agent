import OpenAI from "openai";

const client = new OpenAI();

function get_weather(city: string): string {
    const data: { [key: string]: string } = {
        bengaluru: "28C", mysuru: "35C", mandya: "23C",
        mangaluru: "40C", hassan: "10C", kolar: "38C",
    };
    return data[city.toLowerCase()] ?? "unknown city";
}

async function get_company_details(company_name: string) {
    const res = await fetch(
        `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${company_name}&apikey=demo`
    )
    const data = await res.json();
    return JSON.stringify(data);
}

const systemPrompt =
    `
You are Vini, an AI agent. Solve problems step-by-step using tools.

IMPORTANT: Respond with EXACTLY ONE JSON object per turn (one step).
Do not generate multiple steps at once. Wait for the next message before continuing.

Step formats:
{"type": "plan", "plan": "..."}
{"type": "action", "function": "get_weather", "input": "<city>"}
{"type": "output", "output": "final answer"}

Available tools:
- get_weather(city: string) -> returns weather as a string
- get_company_details(company:string)->returns company details in json

Always plan first. Use action when you need a tool.
Only use "output" once you have everything needed.
`

type Msg = { role: "system" | "user" | "assistant"; content: string };


async function runAgent(userQuery: string) {
    const messages: Msg[] = [{ role: "system", content: systemPrompt },
    { role: "user", content: userQuery },]

    while (true) {
        const res = await client.chat.completions.create({
            model: "gpt-5-nano",
            messages,
            response_format: { type: "json_object" }
        })

        const raw = res.choices[0].message.content!;
        messages.push({ role: "assistant", content: raw });

        const parsedMessage = JSON.parse(raw);
        console.log(parsedMessage);

        if (parsedMessage.type === "plan") continue;

        if (parsedMessage.type === "action") {
            let observe: unknown;
            if (parsedMessage.function === "get_weather") {
                observe = get_weather(parsedMessage.input);
            } else if (parsedMessage.function === "get_company_details") {
                observe = await get_company_details(parsedMessage.input);
            } else {
                observe = "unknown_function";
            }
            messages.push({
                role: "user", content: JSON.stringify({ type: "observation", observe })
            });
            continue;
        }

        if (parsedMessage.type === "output") { console.log("final answer -> ", parsedMessage.output); break }
    }

}


runAgent("Give me the company details for IBM");

