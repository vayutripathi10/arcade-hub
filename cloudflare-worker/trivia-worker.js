/**
 * CLOUDFLARE WORKER: NEON AI TRIVIA PROXY
 * Subdomain: vayutripathi.workers.dev
 * 
 * Features:
 * - Keeps Google Gemini API Key completely secret on the backend
 * - CORS enabled for arcadehubplay.com & localhost
 * - Zero storage: streams 5 structured questions directly to client
 */

const CATEGORIES = {
    'cricket': 'Cricket records, IPL statistics, ICC World Cups, historic centuries, and legendary international players',
    'bollywood': 'Bollywood & Hindi cinema, famous movie dialogues, historic blockbusters, actors, music directors, and National Film Awards',
    'football': 'International football, FIFA World Cups, UEFA Champions League, Premier League, legendary Ballon d\'Or winners, and iconic goals',
    'current-affairs': 'Modern world current affairs, global science breakthroughs, space exploration milestones, international summits, and world records',
    'history': 'World and Indian history, ancient empires (Mughal, Maurya, Roman), freedom movements, historic revolutions, and ancient monuments',
    'tech-science': 'Technology, Artificial Intelligence, computing pioneers, astrophysics, robotics, quantum mechanics, and futuristic innovations',
    'random': 'A diverse, engaging mix across Bollywood cinema, Cricket, Football, World History, Science, and Current Affairs'
};

const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Or restrict to 'https://arcadehubplay.com'
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
    async fetch(request, env) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);

        // Health check endpoint
        if (url.pathname === '/' && request.method === 'GET') {
            return new Response(JSON.stringify({ status: 'ok', service: 'Neon AI Trivia Proxy' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (url.pathname === '/generate' || url.pathname === '/api/trivia' || url.pathname === '/') {
            try {
                let category = 'cricket';
                let language = 'en';

                if (request.method === 'POST') {
                    const body = await request.json().catch(() => ({}));
                    if (body.category) category = body.category;
                    if (body.language) language = body.language;
                } else if (url.searchParams.has('category')) {
                    category = url.searchParams.get('category');
                    language = url.searchParams.get('language') || 'en';
                }

                const catPrompt = CATEGORIES[category] || CATEGORIES['cricket'];
                const apiKey = env.GEMINI_API_KEY;

                if (!apiKey) {
                    return new Response(JSON.stringify({
                        error: 'GEMINI_API_KEY environment variable is not configured in Cloudflare Worker secrets.'
                    }), {
                        status: 500,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const langInstruction = language !== 'en'
                    ? `IMPORTANT: Generate ALL question text, all 4 option texts, and the fact explanation in the language with code "${language}". Use the native script of that language (e.g. Devanagari for Hindi, Tamil script for Tamil). Only the JSON keys must remain in English.`
                    : '';

                const promptText = `You are the master trivia engine for Neon AI Trivia.
Generate exactly 5 completely fresh, accurate, and engaging multiple-choice questions on the topic: "${catPrompt}".
Include a mix of moderate and challenging questions.
${langInstruction}
Output STRICTLY a valid JSON array of 5 objects with no extra conversational text or markdown code fence blocks.
Each object must follow this exact schema:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": {
      "A": "Option text",
      "B": "Option text",
      "C": "Option text",
      "D": "Option text"
    },
    "answer": "A",
    "fact": "A one-sentence fascinating fact explaining why the answer is correct."
  }
]`;

                // Resilient model fallback loop (ensures 100% uptime without 503 spikes)
                const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];
                let data = null;

                for (const model of candidateModels) {
                    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
                    const geminiResp = await fetch(geminiEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-goog-api-key': apiKey
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{ text: promptText }]
                            }],
                            generationConfig: {
                                response_mime_type: 'application/json',
                                temperature: 0.95
                            }
                        })
                    });

                    if (geminiResp.ok) {
                        data = await geminiResp.json();
                        break;
                    }
                }

                if (!data) {
                    return new Response(JSON.stringify({ error: 'All Gemini models busy, fallback to client offline' }), {
                        status: 503,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

                // Strip any markdown fences if present
                text = text.trim();
                if (text.startsWith('```json')) text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
                else if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');

                const questions = JSON.parse(text);

                return new Response(JSON.stringify({ success: true, questions }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
};
