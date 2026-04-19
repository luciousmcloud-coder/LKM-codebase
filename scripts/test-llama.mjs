import { getLlama } from "node-llama-cpp";

async function main() {
  const llama = await getLlama();
  console.log(JSON.stringify({ ok: true, defaultContextSize: typeof llama === "object" }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
