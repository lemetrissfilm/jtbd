import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mkdir, copyFile, writeFile, readdir, readFile, lstat, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const ILLUSTRATION_NAME = "job_chain_diagram_a891f841.png";
export const SOURCE_ILLUSTRATION = `/manus-storage/${ILLUSTRATION_NAME}`;
export const LOCAL_ILLUSTRATION = `/media/${ILLUSTRATION_NAME}`;

export function cleanStandaloneHtml(html) {
  return html
    .replace(/<script\b[^>]*\bsrc="%VITE_ANALYTICS_ENDPOINT%\/umami"[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<!-- THIS IS THE START OF A COMMENT BLOCK[\s\S]*?-->/g, "")
    .replace('<html lang="en">', '<html lang="ru">');
}

export function localizeIllustration(content) {
  return content.replaceAll(SOURCE_ILLUSTRATION, LOCAL_ILLUSTRATION);
}

export const APACHE_RULES = `Options -Indexes -MultiViews
DirectoryIndex index.html
RewriteEngine On

# Never expose development/source files.
RewriteRule ^(?:\\.(?!well-known(?:/|$))|(?:server|node_modules|deploy)(?:/|$)|.*\\.(?:map|md|ts|tsx)$) - [F,L]
# Unknown APIs must not be served the SPA HTML fallback.
RewriteRule ^api(?:/|$) - [R=404,L]
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
# Static files that are missing should return 404, never the SPA.
RewriteRule ^(?:assets|media)(?:/|$) - [R=404,L]
RewriteRule ^ index.html [L]

<IfModule mod_headers.c>
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set X-Frame-Options "SAMEORIGIN"
<Files "index.html">
Header set Cache-Control "no-cache"
</Files>
</IfModule>
`;

export function safeOutputPath(output) {
  if (!output || !path.isAbsolute(output)) throw new Error("Use an absolute release path.");
  const resolved = path.resolve(output);
  if (resolved === root || resolved.startsWith(root + path.sep) || root.startsWith(resolved + path.sep) || resolved === path.parse(resolved).root) {
    throw new Error("The release must be built outside the project directory and its ancestors.");
  }
  return resolved;
}

export async function buildPskzRelease(output, illustrationSource) {
  output = safeOutputPath(output);
  try {
    const stat = await lstat(output);
    if (!stat.isDirectory() || stat.isSymbolicLink() || (await readdir(output)).length !== 0) {
      throw new Error("Use a new or empty release directory; existing files will not be erased.");
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await mkdir(output, { recursive: true });
  safeOutputPath(await realpath(output));
  if (!illustrationSource) throw new Error("Provide the local book illustration path.");
  const png = await readFile(illustrationSource);
  if (!png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    throw new Error("The book illustration is not a valid PNG.");
  }
  await build({
    configFile: false,
    root: path.join(root, "client"),
    publicDir: false,
    envDir: root,
    envPrefix: "PSKZ_PUBLIC_",
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "pskz-standalone",
        enforce: "pre",
        transformIndexHtml: { order: "pre", handler: cleanStandaloneHtml },
        transform(code, id) {
          if (id.endsWith("chapters_full.json")) return localizeIllustration(code);
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.join(root, "client/src"),
        "@shared": path.join(root, "shared"),
        "@assets": path.join(root, "attached_assets"),
      },
    },
    build: { outDir: output, emptyOutDir: false, sourcemap: false },
    logLevel: "warn",
  });
  await mkdir(path.join(output, "media"), { recursive: true });
  await copyFile(illustrationSource, path.join(output, "media", ILLUSTRATION_NAME));
  await writeFile(path.join(output, ".htaccess"), APACHE_RULES);
  await writeFile(path.join(output, "robots.txt"), "User-agent: *\nAllow: /\nDisallow: /api/\n");
  const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  await writeFile(path.join(output, "release.json"), JSON.stringify({
    project: "Synthetic JTBD",
    host: "PS.kz",
    sourceCommit: commit,
    builtAt: new Date().toISOString(),
    illustration: LOCAL_ILLUSTRATION,
  }, null, 2) + "\n");
  for (const file of await readdir(path.join(output, "assets"))) {
    if (!file.endsWith(".js")) continue;
    const content = await readFile(path.join(output, "assets", file), "utf8");
    if (content.includes(SOURCE_ILLUSTRATION)) throw new Error("Illustration was not localized.");
    for (const key of ["BUILT_IN_FORGE_API_KEY", "VITE_FRONTEND_FORGE_API_KEY", "JWT_SECRET", "DATABASE_URL"]) {
      const secret = process.env[key];
      if (secret && secret.length > 20 && content.includes(secret)) throw new Error("Secret found in release assets.");
    }
  }
  return output;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = process.argv[2];
  const illustration = process.argv[3];
  await buildPskzRelease(output, illustration);
  console.log(`PS.kz static release ready: ${output}`);
}
