/**
 * One-shot cleanup: strip legacy v1/v2 CSS rule blocks from globals.css.
 *
 * Reads /tmp/css_legacy_orphans.txt (a list of `.classname` selectors that
 * have zero references in any JSX/component file), then walks globals.css
 * and removes every rule whose entire comma-separated selector list is made
 * up of orphan classes. If a block has ANY selector still in use, it is
 * kept verbatim.
 *
 * Why a parser, not sed: rules can span lines, share commas, sit nested
 * inside @media, or share blocks with descendants/pseudo-elements like
 * `.orphan:hover`, `.orphan::before`. Naive grep/sed would either over-
 * delete or leave broken syntax.
 *
 *   node scripts/strip-legacy-css.mjs        # dry-run summary
 *   node scripts/strip-legacy-css.mjs --apply  # rewrite the file
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const CSS_PATH = resolve(__dirname, "../app/globals.css");
const ORPHANS_PATH = resolve(__dirname, "css_legacy_orphans.txt");

const orphans = new Set(
  readFileSync(ORPHANS_PATH, "utf8")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
);

const css = readFileSync(CSS_PATH, "utf8");

// Strip a selector down to its bare class so `.foo:hover`, `.foo::before`,
// `.foo .bar`, `.foo[data-x]` all collapse to `.foo` for orphan lookup.
// We only care about the *first* class token — descendants don't change
// whether the rule's own root selector is orphan.
function rootClass(sel) {
  const trimmed = sel.trim();
  if (!trimmed.startsWith(".")) return null;
  // Match the leading .className up to the first non-classname char.
  const m = trimmed.match(/^\.[a-zA-Z][a-zA-Z0-9_-]*/);
  return m ? m[0] : null;
}

function selectorListIsAllOrphan(selectorText) {
  // Multi-selectors: ".a, .b:hover, .c .d" — only orphan if EVERY top-level
  // selector resolves to a class AND that class is in the orphan set.
  const parts = selectorText.split(",").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return false;
  for (const p of parts) {
    const root = rootClass(p);
    if (!root || !orphans.has(root)) return false;
  }
  return true;
}

// Walk char-by-char tracking brace depth. At depth 0 (file root) and at
// depth 1 (inside @media), each top-level `{` opens a rule whose selector
// is everything from the previous block-terminator up to that brace.
const out = [];
let i = 0;
let blockStart = 0; // index where the current top-level "selector or @rule" began
let depth = 0;
let removed = [];
let keptForReport = 0;

function findMatchingBrace(start) {
  // Returns index AFTER the matching `}` for the `{` at `start`.
  let d = 0;
  for (let k = start; k < css.length; k++) {
    const c = css[k];
    if (c === "{") d++;
    else if (c === "}") {
      d--;
      if (d === 0) return k + 1;
    }
  }
  return -1;
}

function processSegment(start, end, parentDepth) {
  // Walk the [start, end) substring, finding top-level rules at parentDepth.
  let cur = start;
  let segStart = start;
  while (cur < end) {
    const ch = css[cur];
    if (ch === "{") {
      const selectorText = css.slice(segStart, cur).trim();
      const close = findMatchingBrace(cur);
      if (close === -1) {
        // Unbalanced — bail and emit rest verbatim.
        out.push(css.slice(segStart, end));
        return;
      }

      // Detect @media / @supports etc. — recurse into their bodies.
      if (selectorText.startsWith("@media") || selectorText.startsWith("@supports") || selectorText.startsWith("@layer")) {
        // Emit the @rule prelude + opening brace verbatim.
        out.push(css.slice(segStart, cur + 1));
        // Recurse into body (between `{` and the matching `}`).
        processSegment(cur + 1, close - 1, parentDepth + 1);
        // Emit the closing brace.
        out.push("}");
        cur = close;
        segStart = cur;
        continue;
      }

      // Regular rule — check if all selectors are orphan.
      if (selectorListIsAllOrphan(selectorText)) {
        removed.push(selectorText.replace(/\s+/g, " ").slice(0, 90));
        // Skip the entire block, including any trailing whitespace/newline.
        let after = close;
        // Eat one trailing newline so we don't leave a blank line gap.
        if (css[after] === "\r") after++;
        if (css[after] === "\n") after++;
        cur = after;
        segStart = cur;
        continue;
      }

      // Keep this rule (selector + body) verbatim. Track for reporting if
      // the rule references an orphan in a comma list — useful diagnostic.
      const parts = selectorText.split(",").map((s) => s.trim());
      if (parts.some((p) => orphans.has(rootClass(p)))) keptForReport++;
      out.push(css.slice(segStart, close));
      cur = close;
      segStart = cur;
      continue;
    }
    if (ch === "}") {
      // End of parent block — emit rest of segment verbatim.
      out.push(css.slice(segStart, cur));
      return;
    }
    cur++;
  }
  out.push(css.slice(segStart, end));
}

processSegment(0, css.length, 0);
const result = out.join("");

console.log(`Original: ${css.length} chars / ${css.split("\n").length} lines`);
console.log(`Result:   ${result.length} chars / ${result.split("\n").length} lines`);
console.log(`Removed ${removed.length} rule block(s):`);
for (const sel of removed) console.log("  -", sel);
if (keptForReport) {
  console.log(`Kept ${keptForReport} multi-selector rule(s) where at least one selector is still alive — review manually if you want them split.`);
}

if (APPLY) {
  writeFileSync(CSS_PATH, result);
  console.log("\n✓ globals.css rewritten.");
} else {
  console.log("\n(dry-run; pass --apply to write)");
}
