import { GoogleGenerativeAI } from "@google/generative-ai";
import { Handler } from "@netlify/functions";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const handler: Handler = async (event) => {
  // Sécurité : n'accepter que le POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { base64Image, topicA, topicB } = JSON.parse(event.body || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are a sociological AI expert analyzing a visual debate canvas called 'PixelDebate'.
      The canvas is split in two.
      Left side represents: "${topicA}"
      Right side represents: "${topicB}"
      
      Analyze the visual data (drawings, density, colors, symbols) on both sides.
      Provide a professional sociological synthesis. 
      Compare the intensity, types of arguments (abstract vs concrete), and overall visual sentiment.
      Format your response in Markdown with clear sections: "Executive Summary", "Side A Analysis", "Side B Analysis", and "Sociological Conclusion".
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/png",
          data: base64Image.split(",")[1],
        },
      },
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({ text: result.response.text() }),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: "Analysis failed" }) };
  }
};