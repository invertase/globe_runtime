import { OpenAI } from "openai";

const openai_generate = async (apiKey: string, model: string, content: string, callbackId: number) => {
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content }],
  });

  send_value_to_dart(callbackId, completion);
};

const openai_stream = async (apiKey: string, model: string, content: string, callbackId: number) => {
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content }],
    stream: true,
  });

  for await (const chunk of completion) {
    stream_value_to_dart(callbackId, chunk);
  }

  stream_end_to_dart(callbackId);
};

registerJSModule("GlobeAISdk", {
  openai_generate,
  openai_stream,
});



