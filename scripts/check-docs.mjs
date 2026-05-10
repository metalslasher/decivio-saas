import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const docsDir = join(rootDir, "docs");

const stalePatterns = [
  {
    pattern: /\u00d0|\u00d1|\u00c3/u,
    label: "possible mojibake"
  },
  {
    pattern: /src\/lib\/ai\/career-switch-analysis\.ts/u,
    label: "old AI analysis path"
  },
  {
    pattern: /weekly_hours|target_deadline|market-profile/u,
    label: "removed onboarding field or old payload name"
  },
  {
    pattern: /36\s*(months|\u043c\u0456\u0441)/iu,
    label: "old fixed forecast horizon"
  }
];

function listMarkdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      return listMarkdownFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
  });
}

if (!existsSync(docsDir) || !statSync(docsDir).isDirectory()) {
  console.error("docs directory is missing.");
  process.exit(1);
}

const findings = [];

for (const filePath of listMarkdownFiles(docsDir)) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    stalePatterns.forEach(({ pattern, label }) => {
      if (pattern.test(line)) {
        findings.push(
          `${relative(rootDir, filePath)}:${index + 1} ${label}: ${line.trim()}`
        );
      }
    });
  });
}

if (findings.length > 0) {
  console.error("Documentation check failed:");
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log("Documentation check passed.");
