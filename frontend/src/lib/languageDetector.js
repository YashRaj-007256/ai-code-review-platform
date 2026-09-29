/**
 * Language Detector Utility
 * High-accuracy weighted pattern detector for programming languages.
 */

const PATTERNS = {
  html: [
    { regex: /<!DOCTYPE\s+html/i, weight: 12 },
    { regex: /<html[^>]*>/i, weight: 12 },
    { regex: /<body[^>]*>/i, weight: 10 },
    { regex: /<div[^>]*>/i, weight: 6 },
    { regex: /<span[^>]*>/i, weight: 5 },
    { regex: /<\/([a-z1-6]+)>/i, weight: 5 },
    { regex: /class="[^"]*"/i, weight: 4 },
    { regex: /xmlns="/i, weight: 8 },
  ],
  css: [
    { regex: /@media\s*\(/i, weight: 12 },
    { regex: /@keyframes\s+[a-zA-Z0-9_-]+/i, weight: 12 },
    { regex: /;\s*[a-zA-Z-]+\s*:\s*[^;]+;/i, weight: 5 },
    { regex: /font-family\s*:/i, weight: 8 },
    { regex: /background-color\s*:/i, weight: 8 },
    { regex: /border-radius\s*:/i, weight: 8 },
    { regex: /box-shadow\s*:/i, weight: 8 },
    { regex: /!important/i, weight: 7 },
    { regex: /[a-zA-Z0-9_.-]+\s*\{\s*[a-zA-Z-]+\s*:/i, weight: 8 },
  ],
  sql: [
    { regex: /\bSELECT\b[\s\S]+\bFROM\b/i, weight: 15 },
    { regex: /\bINSERT\s+INTO\b/i, weight: 12 },
    { regex: /\bUPDATE\b[\s\S]+\bSET\b/i, weight: 12 },
    { regex: /\bDELETE\s+FROM\b/i, weight: 12 },
    { regex: /\bCREATE\s+TABLE\b/i, weight: 12 },
    { regex: /\bGROUP\s+BY\b/i, weight: 10 },
    { regex: /\bORDER\s+BY\b/i, weight: 10 },
    { regex: /\bWHERE\b\s+[a-zA-Z0-9_.]+/i, weight: 8 },
    { regex: /\bJOIN\b\s+[a-zA-Z0-9_.]+\s+\bON\b/i, weight: 10 },
  ],
  python: [
    { regex: /^def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/m, weight: 10 },
    { regex: /^import\s+[a-zA-Z0-9_.,\s]+/m, weight: 6 },
    { regex: /^from\s+[a-zA-Z0-9_.]+\s+import\s+/m, weight: 10 },
    { regex: /^elif\s+/m, weight: 9 },
    { regex: /if\s+__name__\s*==\s*['"]__main__['"]:/, weight: 15 },
    { regex: /print\s*\(/, weight: 5 },
    { regex: /\bself\.[a-zA-Z_]/, weight: 8 },
    { regex: /^class\s+[a-zA-Z_][a-zA-Z0-9_]*(\([a-zA-Z0-9_, ]*\))?:/m, weight: 10 },
    { regex: /\bpass\b/, weight: 6 },
  ],
  php: [
    { regex: /<\?php/i, weight: 18 },
    { regex: /\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/, weight: 9 },
    { regex: /\becho\s+['"]/i, weight: 8 },
    { regex: /namespace\s+[a-zA-Z0-9_\\]+;/i, weight: 10 },
    { regex: /use\s+[a-zA-Z0-9_\\]+;/i, weight: 8 },
    { regex: /->[a-zA-Z_]/, weight: 7 },
  ],
  java: [
    { regex: /public\s+class\s+[a-zA-Z0-9_]+/m, weight: 12 },
    { regex: /public\s+static\s+void\s+main\s*\(\s*String/m, weight: 15 },
    { regex: /System\.out\.println\s*\(/, weight: 12 },
    { regex: /^import\s+java\.[a-zA-Z0-9_.*]+;/m, weight: 10 },
    { regex: /^package\s+[a-zA-Z0-9_.]+;/m, weight: 8 },
    { regex: /@Override/, weight: 8 },
    { regex: /private\s+(final\s+)?(String|int|boolean|double|float|long|List|Map)\s+[a-zA-Z0-9_]+;/m, weight: 8 },
  ],
  cpp: [
    { regex: /#include\s*<iostream>/, weight: 15 },
    { regex: /#include\s*<(vector|string|algorithm|map|set|memory|cmath)>/, weight: 12 },
    { regex: /std::(cout|cin|endl|string|vector|map|make_shared|unique_ptr)/, weight: 12 },
    { regex: /using\s+namespace\s+std\s*;/, weight: 12 },
    { regex: /cout\s*<</, weight: 10 },
    { regex: /cin\s*>>/, weight: 10 },
    { regex: /template\s*<\s*typename\s+/, weight: 9 },
  ],
  c: [
    { regex: /#include\s*<stdio\.h>/, weight: 15 },
    { regex: /#include\s*<stdlib\.h>/, weight: 12 },
    { regex: /#include\s*<string\.h>/, weight: 10 },
    { regex: /printf\s*\(/, weight: 9 },
    { regex: /scanf\s*\(/, weight: 9 },
    { regex: /int\s+main\s*\(\s*int\s+argc\s*,\s*char\s*\*+/m, weight: 12 },
    { regex: /malloc\s*\(/, weight: 8 },
    { regex: /typedef\s+struct\b/, weight: 9 },
  ],
  csharp: [
    { regex: /using\s+System\s*;/m, weight: 12 },
    { regex: /using\s+System\.[a-zA-Z0-9_.]+\s*;/m, weight: 10 },
    { regex: /Console\.WriteLine\s*\(/, weight: 12 },
    { regex: /namespace\s+[a-zA-Z0-9_.]+\s*\{/m, weight: 8 },
    { regex: /public\s+async\s+Task(<[a-zA-Z0-9_]+>)?\s+/m, weight: 9 },
    { regex: /\{\s*get\s*;\s*set\s*;\s*\}/m, weight: 10 },
    { regex: /\[Http(Get|Post|Put|Delete)\]/, weight: 10 },
  ],
  go: [
    { regex: /^package\s+main\b/m, weight: 15 },
    { regex: /^package\s+[a-zA-Z0-9_]+\b/m, weight: 10 },
    { regex: /^import\s+\(\s*"/m, weight: 10 },
    { regex: /func\s+main\s*\(\s*\)/m, weight: 12 },
    { regex: /func\s+\([a-zA-Z0-9_]+\s+\*?[a-zA-Z0-9_]+\)\s+[a-zA-Z0-9_]+/m, weight: 10 },
    { regex: /fmt\.(Println|Printf|Sprintf)\s*\(/, weight: 10 },
    { regex: /:=/, weight: 6 },
    { regex: /if\s+err\s*!=\s*nil\s*\{/, weight: 12 },
    { regex: /type\s+[a-zA-Z0-9_]+\s+struct\s*\{/m, weight: 10 },
  ],
  rust: [
    { regex: /fn\s+main\s*\(\s*\)/m, weight: 15 },
    { regex: /fn\s+[a-zA-Z0-9_]+\s*\(/m, weight: 8 },
    { regex: /let\s+mut\s+[a-zA-Z0-9_]+/m, weight: 10 },
    { regex: /println!\s*\(/, weight: 12 },
    { regex: /eprintln!\s*\(/, weight: 12 },
    { regex: /use\s+std::[a-zA-Z0-9_:]+;/m, weight: 10 },
    { regex: /impl(\s+<[a-zA-Z0-9_,\s]+>)?\s+[a-zA-Z0-9_]+/m, weight: 10 },
    { regex: /match\s+[a-zA-Z0-9_.()]+\s*\{/m, weight: 8 },
    { regex: /pub\s+fn\s+/, weight: 8 },
    { regex: /Result<[a-zA-Z0-9_,\s]+>/, weight: 7 },
  ],
  ruby: [
    { regex: /^def\s+[a-zA-Z0-9_?!]+(\s*\(|\s+[a-zA-Z])/m, weight: 8 },
    { regex: /^require\s+['"][a-zA-Z0-9_/-]+['"]/m, weight: 9 },
    { regex: /^require_relative\s+['"][a-zA-Z0-9_/-]+['"]/m, weight: 10 },
    { regex: /puts\s+['"]/m, weight: 7 },
    { regex: /attr_(accessor|reader|writer)\s+:/m, weight: 12 },
    { regex: /do\s*\|[a-zA-Z0-9_,\s]+\|/m, weight: 9 },
    { regex: /^elsif\b/m, weight: 8 },
    { regex: /^class\s+[A-Z][a-zA-Z0-9_]*(\s*<\s*[A-Z][a-zA-Z0-9_]*)?/m, weight: 7 },
  ],
  typescript: [
    { regex: /interface\s+[A-Z][a-zA-Z0-9_]*(\s*<[a-zA-Z0-9_,\s]+>)?\s*\{/m, weight: 12 },
    { regex: /type\s+[A-Z][a-zA-Z0-9_]*\s*=\s*/m, weight: 10 },
    { regex: /:\s*(string|number|boolean|any|void|unknown|never|object)(\[\])?[\s;,=)]/m, weight: 9 },
    { regex: /enum\s+[A-Z][a-zA-Z0-9_]*\s*\{/m, weight: 10 },
    { regex: /implements\s+[A-Z][a-zA-Z0-9_]*/m, weight: 9 },
    { regex: /as\s+const\b/, weight: 8 },
    { regex: /export\s+interface\b/, weight: 12 },
    { regex: /import\s+type\s+/, weight: 12 },
  ],
  javascript: [
    { regex: /const\s+[a-zA-Z0-9_$]+\s*=\s*/m, weight: 5 },
    { regex: /let\s+[a-zA-Z0-9_$]+\s*=\s*/m, weight: 5 },
    { regex: /var\s+[a-zA-Z0-9_$]+\s*=\s*/m, weight: 5 },
    { regex: /function\s+[a-zA-Z0-9_$]*\s*\(/m, weight: 5 },
    { regex: /=>\s*\{/, weight: 6 },
    { regex: /console\.log\s*\(/, weight: 7 },
    { regex: /document\.getElementById\s*\(/, weight: 9 },
    { regex: /export\s+default\s+/, weight: 7 },
    { regex: /require\s*\(['"][a-zA-Z0-9_/@.-]+['"]\)/, weight: 7 },
    { regex: /import\s+.*?\s+from\s+['"][a-zA-Z0-9_/@.-]+['"]/, weight: 6 },
  ],
};

export function detectLanguage(code) {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return { language: null, confidence: 0 };
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

  // Handle TypeScript vs JavaScript distinction
  if (scores.typescript > 0 && scores.typescript >= scores.javascript) {
    scores.typescript += 3;
  }

  // Handle C vs C++ distinction
  if (scores.cpp > 0 && scores.cpp >= scores.c) {
    scores.cpp += 3;
  }

  let topLang = null;
  let maxScore = 0;

  Object.entries(scores).forEach(([lang, score]) => {
    if (score > maxScore) {
      maxScore = score;
      topLang = lang;
    }
  });

  if (maxScore < 3) {
    return { language: null, confidence: 0 };
  }

  return {
    language: topLang,
    confidence: maxScore,
  };
}
