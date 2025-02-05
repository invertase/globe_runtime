import { OpenAI } from "openai";

globalThis.openai_generate = async (apiKey, model, content, callbackId) => {
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content }],
  });

  send_to_dart(callbackId, completion);
};

globalThis.openai_stream = async (apiKey, model, content, callbackId) => {
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content }],
    stream: true,
  });

  for await (const chunk of completion) {
    console.log(chunk);
  }

  send_to_dart(callbackId, "e-o-s");
};
