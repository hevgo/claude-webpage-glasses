import { runAll } from "./harness.js";
import "./overlay.test.js";
import "./frames.test.js";

const results = await runAll();
const passed = results.filter((r) => r.status === "pass").length;
const failed = results.length - passed;

document.body.dataset.status = failed === 0 ? "pass" : "fail";

const summary = document.getElementById("summary");
summary.textContent = `${passed}/${results.length} passed${failed ? `, ${failed} failed` : ""}`;
summary.className = failed === 0 ? "pass" : "fail";

const list = document.getElementById("results");
for (const r of results) {
  const li = document.createElement("li");
  li.className = r.status;
  li.textContent = `${r.status === "pass" ? "✓" : "✗"} ${r.name}`;
  if (r.status === "fail") {
    const msg = document.createElement("div");
    msg.className = "msg";
    msg.textContent = r.message;
    li.appendChild(msg);
  }
  list.appendChild(li);
}

console.log(`${passed}/${results.length} tests passed`);
if (failed) console.error(`${failed} test(s) failed`);
