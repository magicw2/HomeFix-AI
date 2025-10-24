
import { GoogleGenAI, Type } from "@google/genai";
import type { RepairGuide } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const repairGuideSchema = {
  type: Type.OBJECT,
  properties: {
    itemName: {
      type: Type.STRING,
      description: "The name of the identified household item (e.g., 'Coffee Maker', 'Leaky Faucet')."
    },
    problemAnalysis: {
      type: Type.STRING,
      description: "A brief, one-paragraph analysis of the likely problem based on the image and user description."
    },
    difficulty: {
      type: Type.STRING,
      enum: ['Easy', 'Intermediate', 'Hard', 'Expert'],
      description: "The estimated difficulty level of the repair."
    },
    estimatedTime: {
      type: Type.STRING,
      description: "A time estimate for the repair, like '30-45 minutes' or '1-2 hours'."
    },
    tools: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of necessary tools for the repair (e.g., 'Phillips screwdriver', 'Wrench')."
    },
    parts: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of potential replacement parts needed (e.g., 'Replacement O-ring', 'New power cord'). If none, return an empty array."
    },
    steps: {
      type: Type.ARRAY,
      description: "An array of step-by-step instructions for the repair.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "A short, clear title for the repair step (e.g., 'Unplug the Device')."
          },
          description: {
            type: Type.STRING,
            description: "A detailed description of the action to take in this step."
          }
        },
        required: ['title', 'description']
      }
    }
  },
  required: ['itemName', 'problemAnalysis', 'difficulty', 'estimatedTime', 'tools', 'parts', 'steps']
};

export const analyzeBrokenItem = async (
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<RepairGuide> => {
  const model = "gemini-2.5-flash";

  const systemInstruction = `You are "HomeFix AI", an expert diagnostician for household repairs. Your goal is to analyze an image of a broken item and a user's description of the problem.
  Based on this, you will provide a detailed, clear, and safe step-by-step repair guide.
  Identify the item, diagnose the issue, and provide all the information required by the JSON schema.
  Be practical and helpful. If the repair is too dangerous or complex for a typical DIYer (e.g., high-voltage electronics, major plumbing), classify it as 'Expert' and strongly advise calling a professional in the analysis.`;
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
          parts: [
              { inlineData: { mimeType, data: imageBase64 } },
              { text: `Problem Description: ${prompt}` }
          ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: repairGuideSchema
      }
    });

    const jsonText = response.text.trim();
    // It's good practice to parse and validate, even if the API should return valid JSON
    const result = JSON.parse(jsonText) as RepairGuide;
    return result;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to get analysis from AI: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI.");
  }
};
