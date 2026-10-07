# Ganit Mitra – AI Maths Tutor (CBSE Classes 1–10)

Static website (`public/index.html`) + a small backend (`/api/chat`) that keeps your Anthropic API key secret.

## 1. Get an API key
Create a key at https://console.anthropic.com and set a monthly spend limit there.

## 2. Test on your computer
    npm install
    ANTHROPIC_API_KEY=your-key npm start      # open http://localhost:8080

## 3A. Deploy on Vercel (easiest)
1. Upload this folder to a GitHub repo, or install the CLI: `npm i -g vercel`
2. Run `vercel` inside the folder and follow the prompts.
3. In Vercel > Project > Settings > Environment Variables add `ANTHROPIC_API_KEY`.
4. Run `vercel --prod`. Your site is live on a https link.

## 3B. Deploy on any cloud with Docker (Google Cloud Run, Azure, AWS, Render)
Google Cloud Run example:

    gcloud run deploy ganit-mitra --source . --region asia-south1 \
      --allow-unauthenticated --set-env-vars ANTHROPIC_API_KEY=your-key

On Azure Container Apps, AWS App Runner or Render, build the Dockerfile and set the same environment variable.

## Settings (environment variables)
- `ANTHROPIC_API_KEY` (required)
- `MODEL` (default `claude-haiku-4-5-20251001`: fast and low cost; use `claude-sonnet-5-5` for stronger answers)
- `RATE_PER_MIN` (default 30 AI requests per minute per visitor)

## Before using with children
- Add a privacy page: progress and notes are saved only in the child's own browser; typed questions are sent to the AI service.
- Get school or parent permission and do not collect names, phone numbers or photos.
- Test many topics yourself; AI can make mistakes. Practice sums are checked by code, AI answers are not.
- Add your own domain and, for heavy use, a shared rate limit (for example Redis or Cloudflare) because the built-in limit is per server instance.

## Using an open-source model instead of Claude
Set these variables (no Anthropic key needed):

    PROVIDER=openai
    BASE_URL=http://localhost:11434/v1      # Ollama; or your vLLM / Groq / Together / OpenRouter URL
    MODEL=<model name on that server>
    API_KEY=<only for hosted services>

Run Ollama (`ollama serve`, then `ollama pull <model>`) on a cloud VM with a GPU for good speed. Open models (Llama, Qwen, Gemma, Mistral families) vary in maths accuracy and Hindi/Kannada/Telugu/Tamil quality, so test every class and language before children use it.

## Voice in all languages
The app speaks 12 languages: English, Hindi, Kannada, Telugu, Tamil, Marathi, Bengali, Gujarati, Malayalam, Punjabi, Odia and Urdu.

1. **Free (default):** uses the voices already on the child's phone or computer. Some phones lack some languages. The app shows a warning with the fix (Settings > Text-to-speech > Install voice data).
2. **Cloud voice (recommended for schools):** set `GOOGLE_TTS_KEY` (create it in Google Cloud: enable the "Cloud Text-to-Speech API", then create an API key and restrict it to that API). The app then uses the same clear voice on every device. Check Google's pricing and set a budget alert. If a language is not supported by the service, the app falls back to the phone voice.
3. Animations and tricks are narrated in the chosen language: the app translates each spoken line with your AI model (a few seconds on the first play, then it is remembered).
