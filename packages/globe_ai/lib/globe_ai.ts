import { OpenAI } from "openai";

const openai_generate = async (apiKey: string, model: string, content: string, callbackId: number) => {
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content }],
  });

  send_to_dart(callbackId, completion);
};

const openai_stream = async (apiKey: string, model: string, content: string, callbackId: number) => {
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content }],
    stream: true,
  });

  for await (const chunk of completion) {
    send_to_dart(callbackId, chunk);
  }

  send_to_dart(callbackId, "e-o-s");
};

registerJSModule("GlobeAISdk", {
  openai_generate,
  openai_stream,
});



