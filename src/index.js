export default {
  async fetch(request) {
    try {
      const { searchParams } = new URL(request.url);
      const text = searchParams.get("text") || "Hello world";
      const lang = searchParams.get("lang") || "en";
      const gender = searchParams.get("gender");  // 获取性别参数，如果有的话

      // 如果没有指定性别，随机选择男声或女声
      const selectedGender = gender || (Math.random() < 0.5 ? 'male' : 'female');
      
      // 选择语音性别
      const voice = getVoiceForLanguageAndGender(lang, selectedGender);
      
      // 1. 自动分段（避免 Google TTS 限制）
      const chunks = splitText(text, 180);

      // 2. 逐段请求 Google TTS
      let buffers = [];
      for (const chunk of chunks) {
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${lang}&client=tw-ob`;
        const res = await fetch(ttsUrl, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const buf = await res.arrayBuffer();
        buffers.push(buf);
      }

      // 3. 合并音频（直接拼接 MP3 二进制流）
      const fullAudio = concatenateArrayBuffers(buffers);

      // 4. 返回完整 MP3
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

// 分段函数
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

// 合并 ArrayBuffer
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

// 根据语言和性别选择合适的语音
function getVoiceForLanguageAndGender(lang, gender) {
  const voices = {
    'en': {
      'male': 'en-US-Wavenet-D', // 男性语音
      'female': 'en-US-Wavenet-F' // 女性语音
    },
    'es': {
      'male': 'es-ES-Wavenet-D',
      'female': 'es-ES-Wavenet-F'
    },
    'fr': {
      'male': 'fr-FR-Wavenet-D',
      'female': 'fr-FR-Wavenet-F'
    },
    // 可以根据需求扩展更多语言和性别选项
  };

  if (voices[lang] && voices[lang][gender]) {
    return voices[lang][gender];
  }

  // 默认返回男性声音
  return voices[lang] ? voices[lang]['male'] : 'en-US-Wavenet-D';
}
