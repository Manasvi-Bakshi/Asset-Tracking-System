import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

// resolve directory (same trick as controller)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// absolute path to predict.py
const scriptPath = path.join(__dirname, "predict.py");

export function predictWithModel(input) {
  return new Promise((resolve, reject) => {
    const py = spawn("python", [scriptPath]);

    let out = "";
    let err = "";

    py.stdout.on("data", (d) => (out += d.toString()));
    py.stderr.on("data", (e) => (err += e.toString()));

    py.on("close", (code) => {
      if (code !== 0) return reject(err || "Python exited non-zero");
      resolve(out.trim());
    });

    py.stdin.write(JSON.stringify(input));
    py.stdin.end();
  });
}