import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const testDirectory = join(process.cwd(), 'tests', 'workspace-map');
const testFiles = (await readdir(testDirectory))
  .filter((name) => name.endsWith('.test.mjs'))
  .sort()
  .map((name) => join(testDirectory, name));

if (testFiles.length === 0) {
  console.error('구조 지도 검사 파일을 찾지 못했어요.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...testFiles], {
  cwd: process.cwd(),
  stdio: 'inherit',
});

if (result.error) {
  console.error('구조 지도 검사를 시작하지 못했어요.');
  process.exit(1);
}

process.exit(result.status ?? 1);
