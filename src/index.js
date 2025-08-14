import { concat } from "arraybuffer-concat";

// 分段，避免 Google TTS 限制
function splitText(text, maxLen) {
  const words = text.split(" ");
  let parts = [];
  let current = "";

  for (let word of words) {
    if ((current + " " + word).length > maxLen) {
      parts.push(current.trim());
      current = word;
    } else {
      current += " " + word;
    }
  }
  if (current) parts.push(current.trim());
  return parts;
}

export default {
  async fetch(request) {
    try {
      const { searchParams } = new URL(request.url);
      const text = searchParams.get("text") || "Hello world";
      const lang = searchParams.get("lang") || "en";

      const chunks = splitText(text, 180);
      let buffers = [];

      for (const chunk of chunks) {
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${lang}&client=tw-ob`;
        const res = await fetch(ttsUrl, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const buf = await res.arrayBuffer();
        buffers.push(buf);
      }

      const fullAudio = concat(...buffers);

      return new Response(fullAudio, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } catch (err) {
      return new Response("TTS failed: " + err.message, { status: 500 });
    }
  }
};
