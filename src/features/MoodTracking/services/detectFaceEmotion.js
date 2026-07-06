export const detectFaceEmotion = async (capturedFace) => {
  try {
    const token = process.env.EXPO_PUBLIC_HF_TOKEN;
    console.log("Using Hugging Face token:", token ? "Present" : "Missing");

    const responseImg = await fetch(capturedFace.uri);
    const blob = await responseImg.blob();

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/dima806/facial_emotions_image_detection",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: blob,
      }
    );

    if (!response.ok) {
      console.log("Hugging Face API error:", response.status);
      return null;
    }

    const result = await response.json();
    console.log("Emotion result:", result);

    return result;
  } catch (error) {
    console.error("Error detecting emotion:", error);
  }
};
