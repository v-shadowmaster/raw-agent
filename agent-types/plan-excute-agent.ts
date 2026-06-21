import OpenAI from 'openai';
const client = new OpenAI();

function get_weather(city: string): string {
    const data: Record<string, string> = {
        bengaluru: '28C',
        mysuru: '35C',
        mandya: '23C',
        mangaluru: '40C',
        hassan: '10C',
        kolar: '38C',
    };
    return data[city.toLowerCase()] ?? 'unknown city';
}

function celsius_to_fahrenheit(celsius: string): string {
    const c = parseFloat(celsius.replace('C', ''));
    return `${((c * 9) / 5 + 32).toFixed(1)}F`;
}

const tools = { get_weather, celsius_to_fahrenheit };

async function makePlan(userQuery: string) {
    const res = await client.chat.completions.create({
        model: 'gpt-5-nano',
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content: `You are a planner. Given a user request, output a JSON plan as a list of steps.
Each step calls exactly one tool. Available tools:
- get_weather(city: string) -> weather as string like "28C"
- celsius_to_fahrenheit(celsius: string) -> converts e.g. "28C" to "82.4F"

Respond with: {"steps": [{"function": "...", "input": "..."}, ...]}
Plan the minimum steps needed. Do not solve the problem yourself, just plan tool calls.`,
            },
            { role: "user", content: userQuery },
        ],
    });

    const plan = JSON.parse(res.choices[0].message.content!);
    return plan.steps as { function: string; input: string }[];
}

async function executePlan(steps: { function: string; input: string }[]) {
    const results: { function: string; input: string; output: string }[] = [];

    for (const step of steps) {
        const fn = (tools as any)[step.function];
        const output = fn ? fn(step.input) : "unknown function";
        results.push({ ...step, output });
        console.log(`Executed ${step.function}("${step.input}") -> ${output}`);
    }
    return results;
}


async function synthesize(userQuery: string, results: any[]) {
    const res = await client.chat.completions.create({
        model: "gpt-5-nano",
        messages: [
            {
                role: "system",
                content: "You are given a user question and the results of tool calls. Write a clear final answer using only these results.",
            },
            {
                role: "user",
                content: `Question: ${userQuery}\n\nResults: ${JSON.stringify(results)}`,
            },
        ],
    });

    return res.choices[0].message.content;
}


async function runPlanAndExecute(userQuery: string) {
    const plan = await makePlan(userQuery);
    console.log("PLAN:", plan);

    const results = await executePlan(plan);

    const finalAnswer = await synthesize(userQuery, results);
    console.log("FINAL ANSWER:", finalAnswer);
}

runPlanAndExecute("what is the weather in kolar, and what is that in fahrenheit?");
