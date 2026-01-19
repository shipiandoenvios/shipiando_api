import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { ForbiddenException } from '@nestjs/common';

export type Policy = {
  id: string;
  description?: string;
  subject?: { roles?: string[]; userId?: string };
  action: string;
  resource?: string;
  condition?: { [key: string]: unknown };
};

const FILENAME = 'abac-policies.json';

function findPoliciesFile(): string {
  const envPath = process.env.ABAC_POLICIES_PATH;
  if (envPath) return envPath;

  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, 'config', FILENAME);
    if (existsSync(candidate)) return candidate;
    dir = join(dir, '..');
  }
  return join(process.cwd(), 'config', FILENAME);
}

function ensureDirForFile(filePath: string) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function loadPolicies(): Policy[] {
  try {
    const file = findPoliciesFile();
    if (!existsSync(file)) return [];
    const raw = readFileSync(file, 'utf-8');
    const policies = JSON.parse(raw) as Policy[];
    console.info(`Loaded ABAC policies from ${file}`);
    return policies;
  } catch (e) {
    console.warn('Failed to load ABAC policies', e);
    return [];
  }
}

export function savePolicies(policies: Policy[]) {
  const file = findPoliciesFile();
  ensureDirForFile(file);
  writeFileSync(file, JSON.stringify(policies, null, 2), 'utf-8');
  console.info(`Saved ABAC policies to ${file}`);
}

export function evaluatePolicy(
  user: unknown,
  action: string,
  resource?: string,
  attrs?: Record<string, unknown>,
): boolean {
  const policies = loadPolicies();
  for (const p of policies) {
    if (p.action !== action) continue;
    if (p.resource && resource && p.resource !== resource) continue;
    if (p.subject) {
      if (p.subject.roles) {
        const rolesField = (user as Record<string, unknown>)?.['roles'];
        const roles = Array.isArray(rolesField) ? (rolesField as string[]) : [];
        const has = roles.some((r: string) => p.subject!.roles!.includes(r));
        if (!has) continue;
      }
      if (p.subject.userId) {
        const uid = (user as Record<string, unknown>)?.['id'];
        if (typeof uid !== 'string' || uid !== p.subject.userId) continue;
      }
    }
    if (p.condition) {
      let ok = true;
      for (const k of Object.keys(p.condition)) {
        const expected = p.condition[k];
        const actual = attrs ? attrs[k] : undefined;
        if (actual !== expected) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
    }
    return true;
  }
  return false;
}

export function assertHasPermission(
  user: unknown,
  action: string,
  resource?: string,
  attrs?: Record<string, unknown>,
) {
  const ok = evaluatePolicy(user, action, resource, attrs);
  if (!ok) throw new ForbiddenException('No autorizado (policy)');
}
