// const { GoogleGenerativeAI } = require("@google/generative-ai");

fetch(`https://jsonplaceholder.typicode.com/posts/1`)
  .then(async (res) => {
    let data = await res.json();

    send_to_dart(JSON.stringify(data));
  })
  .catch((error) => {
    console.log(error);
  });
