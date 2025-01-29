const { GoogleGenerativeAI } = require("@google/generative-ai");
// async function analyzeImage() {
//   try {
//     // Initialize Google Generative AI with API Key
//     const genAI = new GoogleGenerativeAI(process.env.API_KEY);

//     // Get the generative model
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//     // // Define the prompt and image data
//     const prompt = "Does this look store-bought or homemade?";
//     // const image = {
//     //   inlineData: {
//     //     data: Buffer.from(fs.readFileSync("cookie.png")).toString("base64"),
//     //     mimeType: "image/png",
//     //   },
//     // };

//     // // Generate content
//     const result = await model.generateContent([prompt]);

//     // // Log the response
//     // console.log(result.response.text());
//   } catch (error) {
//     console.error("Error:", error.message);
//   }
// }

// // Invoke the async function
// analyzeImage();

fetch("https://jsonplaceholder.typicode.com/posts")
  .then((res) => {
    console.log("We got result on JS side");

    send_to_port(dart_port, res);
  })
  .catch((error) => {
    console.error(error);
  });
