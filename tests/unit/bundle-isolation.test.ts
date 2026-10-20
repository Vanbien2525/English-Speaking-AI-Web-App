import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Core Web Vitals & 0KB Three.js Bundle Isolation Guardrail (FEAT-IPA-MAP-AND-LESSONS & FEAT-GAMIFICATION-AND-PROGRESS)", () => {
  const PROHIBITED_IMPORT_PATTERNS = [
    /from\s+['"]three['"]/,
    /from\s+['"]@react-three\//,
    /from\s+['"]three-stdlib['"]/,
    /from\s+['"]@\/modules\/practice-studio\/three/,
    /import\s+['"]three['"]/,
    /import\s+['"]@react-three\//,
  ];

  function collectSourceFiles(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...collectSourceFiles(fullPath));
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  it("khẳng định toàn bộ module curriculum, progress dashboard và route /learn, /progress tuyệt đối không chứa import Three.js hoặc R3F", () => {
    const targetDirs = [
      path.resolve(process.cwd(), "src/app/learn"),
      path.resolve(process.cwd(), "src/modules/curriculum"),
      path.resolve(process.cwd(), "src/core/dto/curriculum.dto.ts"),
      path.resolve(process.cwd(), "src/core/repositories/curriculum-repository.ts"),
      path.resolve(process.cwd(), "src/core/services/curriculum-service.ts"),
      path.resolve(process.cwd(), "src/app/progress"),
      path.resolve(process.cwd(), "src/modules/progress"),
      path.resolve(process.cwd(), "src/core/dto/progress.dto.ts"),
      path.resolve(process.cwd(), "src/core/repositories/progress-repository.ts"),
      path.resolve(process.cwd(), "src/core/services/progress-service.ts"),
      path.resolve(process.cwd(), "src/core/services/leaderboard-service.ts"),
    ];

    const sourceFiles: string[] = [];
    for (const target of targetDirs) {
      if (fs.existsSync(target)) {
        if (fs.statSync(target).isDirectory()) {
          sourceFiles.push(...collectSourceFiles(target));
        } else {
          sourceFiles.push(target);
        }
      }
    }

    // Expect at least curriculum & progress files
    expect(sourceFiles.length).toBeGreaterThanOrEqual(6);

    const violations: Array<{ file: string; match: string }> = [];

    for (const filePath of sourceFiles) {
      const content = fs.readFileSync(filePath, "utf-8");
      for (const pattern of PROHIBITED_IMPORT_PATTERNS) {
        if (pattern.test(content)) {
          violations.push({
            file: path.relative(process.cwd(), filePath),
            match: content.match(pattern)?.[0] ?? "unknown",
          });
        }
      }
    }

    expect(
      violations,
      `Phát hiện vi phạm Bundle Isolation! Three.js hoặc R3F bị rò rỉ vào module SSR siêu tốc:\n${violations
        .map((v) => `  - ${v.file}: ${v.match}`)
        .join("\n")}`,
    ).toHaveLength(0);
  });
});
