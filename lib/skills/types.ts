import type { McpServer } from "@modelcontextprotocol/server";

/**
 * Reusable skill contract.
 * `name` must match the SKILL.md directory name and frontmatter `name`.
 * Adding a skill = new skills/<domain>/<name>/ folder + register module + one line in registry.ts.
 */
export type Skill = {
  name: string;
  description: string;
  register: (server: McpServer) => void;
};
