const functions = require("firebase-functions");
const axios = require("axios");

exports.chatCompletion = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).send({ error: "Prompt is required." });
      return;
    }

    // Use process.env to get the API key
    const apiKey = process.env.open_api_key;
    if (!apiKey) {
      throw new Error("OpenAI API key is not set.");
    }

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful fitness assistant." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const completion = response.data.choices[0]?.message?.content || "No response";
    return res.status(200).send({ completion });
  } catch (error) {
    console.error("Error fetching ChatGPT response:", error);
    return res.status(500).send({ error: error.message });
  }
});
