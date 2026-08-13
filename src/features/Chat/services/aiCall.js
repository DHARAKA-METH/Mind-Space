import { getMessages } from "./firebaseChatService";

const API_KEY = process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;
const BASE_URL = "https://api.deepseek.com";
const MODEL = "deepseek-v4-flash";

const SYSTEM_PROMPT =
  "You are MindSpace, a supportive mental-wellness assistant for university students. " +
  "Respond with empathy, calm language, and practical suggestions. " +
  "Provide general emotional support only. " +
  "Never diagnose mental-health conditions, prescribe medication, or claim to replace a counselor. " +
  "Ask no more than one gentle follow-up question. Keep responses concise. " +
  "If the student mentions suicide, self-harm, immediate danger, or harming another person, " +
  "encourage them to contact local emergency services and a trusted person immediately. " +
  "For users in Sri Lanka, advise contacting 1990 Suwa Seriya in an immediate emergency. " +
  "Do not provide instructions that could facilitate self-harm.";

export const buildChatMessages = (previousMessages = []) => {
  const messages = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ];

  previousMessages.forEach((message) => {
    const content =
      typeof message?.text === "string"
        ? message.text.trim()
        : "";

    const role =
      message?.sender === "ai"
        ? "assistant"
        : message?.sender === "user"
          ? "user"
          : null;

    if (!role || !content) return;

    messages.push({
      role,
      content,
    });
  });

  return messages;
};

export const getAiResponseMessage = async (userId, roomId) => {
  try {
    if (!API_KEY) {
      throw new Error(
        "EXPO_PUBLIC_DEEPSEEK_API_KEY is not configured"
      );
    }

    const previousMessages =
      (await getMessages(userId, roomId)) || [];

    const messages = buildChatMessages(previousMessages);

    if (!messages.some((message) => message.role === "user")) {
      throw new Error(
        "No valid user messages were found in the chat history"
      );
    }

    const response = await fetch(
      `${BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `DeepSeek API error ${response.status}: ${errorBody}`
      );
    }

    const data = await response.json();
    const assistantMessage = data?.choices?.[0]?.message;
    const content = assistantMessage?.content;

    if (
      assistantMessage?.role !== "assistant" ||
      typeof content !== "string" ||
      !content.trim()
    ) {
      throw new Error(
        "DeepSeek returned an invalid assistant response"
      );
    }

    // The app displays content only; reasoning_content remains internal.
    return content.trim();
  } catch (error) {
    console.error(
      "Error getting DeepSeek response:",
      error
    );
    return null;
  }
};
