import { Hono } from "hono";
import { jwt } from "hono/jwt";

const JWT_SECRET = "super-secret-key";
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "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";

const speech = new Hono()
  .use("/*", jwt({ secret: JWT_SECRET, alg: "HS256" }))
  .post("/transcribe", async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("file");
      if (!file) {
        return c.json({ error: "Missing audio file" }, 400);
      }

      // Convert standard browser audio file (often webm) into the request body
      const nvidformData = new FormData();
      nvidformData.append("file", file);
      nvidformData.append("model", "nvidia/parakeet-tdt-0.6b");
      nvidformData.append("language", "en");

      console.log("🚀 Sending audio to NVIDIA ASR (Parakeet) API...");
      const response = await fetch("https://ai.api.nvidia.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NVIDIA_API_KEY}`
        },
        body: nvidformData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ NVIDIA ASR API failed:", response.status, errorText);
        
        // Fallback: Let's try with "nvidia/parakeet-tdt-0.6b-v2" just in case
        console.log("🔄 Trying fallback model: nvidia/parakeet-tdt-0.6b-v2...");
        const fallbackFormData = new FormData();
        fallbackFormData.append("file", file);
        fallbackFormData.append("model", "nvidia/parakeet-tdt-0.6b-v2");
        fallbackFormData.append("language", "en");
        
        const fallbackResponse = await fetch("https://ai.api.nvidia.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${NVIDIA_API_KEY}`
          },
          body: fallbackFormData
        });
        
        if (!fallbackResponse.ok) {
          const fallbackErrorText = await fallbackResponse.text();
          console.error("❌ NVIDIA ASR Fallback API failed:", fallbackResponse.status, fallbackErrorText);
          return c.json({ error: "NVIDIA ASR transcription failed" }, 500);
        }
        
        const result = await fallbackResponse.json();
        console.log("✅ NVIDIA ASR Success (Fallback):", result);
        return c.json(result);
      }

      const result = await response.json();
      console.log("✅ NVIDIA ASR Success:", result);
      return c.json(result);
    } catch (error: any) {
      console.error("❌ Transcription error:", error);
      return c.json({ error: error.message || "ASR processing failed" }, 500);
    }
  });

export default speech;
