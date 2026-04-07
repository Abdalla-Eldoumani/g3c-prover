# G3c Proof Search

A web app that does automated proof search in the propositional fragment of G3c.

**Live site:** [g3c-prover.vercel.app](https://g3c-prover.vercel.app)

## What it does

You enter a propositional formula or a full sequent. The app runs backward proof search through the G3c rules and either constructs a complete cut-free derivation tree or reports that the formula isn't provable. Everything happens in the browser.

The proof tree is drawn in the standard Gentzen style, with horizontal lines separating premises from conclusions and each inference labeled with the rule used. There are pan and zoom controls for navigating large derivations, you can share specific formulas via URL, and proofs can be exported as JSON in a format compatible with [ProofJS](https://github.com/gleachkr/ProofJS).

## How it works

The propositional fragment of G3c has two axiom forms (`C, Γ ⇒ Δ, C` for atomic C, and `⊥, Γ ⇒ Δ`) and eight logical rules: one left and one right rule for each of negation, conjunction, disjunction, and implication. G3c is contraction-free, so weakening and contraction are absorbed into the logical rules and there are no separate structural rules.

The search starts from the goal sequent and applies rules backward. At each step, it picks a non-atomic formula in the antecedent or succedent, applies the matching rule in reverse, and recurses on the resulting premises. Branching rules like `∧R` and `∨L` create multiple sub-goals, all of which need to close at axioms for the proof to succeed.

Termination comes from the following observation. Define the depth of a formula recursively (atoms are 0, each connective adds 1) and the depth of a sequent as the sum of depths of its formula occurrences. Every backward rule application strictly decreases sequent depth. Since sequent depth is a natural number, the search has to terminate. When it does, every formula is atomic, and the algorithm just checks whether the sequent is an axiom.

Because G3c is already cut-free, the subformula property comes along with it: only subformulas of the original input ever show up during the search.

## Project structure

```
g3c-prover/
├── index.html          # Single-page app: nav, playground, theory, about
├── css/
│   └── prooftree.css   # Gentzen-style derivation tree layout
└── js/
    ├── parser.js       # Recursive descent parser for propositional formulas
    ├── prover.js       # Backward proof search engine
    └── renderer.js     # HTML proof tree renderer
```

Open `index.html` in a browser to run it locally.

## Course context

Final project for PHIL 579 (Proof Theory), Winter 2026, at the University of Calgary, taught by Professor Richard Zach.

The implementation follows the textbook conventions for G3c. Quantifier rules were left out: extending to first-order would require a more involved termination strategy, since quantifier rules can introduce new terms and break the simple depth-decrease argument.

## References

- Zach, R. *Sequents and Proofs: An Open Introduction to Proof Theory.* Open Logic Project, 2026.
- Negri, S. and von Plato, J. *Structural Proof Theory.* Cambridge University Press, 2001.
- Troelstra, A.S. and Schwichtenberg, H. *Basic Proof Theory.* 2nd ed., Cambridge University Press, 2000.

## Author

Abdalla ElDoumani, University of Calgary, Winter 2026.
