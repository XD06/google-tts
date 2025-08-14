export default {
  async fetch(request) {
    try {
      const { searchParams } = new URL(request.url);
      const text = searchParams.get("text") || "Hello world";  // 默认文本
      const lang = searchParams.get("lang") || "en-GB";  // 默认语言为英国英语

      // 根据不同语言选择男声
      const voices = {
        'en-GB': 'en-GB', // 英国英语
        'en-US': 'en-US', // 美国英语
        'es-ES': 'es-ES', // 西班牙语
        'fr-FR': 'fr-FR', // 法语
        'de-DE': 'de-DE', // 德语
        'it-IT': 'it-IT', // 意大利语
      };

      // 检查并设置声音参数
      const selectedLang = voices[lang] || 'en-GB';  // 默认为英国英语

      // 分段文本（防止超出请求的长度限制）
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

      // 返回最终的音频
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

// 文本分段，避免请求超长
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
