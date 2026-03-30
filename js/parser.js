/*
 * parser.js
 * Recursive descent parser for propositional logic formulas.
 * Accepts Unicode (→ ∧ ∨ ¬ ⊥) and ASCII alternatives (-> & | ~ _|_).
 *
 * Precedence (lowest to highest): →, ∨, ∧, ¬
 * Implication is right-associative; the rest are left-associative.
 */

const Formula = (() => {

  function Var(name) { return { type: "var", name }; }
  function Bot() { return { type: "bot" }; }
  function Neg(sub) { return { type: "neg", sub }; }
  function And(l, r) { return { type: "and", left: l, right: r }; }
  function Or(l, r) { return { type: "or", left: l, right: r }; }
  function Imp(l, r) { return { type: "imp", left: l, right: r }; }


  function tokenize(input) {
    const tokens = [];
    let i = 0;

    while (i < input.length) {
      const c = input[i];

      if (/\s/.test(c)) {
        i++;
        continue;
      }

      if (c === "(") { tokens.push({ type: "LPAREN" }); i++; continue; }
      if (c === ")") { tokens.push({ type: "RPAREN" }); i++; continue; }
      if (c === ",") { tokens.push({ type: "COMMA" }); i++; continue; }

      if (c === "¬" || c === "~") { tokens.push({ type: "NEG" }); i++; continue; }
      if (c === "∧") { tokens.push({ type: "AND" }); i++; continue; }
      if (c === "∨") { tokens.push({ type: "OR" }); i++; continue; }
      if (c === "→") { tokens.push({ type: "IMP" }); i++; continue; }
      if (c === "⊥") { tokens.push({ type: "BOT" }); i++; continue; }
      if (c === "⇒") { tokens.push({ type: "SEQ" }); i++; continue; }
      if (c === "&") { tokens.push({ type: "AND" }); i++; continue; }
      if (c === "|") { tokens.push({ type: "OR" }); i++; continue; }
      if (c === "!") { tokens.push({ type: "NEG" }); i++; continue; }

      if (c === "-" && input[i + 1] === ">") { tokens.push({ type: "IMP" }); i += 2; continue; }
      if (c === "/" && input[i + 1] === "\\") { tokens.push({ type: "AND" }); i += 2; continue; }
      if (c === "\\" && input[i + 1] === "/") { tokens.push({ type: "OR" }); i += 2; continue; }
      if (c === "=" && input[i + 1] === ">") { tokens.push({ type: "SEQ" }); i += 2; continue; }

      if (c === "_" && input.slice(i, i + 3) === "_|_") {
        tokens.push({ type: "BOT" });
        i += 3;
        continue;
      }

      if (/[A-Za-z]/.test(c)) {
        let name = c.toUpperCase();
        i++;
        while (i < input.length && /[a-z0-9]/.test(input[i])) {
          name += input[i];
          i++;
        }
        tokens.push({ type: "VAR", value: name });
        continue;
      }

      throw new Error("Unexpected character: '" + c + "' at position " + i);
    }

    return tokens;
  }


  function parse(input) {
    const tokens = tokenize(input.trim());
    let pos = 0;

    function peek() {
      return pos < tokens.length ? tokens[pos] : null;
    }

    function advance() {
      return tokens[pos++];
    }

    function expect(type) {
      const t = advance();
      if (!t || t.type !== type) {
        throw new Error("Expected " + type + ", got " + (t ? t.type : "end of input"));
      }
      return t;
    }

    function parseFormula() {
      return parseImp();
    }

    function parseImp() {
      let left = parseOr();
      if (peek() && peek().type === "IMP") {
        advance();
        return Imp(left, parseImp());
      }
      return left;
    }

    function parseOr() {
      let left = parseAnd();
      while (peek() && peek().type === "OR") {
        advance();
        left = Or(left, parseAnd());
      }
      return left;
    }

    function parseAnd() {
      let left = parseUnary();
      while (peek() && peek().type === "AND") {
        advance();
        left = And(left, parseUnary());
      }
      return left;
    }

    function parseUnary() {
      if (peek() && peek().type === "NEG") {
        advance();
        return Neg(parseUnary());
      }
      return parseAtom();
    }

    function parseAtom() {
      const t = peek();
      if (!t) throw new Error("Unexpected end of input");

      if (t.type === "VAR") {
        advance();
        return Var(t.value);
      }
      if (t.type === "BOT") {
        advance();
        return Bot();
      }
      if (t.type === "LPAREN") {
        advance();
        const f = parseFormula();
        expect("RPAREN");
        return f;
      }

      throw new Error("Unexpected token: " + t.type);
    }

    const result = parseFormula();
    if (pos < tokens.length) {
      throw new Error("Unexpected token after formula: " + tokens[pos].type);
    }
    return result;
  }


  function parseSequent(input) {
    const parts = input.split(/⇒|=>/);
    if (parts.length !== 2) {
      throw new Error("A sequent needs exactly one ⇒ (or =>)");
    }
    const antStr = parts[0].trim();
    const sucStr = parts[1].trim();
    return {
      ant: antStr ? splitFormulas(antStr).map(s => parse(s)) : [],
      suc: sucStr ? splitFormulas(sucStr).map(s => parse(s)) : []
    };
  }

  // Splits on commas while respecting parenthesis nesting.
  function splitFormulas(str) {
    const parts = [];
    let depth = 0;
    let current = "";

    for (const c of str) {
      if (c === "(") depth++;
      if (c === ")") depth--;

      if (c === "," && depth === 0) {
        parts.push(current.trim());
        current = "";
      } else {
        current += c;
      }
    }

    if (current.trim()) {
      parts.push(current.trim());
    }
    return parts.filter(s => s.length > 0);
  }


  // Pretty-print a formula. parentPrec controls when we need parens.
  function formulaToString(f, parentPrec) {
    parentPrec = parentPrec || 0;

    if (f.type === "var") return f.name;
    if (f.type === "bot") return "⊥";
    if (f.type === "neg") return "¬" + formulaToString(f.sub, 4);

    let s, prec;
    if (f.type === "and") {
      s = formulaToString(f.left, 3) + " ∧ " + formulaToString(f.right, 3);
      prec = 3;
    } else if (f.type === "or") {
      s = formulaToString(f.left, 2) + " ∨ " + formulaToString(f.right, 2);
      prec = 2;
    } else if (f.type === "imp") {
      s = formulaToString(f.left, 2) + " → " + formulaToString(f.right, 1);
      prec = 1;
    }

    return parentPrec > prec ? "(" + s + ")" : s;
  }

  function sequentToString(seq) {
    const antStr = seq.ant.map(f => formulaToString(f)).join(", ");
    const sucStr = seq.suc.map(f => formulaToString(f)).join(", ");
    if (!antStr) return "⇒ " + sucStr;
    if (!sucStr) return antStr + " ⇒";
    return antStr + " ⇒ " + sucStr;
  }


  function depth(f) {
    if (f.type === "var" || f.type === "bot") return 0;
    if (f.type === "neg") return 1 + depth(f.sub);
    return 1 + Math.max(depth(f.left), depth(f.right));
  }

  // The termination measure: sum of formula depths across the whole sequent.
  function sequentDepth(seq) {
    let d = 0;
    for (const f of seq.ant) d += depth(f);
    for (const f of seq.suc) d += depth(f);
    return d;
  }

  function equal(a, b) {
    if (a.type !== b.type) return false;
    if (a.type === "var") return a.name === b.name;
    if (a.type === "bot") return true;
    if (a.type === "neg") return equal(a.sub, b.sub);
    return equal(a.left, b.left) && equal(a.right, b.right);
  }

  function isAtomic(f) {
    return f.type === "var" || f.type === "bot";
  }

  return {
    parse, parseSequent,
    formulaToString, sequentToString,
    depth, sequentDepth,
    equal, isAtomic,
    Var, Bot, Neg, And, Or, Imp
  };

})();
