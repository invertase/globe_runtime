import { OpenAI } from "openai";

type GlobeAISdkState = {
  openAI?: OpenAI;
};

const openai_generate = async (
  state: GlobeAISdkState,
  apiKey: string,
  model: string,
  content: string,
  callbackId: number
) => {
  const client = (state.openAI ??= new OpenAI({ apiKey }));

  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content }],
  });

  send_value_to_dart(callbackId, completion);
};

const openai_stream = async (
  state: GlobeAISdkState,
  apiKey: string,
  model: string,
  content: string,
  callbackId: number
) => {
  const client = (state.openAI ??= new OpenAI({ apiKey }));

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
