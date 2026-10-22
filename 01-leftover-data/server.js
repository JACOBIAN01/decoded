// Decoded #02 · Leftover data between requests (a simplified demo)
// --------------------------------------------------------------
// Real servers reuse the same "worker" for many visitors to stay fast.
// If one request crashes halfway and the worker doesn't clean up,
// the NEXT visitor can see data the last visitor left behind.
// That bug class ("stale state") is at the heart of PHP2Shell.
// This is NOT PHP and NOT the real exploit. It just shows the idea.

const http = require("http");
const FIXED = process.argv.includes("--fixed");

// One worker, reused for every request (like a PHP-FPM worker).
const worker = { currentUser: null, secretNote: null };

function handle(req, res) {
  const url = new URL(req.url, "http://localhost");
  const user = url.searchParams.get("user");
  const note = url.searchParams.get("note");

  if (FIXED) {
    // FIX: every request starts from a clean slate, no matter what.
    worker.currentUser = null;
    worker.secretNote = null;
  }

  try {
    if (note) {
      worker.currentUser = user;
      worker.secretNote = note; // a private value for THIS visitor only
    }

    // Simulate the request blowing up halfway (e.g. running out of memory).
    if (url.searchParams.get("crash") === "yes") {
      throw new Error("Out of memory!");
    }

    // Normal end of request: tidy up.
    const reply = `Hi ${user}. Your note: ${worker.secretNote ?? "(none)"}`;
    worker.currentUser = null;
    worker.secretNote = null;
    res.end(reply);
  } catch (err) {
    // BUG: the crash skipped the tidy-up above, and nobody resets the worker.
    res.statusCode = 500;
    res.end(`Server error: ${err.message}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const show = (who, text) => console.log(`  ${who.padEnd(6)} → ${text}`);

async function visit(port, query) {
  const r = await fetch(`http://localhost:${port}/?${query}`);
  return r.text();
}

const server = http.createServer(handle).listen(0, async () => {
  const { port } = server.address();
  console.log(`\nMode: ${FIXED ? "FIXED ✅" : "BUGGY ❌"}  (one shared worker)\n`);

  show("Asha", "saves a private note, but her request crashes halfway");
  show("server", await visit(port, "user=Asha&note=my-otp-4821&crash=yes"));
  await sleep(300);

  show("Ravi", "opens the same page a moment later, with no note");
  const reply = await visit(port, "user=Ravi");
  show("server", reply);

  const leaked = reply.includes("my-otp-4821");
  console.log(
    leaked
      ? "\n❌ Ravi just saw Asha's private note. Leftover data leaked.\n"
      : "\n✅ Ravi sees nothing of Asha's. The worker started clean.\n"
  );
  server.close();
});
