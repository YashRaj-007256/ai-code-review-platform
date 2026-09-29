/**
 * Backend Language Detector Service
 */

const PATTERNS = {
  html: [
    { regex: /<!DOCTYPE\s+html/i, weight: 12 },
    { regex: /<html[^>]*>/i, weight: 12 },
    { regex: /<body[^>]*>/i, weight: 10 },
    { regex: /<div[^>]*>/i, weight: 6 },
    { regex: /<span[^>]*>/i, weight: 5 },
    { regex: /<\/([a-z1-6]+)>/i, weight: 5 },
  ],
  css: [
    { regex: /@media\s*\(/i, weight: 12 },
    { regex: /@keyframes\s+[a-zA-Z0-9_-]+/i, weight: 12 },
    { regex: /font-family\s*:/i, weight: 8 },
    { regex: /background-color\s*:/i, weight: 8 },
    { regex: /border-radius\s*:/i, weight: 8 },
    { regex: /[a-zA-Z0-9_.-]+\s*\{\s*[a-zA-Z-]+\s*:/i, weight: 8 },
  ],
  sql: [
    { regex: /\bSELECT\b[\s\S]+\bFROM\b/i, weight: 15 },
    { regex: /\bINSERT\s+INTO\b/i, weight: 12 },
    { regex: /\bUPDATE\b[\s\S]+\bSET\b/i, weight: 12 },
    { regex: /\bDELETE\s+FROM\b/i, weight: 12 },
    { regex: /\bCREATE\s+TABLE\b/i, weight: 12 },
  ],
  python: [
    { regex: /^def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/m, weight: 10 },
    { regex: /^import\s+[a-zA-Z0-9_.,\s]+/m, weight: 6 },
    { regex: /^from\s+[a-zA-Z0-9_.]+\s+import\s+/m, weight: 10 },
    { regex: /if\s+__name__\s*==\s*['"]__main__['"]:/, weight: 15 },
    { regex: /print\s*\(/, weight: 5 },
  ],
  php: [
    { regex: /<\?php/i, weight: 18 },
    { regex: /\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/, weight: 9 },
    { regex: /namespace\s+[a-zA-Z0-9_\\]+;/i, weight: 10 },
  ],
  java: [
    { regex: /public\s+class\s+[a-zA-Z0-9_]+/m, weight: 12 },
    { regex: /public\s+static\s+void\s+main\s*\(\s*String/m, weight: 15 },
    { regex: /System\.out\.println\s*\(/, weight: 12 },
  ],
  cpp: [
    { regex: /#include\s*<iostream>/, weight: 15 },
    { regex: /std::(cout|cin|endl|string|vector)/, weight: 12 },
    { regex: /using\s+namespace\s+std\s*;/, weight: 12 },
  ],
  c: [
    { regex: /#include\s*<stdio\.h>/, weight: 15 },
    { regex: /#include\s*<stdlib\.h>/, weight: 12 },
    { regex: /printf\s*\(/, weight: 9 },
  ],
  csharp: [
    { regex: /using\s+System\s*;/m, weight: 12 },
    { regex: /Console\.WriteLine\s*\(/, weight: 12 },
    { regex: /namespace\s+[a-zA-Z0-9_.]+\s*\{/m, weight: 8 },
  ],
  go: [
    { regex: /^package\s+main\b/m, weight: 15 },
    { regex: /func\s+main\s*\(\s*\)/m, weight: 12 },
    { regex: /fmt\.(Println|Printf|Sprintf)\s*\(/, weight: 10 },
  ],
  rust: [
    { regex: /fn\s+main\s*\(\s*\)/m, weight: 15 },
    { regex: /println!\s*\(/, weight: 12 },
    { regex: /use\s+std::[a-zA-Z0-9_:]+;/m, weight: 10 },
  ],
  ruby: [
    { regex: /^def\s+[a-zA-Z0-9_?!]+(\s*\(|\s+[a-zA-Z])/m, weight: 8 },
    { regex: /attr_(accessor|reader|writer)\s+:/m, weight: 12 },
  ],
  typescript: [
    { regex: /interface\s+[A-Z][a-zA-Z0-9_]*(\s*<[a-zA-Z0-9_,\s]+>)?\s*\{/m, weight: 12 },
    { regex: /type\s+[A-Z][a-zA-Z0-9_]*\s*=\s*/m, weight: 10 },
    { regex: /export\s+interface\b/, weight: 12 },
  ],
  javascript: [
    { regex: /const\s+[a-zA-Z0-9_$]+\s*=\s*/m, weight: 5 },
    { regex: /let\s+[a-zA-Z0-9_$]+\s*=\s*/m, weight: 5 },
    { regex: /function\s+[a-zA-Z0-9_$]*\s*\(/m, weight: 5 },
    { regex: /console\.log\s*\(/, weight: 7 },
  ],
};

function detectLanguage(code) {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return 'javascript';
  }

  const scores = {};
  Object.keys(PATTERNS).forEach((lang) => {
    scores[lang] = 0;
    PATTERNS[lang].forEach(({ regex, weight }) => {
      if (regex.test(code)) {
        scores[lang] += weight;
      }
    });
  });

  if (scores.typescript > 0 && scores.typescript >= scores.javascript) {
    scores.typescript += 3;
  }
  if (scores.cpp > 0 && scores.cpp >= scores.c) {
    scores.cpp += 3;
  }

  let topLang = 'javascript';
  let maxScore = 0;

  Object.entries(scores).forEach(([lang, score]) => {
    if (score > maxScore) {
      maxScore = score;
      topLang = lang;
    }
  });

  return topLang;
}

module.exports = { detectLanguage };
