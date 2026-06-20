import OpenAI from "openai";

const client = new OpenAI();

function get_weather(city: string): string {
    if (city === "bengaluru") return "28C";
    if (city === "mysuru") return "35C";
    if (city === "mandya") return "23C";
    if (city === "mangaluru") return "40C";
    if (city === "hassan") return "10C";
    if (city === "kolar") return "38C";
    return "null"
}

const systemPrompt =
    `
    your name is vini , an expert ai agnent , you have access to tools for additional functionality like live events etc
    you will start with start , plan , action , observation and output state
    wait for the user prompt and first plan using the available tools
    after planning , take the action with appropriate tools and wait for observation based on action.
    once you get the observations , return the ai response based on start prompt and observations

    Available Tools:
        - function get_weather(city : string) : string
        get_weather is a function that accepts city name in string and returns the weather details

    example:
    START
        {"type:"user", "user":"What is the sum of weather of bengaluru and mysuru?"}
        {"type:"plan", "plan":"I will call get_weather tool for bengaluru"}
        {"type:"action", "function":"get_weather","input":"bengaluru"}
        {"type:"observation", "observation":"10C"}
        {"type:"plan", "plan":"I will call get_weather tool for mysuru"}
        {"type:"action", "function":"get_weather","input":"mysuru"}
        {"type:"observation", "observation":"35C"}
        {"type:"output", "output":"The sum of weather of bengaluru and mysuru is 63C"}
`

const user = "what is the weather in kolar?"

const response = await client.responses.create({
    model: "gpt-5-nano",
    input: [{ role: "system", content: systemPrompt }, { role: "user", content: user }]
})

console.log(response.output_text)