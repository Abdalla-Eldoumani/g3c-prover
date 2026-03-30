/*
 * prover.js
 * Backward-chaining proof search for propositional G3c.
 *
 * Works bottom-up: start from the goal sequent, pick a compound formula,
 * apply the matching G3c rule in reverse, and recurse on the premise(s).
 * Each rule application strictly reduces the total formula depth of the
 * sequent, so search always terminates.
 */

const Prover = (() => {

  const { sequentToString, equal, isAtomic } = Formula;

  function contains(list, f) {
    return list.some(g => equal(f, g));
  }

  function proofNode(sequent, rule, premises) {
    return { sequent, rule, premises: premises || [] };
  }

  // G3c axioms:
  //   (1) C, Γ ⇒ Δ, C  where C is atomic
  //   (2) ⊥, Γ ⇒ Δ
  function tryAxiom(seq) {
    if (seq.ant.some(f => f.type === "bot")) {
      return proofNode(seq, "⊥L");
    }
    for (const f of seq.ant) {
      if (isAtomic(f) && contains(seq.suc, f)) {
        return proofNode(seq, "Ax");
      }
    }
    return null;
  }


  function search(seq, d) {
    if (d > 200) return null;

    const ax = tryAxiom(seq);
    if (ax) return ax;

    // Try decomposing something on the left
    for (let i = 0; i < seq.ant.length; i++) {
      const f = seq.ant[i];
      if (isAtomic(f)) continue;

      const rest = seq.ant.slice(0, i).concat(seq.ant.slice(i + 1));
      const result = tryLeftRule(f, rest, seq.suc, d);
      if (result) return proofNode(seq, result.rule, result.premises);
    }

    // Try decomposing something on the right
    for (let i = 0; i < seq.suc.length; i++) {
      const f = seq.suc[i];
      if (isAtomic(f)) continue;

      const rest = seq.suc.slice(0, i).concat(seq.suc.slice(i + 1));
      const result = tryRightRule(f, seq.ant, rest, d);
      if (result) return proofNode(seq, result.rule, result.premises);
    }

    return null;
  }


  function tryLeftRule(f, restAnt, suc, d) {
    if (f.type === "neg") {
      // ¬L: move the negated formula to the right
      const p = search({ ant: restAnt, suc: suc.concat([f.sub]) }, d + 1);
      if (p) return { rule: "¬L", premises: [p] };
    }

    if (f.type === "and") {
      // ∧L: unpack both conjuncts into the antecedent
      const p = search({ ant: [f.left, f.right].concat(restAnt), suc: suc.slice() }, d + 1);
      if (p) return { rule: "∧L", premises: [p] };
    }

    if (f.type === "or") {
      // ∨L: splits into two branches, one for each disjunct
      const p1 = search({ ant: [f.left].concat(restAnt), suc: suc.slice() }, d + 1);
      if (!p1) return null;
      const p2 = search({ ant: [f.right].concat(restAnt), suc: suc.slice() }, d + 1);
      if (!p2) return null;
      return { rule: "∨L", premises: [p1, p2] };
    }

    if (f.type === "imp") {
      // →L: need both Γ ⇒ Δ, A and B, Γ ⇒ Δ
      const p1 = search({ ant: restAnt, suc: suc.concat([f.left]) }, d + 1);
      if (!p1) return null;
      const p2 = search({ ant: [f.right].concat(restAnt), suc: suc.slice() }, d + 1);
      if (!p2) return null;
      return { rule: "→L", premises: [p1, p2] };
    }

    return null;
  }


  function tryRightRule(f, ant, restSuc, d) {
    if (f.type === "neg") {
      // ¬R: move the negated formula to the left
      const p = search({ ant: [f.sub].concat(ant), suc: restSuc }, d + 1);
      if (p) return { rule: "¬R", premises: [p] };
    }

    if (f.type === "and") {
      // ∧R: splits into two branches
      const p1 = search({ ant: ant.slice(), suc: restSuc.concat([f.left]) }, d + 1);
      if (!p1) return null;
      const p2 = search({ ant: ant.slice(), suc: restSuc.concat([f.right]) }, d + 1);
      if (!p2) return null;
      return { rule: "∧R", premises: [p1, p2] };
    }

    if (f.type === "or") {
      // ∨R: put both disjuncts in the succedent
      const p = search({ ant: ant.slice(), suc: restSuc.concat([f.left, f.right]) }, d + 1);
      if (p) return { rule: "∨R", premises: [p] };
    }

    if (f.type === "imp") {
      // →R: antecedent goes left, consequent stays right
      const p = search({ ant: [f.left].concat(ant), suc: restSuc.concat([f.right]) }, d + 1);
      if (p) return { rule: "→R", premises: [p] };
    }

    return null;
  }


  function prove(formulaStr) {
    return search({ ant: [], suc: [Formula.parse(formulaStr)] }, 0);
  }

  function proveSequent(sequentStr) {
    return search(Formula.parseSequent(sequentStr), 0);
  }

  // Convert to the JSON format used by ProofJS (gleachkr/ProofJS).
  function toProofJS(tree) {
    if (!tree) return null;
    return {
      label: sequentToString(tree.sequent),
      rule: tree.rule,
      forest: tree.premises.map(toProofJS)
    };
  }

  function proofStats(tree) {
    if (!tree) return null;
    let nodes = 0;
    let maxDepth = 0;

    function walk(t, level) {
      nodes++;
      if (level > maxDepth) maxDepth = level;
      for (const p of t.premises) walk(p, level + 1);
    }

    walk(tree, 0);
    return { nodes, depth: maxDepth };
  }

  return { search, prove, proveSequent, toProofJS, proofStats };

})();
