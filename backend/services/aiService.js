const fetch = require('node-fetch');

const SYSTEM_PROMPT = `You are an expert senior software engineer performing a thorough code review.
Review the code the user submits and respond ONLY in well-structured Markdown with these exact sections:

## Overall Summary
A short 2-3 sentence summary of code quality.

## Score
Give a single integer score out of 100 on the line formatted exactly as: **Score: <number>/100**

## Strengths
Bullet list of what the code does well.

## Issues Found
Bullet list of bugs, bad practices, or risks. Mention severity (Critical/Major/Minor) for each.

## Suggestions
Concrete, actionable improvements, with short code snippets where useful.

## Security Considerations
Note any security concerns, or state "No major security concerns found."

## Refactored Fixed Code
Provide the COMPLETE, fully corrected, production-ready version of the submitted code with all security vulnerabilities, bugs, and performance bottlenecks resolved. Always wrap it inside a Markdown code block with the language identifier (e.g. \`\`\`js ... \`\`\`). Do NOT truncate or leave out parts of the code.

Keep the review focused, specific to the actual code given, and avoid generic filler.`;

async function callGemini(code, language) {
  const apiKey = process.env.GEMINI_API_KEY;
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured on the server (.env)');
  }

  const modelsToTry = Array.from(new Set([primaryModel, 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite']));
  let lastError;

  for (const model of modelsToTry) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const body = {
      contents: [
        {
          parts: [
            { text: `${SYSTEM_PROMPT}\n\nLanguage: ${language}\n\nCode to review:\n\`\`\`${language}\n${code}\n\`\`\`` }
          ]
        }
      ]
    };
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error?.message || `Gemini API request failed (${resp.status})`);
      }
      const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n');
      if (!text) throw new Error('Gemini returned an empty response');
      return text;
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini API] Model ${model} failed: ${err.message}`);
    }
  }

  throw lastError || new Error('Gemini API request failed');
}

async function callOpenAI(code, language) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OPENAI_API_KEY is not configured on the server (.env)');
  }
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Language: ${language}\n\nCode to review:\n\`\`\`${language}\n${code}\n\`\`\`` }
      ],
      temperature: 0.3
    })
  });
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data?.error?.message || 'OpenAI API request failed');
  }
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned an empty response');
  return text;
}

function extractScore(markdown) {
  const match = markdown.match(/\*\*Score:\s*(\d{1,3})\s*\/\s*100\*\*/i);
  if (match) {
    const val = parseInt(match[1], 10);
    return Math.max(0, Math.min(100, val));
  }
  return null;
}

function extractFixedCode(markdown) {
  if (!markdown) return null;
  // Match section ## Refactored Fixed Code followed by a code block ```...```
  const sectionRegex = /##\s*(?:Refactored|Fixed|Corrected)\s*Code[\s\S]*?```(?:[a-zA-Z0-9_+-]+)?\n([\s\S]*?)```/i;
  const match = markdown.match(sectionRegex);
  if (match && match[1] && match[1].trim()) {
    return match[1].trim();
  }

  // Fallback: search for any code block after Refactored Fixed Code header
  const afterHeaderMatch = markdown.match(/Refactored\s*Fixed\s*Code[\s\S]*/i);
  if (afterHeaderMatch) {
    const codeBlockMatch = afterHeaderMatch[0].match(/```(?:[a-zA-Z0-9_+-]+)?\n([\s\S]*?)```/);
    if (codeBlockMatch && codeBlockMatch[1] && codeBlockMatch[1].trim()) {
      return codeBlockMatch[1].trim();
    }
  }

  return null;
}

async function reviewCode(code, language) {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  let markdown;
  if (provider === 'openai') {
    markdown = await callOpenAI(code, language);
  } else {
    markdown = await callGemini(code, language);
  }
  const score = extractScore(markdown);
  const fixedCode = extractFixedCode(markdown);
  return { markdown, score, fixedCode };
}

module.exports = { reviewCode, extractFixedCode };
