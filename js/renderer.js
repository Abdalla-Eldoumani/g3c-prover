/*
 * renderer.js
 * Takes a proof tree from the prover and draws it as a
 * Gentzen-style derivation using nested HTML divs.
 */

const Renderer = (() => {

  const { sequentToString } = Formula;

  function renderTree(tree, container) {
    container.innerHTML = "";
    if (!tree) {
      const msg = document.createElement("p");
      msg.className = "no-proof-msg";
      msg.textContent = "No proof exists. This sequent is not provable in G3c.";
      container.appendChild(msg);
      return;
    }
    container.appendChild(buildNode(tree));
  }

  function buildNode(tree) {
    const node = document.createElement("div");
    node.className = "proof-node";

    if (tree.premises.length > 0) {
      const row = document.createElement("div");
      row.className = "proof-premises";
      for (const p of tree.premises) {
        row.appendChild(buildNode(p));
      }
      node.appendChild(row);
    }

    // The horizontal line + rule label
    const inf = document.createElement("div");
    inf.className = "proof-inference";

    const line = document.createElement("div");
    line.className = "proof-line";
    inf.appendChild(line);

    const rule = document.createElement("span");
    rule.className = "proof-rule";
    rule.textContent = tree.rule;
    inf.appendChild(rule);

    node.appendChild(inf);

    // The sequent below the line
    const conc = document.createElement("div");
    conc.className = "proof-conclusion";
    conc.textContent = sequentToString(tree.sequent);
    node.appendChild(conc);

    return node;
  }

  function toJSON(tree) {
    return JSON.stringify(Prover.toProofJS(tree), null, 2);
  }

  return { renderTree, toJSON };

})();
