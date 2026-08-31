#!/usr/bin/env node
const action = process.argv[2] ?? "help";
if (action === "stop" || action === "restart") {
  console.log(`[preview] ${action} is a sandbox helper — use npm run dev locally.`);
  process.exit(0);
}
console.log("usage: node scripts/preview.mjs restart|stop");
