// import * as googleAI from "@google/generative-ai";
import * as AI from "./ai.js";

AI.generate("Who is the president of Ghana?")
  .then(async (res) => {
    send_to_dart(JSON.stringify({ result: res }));
  })
  .catch((error) => {
    console.log(error);
  });
