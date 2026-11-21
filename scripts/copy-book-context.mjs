import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../server/book_content.md", import.meta.url));
const output = fileURLToPath(new URL("../dist/book_content.md", import.meta.url));
await mkdir(fileURLToPath(new URL("../dist/", import.meta.url)), { recursive: true });
await copyFile(source, output);
console.log("Production AI book context copied to dist/book_content.md");
