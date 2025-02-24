import { OpenAI } from "openai";
import { ChatCompletion } from './generated/openai';

type GlobeAISdkState = {
  openAI?: OpenAI;
};

const openai_chat_complete = async (
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


  const choise: ChatCompletion.Choices[] = [];

  const response = new ChatCompletion({
    id: completion.id,
    model: completion.model,
    created: completion.created,
    system_fingerprint: completion.system_fingerprint,
    object: completion.object,
    service_tier: completion.service_tier?.toString(),
  });

  send_value_to_dart(callbackId, response.serializeBinary());
};

const openai_chat_complete_stream = async (
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
  openai_chat_complete,
  openai_chat_complete_stream
});
