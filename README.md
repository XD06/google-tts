# Cloudflare Workers TTS API

这是一个部署在 Cloudflare Workers 的免费 TTS（文本转语音）API，支持任意长度的英文句子或单词朗读。

## 部署方法

1. 在 GitHub 创建一个新仓库（比如 `cf-tts`）
2. 把本项目所有文件上传到仓库
3. 进入 Cloudflare Dashboard → Pages → Create a project → Connect to Git → 选择这个仓库
4. 构建命令：`npm install`
5. 构建输出目录：无（留空）
6. 部署成功后，你会得到一个 API 地址，例如：https://example.workers.dev
## 使用方法

访问https://example.com/?text=Hello%20world</br>
返回MP3
