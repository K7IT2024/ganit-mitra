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

## If the tutor shows "Oops, the tutor is busy"
1. Open `https://YOUR-SITE.onrender.com/api/test` in a browser. It tells you the exact problem (missing setting, wrong key, no credit, wrong model name).
2. The message on screen ends with a code such as `(error 500)` = settings missing, `(error 502/401)` = wrong key, `(error 502/404)` = wrong model name or BASE_URL, `(error 502/402)` = no credit, `(error 502/429)` = limit reached.
3. Also check Render > Logs for a line starting with `AI error`.
4. After fixing, set `DISABLE_TEST=1` if you do not want the test page public.

## Slow or empty answers with reasoning models
Some open models "think" before answering (for example Nemotron Ultra). That uses up the token budget and is slow. For OpenRouter you can try turning thinking off by adding this variable in Render:

    EXTRA_BODY={"reasoning":{"enabled":false}}

If answers are still slow, choose a smaller non-reasoning "instruct" model, or Claude Haiku. Free endpoints are rate limited and may log your data, so do not use them with real children's personal information.
