import path from "path";

export function isPathSafe(targetPath: string, rootDir = process.cwd()): boolean {
  if (!targetPath) return false;
  const resolved = path.resolve(rootDir, targetPath);
  const normalizedRoot = path.resolve(rootDir);
  return resolved.startsWith(normalizedRoot) && !targetPath.includes("..");
}
