/*
 * renderer.js
 * Takes a proof tree from the prover and draws it as a
 * Gentzen-style derivation using nested HTML divs.
 * Failed branches (from searchFull) get a distinct visual treatment.
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
    if (tree.failed) node.classList.add("proof-node-failed");

    if (tree.premises.length > 0) {
      const row = document.createElement("div");
      row.className = "proof-premises";
      for (const p of tree.premises) {
        row.appendChild(buildNode(p));
      }
      node.appendChild(row);
    }

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
