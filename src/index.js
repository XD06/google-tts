export default {
  async fetch(request) {
    try {
      const { searchParams } = new URL(request.url);
      const text = searchParams.get("text") || "Hello world";  // 默认文本

      // 随机选择美国英语（en-US）或英国英语（en-GB）
      const languages = ['en-US', 'en-GB'];
      const selectedLang = languages[Math.floor(Math.random() * languages.length)];

      // 分段文本，避免超出请求的长度
      const chunks = splitText(text, 180);

      let buffers = [];
      for (const chunk of chunks) {
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${selectedLang}&client=tw-ob`;
        const res = await fetch(ttsUrl, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const buf = await res.arrayBuffer();
        buffers.push(buf);
      }

      // 合并音频片段
      const fullAudio = concatenateArrayBuffers(buffers);

      // 返回最终音频
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

// 文本分段，防止超出请求的长度限制
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

// 合并多个 ArrayBuffer（音频片段）
function concatenateArrayBuffers(buffers) {
  let totalLength = buffers.reduce((total, buf) => total + buf.byteLength, 0);
  let concatenated = new Uint8Array(totalLength);

  let offset = 0;
  buffers.forEach(buf => {
    concatenated.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  });

  return concatenated.buffer;
}
