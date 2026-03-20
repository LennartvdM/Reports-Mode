/**
 * Print and export module.
 */

function printReport() {
  window.print();
}

async function batchPrint(orgs, renderFn) {
  for (let i = 0; i < orgs.length; i++) {
    renderFn(orgs[i]);
    // Small delay to let the DOM render
    await new Promise(r => setTimeout(r, 200));
    window.print();
    await new Promise(r => setTimeout(r, 500));
  }
}
