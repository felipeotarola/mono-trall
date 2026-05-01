import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const appDir = dirname(fileURLToPath(import.meta.url))
const repoEnvPath = resolve(appDir, "../../.env")

if (existsSync(repoEnvPath)) {
  process.loadEnvFile(repoEnvPath)
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
}

export default nextConfig
