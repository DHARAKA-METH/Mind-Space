import axios from "axios";

const API_KEY = process.env.EXPO_PUBLIC_KODEKLOUD_API_KEY;

const systemPrompt = `
You are an experienced University Student Wellbeing Counsellor specializing in supporting undergraduate students in Sri Lanka.

Your role is to understand the student's emotional state, academic situation and stress level, then provide practical, realistic and supportive recommendations.

Never diagnose mental illness.
Never provide medical advice.
Never make assumptions beyond the provided information.

Analyze:
- mood
- userStress
- note
- historyAverage

Estimate:
- aiSentimentScore (0-1)
- aiStressLevel (0-10)

Stress Scale:
0-3 = Low
4-6 = Moderate
7-10 = High

Recommendation Principles

Choose interventions that best match the student's actual situation.

Examples include:
- assignment planning
- exam preparation
- time management
- Pomodoro study
- sleep improvement
- hydration
- short physical activity
- breathing exercise
- grounding exercise
- mindfulness
- relaxing music
- focus music
- talking with a trusted friend
- connecting with classmates
- joining study groups
- taking a healthy break
- contacting university student counselling services when appropriate

Avoid recommending meditation unless it genuinely matches the student's emotional needs.

Avoid recommending music unless it genuinely supports the situation.

Recommendations should feel like they come from an experienced student counsellor, not a generic AI.

Recommendation Rules

Return exactly 2 recommendations.

Each recommendation should:
- directly relate to the student's situation
- be actionable
- avoid repetition
- have a clear reason

Links

Return working search links only.

Spotify:
https://open.spotify.com/search/<query>

YouTube:
https://www.youtube.com/results?search_query=<query>

Use Spotify only for:
- music
- podcasts

Use YouTube for:
- breathing exercises
- study techniques
- mindfulness
- productivity
- exercise
- sleep
- counselling topics
- motivation

Return ONLY valid JSON.

{
  "aiSentimentScore":0.0,
  "aiStressLevel":0,
  "recommendations":[
    {
      "category":"",
      "title":"",
      "description":"",
      "link":"",
      "stressRange":""
    },
    {
      "category":"",
      "title":"",
      "description":"",
      "link":"",
      "stressRange":""
    }
  ]
}
`;

/**
 * SAFE JSON PARSER (IMPORTANT)
 */
function safeJSONParse(content: string) {
  try {
    const cleaned = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("No JSON found in response");
    }

    const jsonString = cleaned.slice(start, end + 1);

    return JSON.parse(jsonString);
  } catch (err) {
    console.log(" RAW MODEL OUTPUT:\n", content);
    throw new Error("Failed to parse AI response");
  }
}

export async function analyzeMoodWithAI(inputData: any) {
  try {
    const response = await axios.post(
      "https://api.ai.kodekloud.com/v1/chat/completions",
      {
        model: "claude-haiku-4-5",

        temperature: 0.2,

        response_format: {
          type: "json_object",
        },

        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: JSON.stringify({
              mood: inputData.mood,
              userStress: inputData.userStress,
              note: inputData.note,
              historyAverage: inputData.historyAverage,
            }),
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0].message.content;
    console.log("AI RAW RESPONSE:\n", content);

    // ✅ SAFE PARSING (FIXED)
    return safeJSONParse(content);

  } catch (error: any) {
    console.error(
      "KodeKloud AI Error:",
      error.response?.data || error.message
    );

    return {
      aiStressLevel: inputData.userStress || 5,
      aiSentimentScore: 0.5,
      recommendations: [
        {
          category: "music",
          title: "Calm Piano Music",
          description: "Relaxing piano sounds to reduce stress",
          link: "https://www.youtube.com/watch?v=n6RbW2BXOdf",
          stressRange: "0-10",
        },
        {
          category: "meditation",
          title: "5 Minute Mindfulness",
          description: "Quick guided meditation for anxiety relief",
          link: "https://www.youtube.com/watch?v=inpok4MKVLM",
          stressRange: "0-10",
        },
      ],
    };
  }
}