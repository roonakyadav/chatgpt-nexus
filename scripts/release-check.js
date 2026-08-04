#!/usr/bin/env node
/**
 * Release check script.
 * Validates the repository state before releasing.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = process.cwd();
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'manifest.json');
const CHANGELOG_PATH = path.join(PROJECT_ROOT, 'CHANGELOG.md');
const ANNOUNCEMENTS_DIR = path.join(PROJECT_ROOT, 'announcements');
const ANNOUNCEMENT_JSON_PATH = path.join(PROJECT_ROOT, 'announcements.json');

let hasErrors = false;

function logError(message) {
  console.error(`❌ ${message}`);
  hasErrors = true;
}

function logWarning(message) {
  console.warn(`⚠️  ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

/**
 * Check if git working tree is clean.
 */
function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim()) {
      logWarning('Git working tree is not clean. Uncommitted changes detected.');
      logInfo('Stash or commit changes before releasing.');
      return false;
    }
    logSuccess('Git working tree is clean.');
    return true;
  } catch (error) {
    logError('Failed to check git status.');
    return false;
  }
}

/**
 * Check if required files exist.
 */
function checkRequiredFiles() {
  const requiredFiles = [
    { path: MANIFEST_PATH, name: 'manifest.json' },
    { path: CHANGELOG_PATH, name: 'CHANGELOG.md' },
    { path: ANNOUNCEMENTS_DIR, name: 'announcements/' },
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file.path)) {
      logError(`Required file/directory not found: ${file.name}`);
    } else {
      logSuccess(`Found: ${file.name}`);
    }
  }
}

/**
 * Read and parse manifest.json.
 */
function readManifest() {
  try {
    const content = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(content);
    logSuccess(`Manifest version: ${manifest.version}`);
    return manifest.version;
  } catch (error) {
    logError('Failed to read or parse manifest.json');
    return null;
  }
}

/**
 * Check if announcement markdown exists.
 */
function checkAnnouncementMarkdown() {
  const files = fs.readdirSync(ANNOUNCEMENTS_DIR);
  const markdownFiles = files.filter(f => f.endsWith('.md'));

  if (markdownFiles.length === 0) {
    logError('No markdown announcement file found in announcements/');
    return null;
  }

  const currentFile = markdownFiles.includes('current.md') ? 'current.md' : markdownFiles[0];
  logSuccess(`Found announcement markdown: ${currentFile}`);
  return path.join(ANNOUNCEMENTS_DIR, currentFile);
}

/**
 * Parse announcement markdown to extract version.
 */
function parseAnnouncementVersion(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const versionMatch = content.match(/version:\s*([^\s\n]+)/);
    if (versionMatch) {
      const version = versionMatch[1];
      logSuccess(`Announcement version: ${version}`);
      return version;
    }
    logError('No version found in announcement front matter');
    return null;
  } catch (error) {
    logError('Failed to read announcement markdown');
    return null;
  }
}

/**
 * Check if CHANGELOG contains the version.
 */
function checkChangelog(version) {
  try {
    const content = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
    const versionPattern = new RegExp(`\\[?${version.replace(/\./g, '\\.')}\\]?`);
    if (versionPattern.test(content)) {
      logSuccess(`CHANGELOG.md contains version ${version}`);
      return true;
    }
    logWarning(`CHANGELOG.md does not contain version ${version}`);
    return false;
  } catch (error) {
    logError('Failed to read CHANGELOG.md');
    return false;
  }
}

/**
 * Check if announcement JSON exists and is valid.
 */
function checkAnnouncementJson() {
  try {
    if (!fs.existsSync(ANNOUNCEMENT_JSON_PATH)) {
      logWarning('announcements.json does not exist. Run npm run build:announcement first.');
      return false;
    }
    const content = fs.readFileSync(ANNOUNCEMENT_JSON_PATH, 'utf-8');
    const json = JSON.parse(content);
    if (json.v !== 1) {
      logError('announcements.json has invalid version');
      return false;
    }
    if (!json.current || !json.current.id) {
      logError('announcements.json is missing current announcement or id');
      return false;
    }
    logSuccess('announcements.json is valid');
    logSuccess(`Announcement ID: ${json.current.id}`);
    return true;
  } catch (error) {
    logError('Failed to validate announcements.json');
    return false;
  }
}

/**
 * Run all checks.
 */
function runChecks() {
  console.log('🔍 Running release checks...\n');

  // Check git status
  checkGitStatus();

  // Check required files
  checkRequiredFiles();

  // Read manifest version
  const manifestVersion = readManifest();
  if (!manifestVersion) {
    console.log('\n❌ Release checks failed. Fix errors above.');
    process.exit(1);
  }

  // Check announcement markdown
  const announcementPath = checkAnnouncementMarkdown();
  if (!announcementPath) {
    console.log('\n❌ Release checks failed. Fix errors above.');
    process.exit(1);
  }

  // Parse announcement version
  const announcementVersion = parseAnnouncementVersion(announcementPath);
  if (!announcementVersion) {
    console.log('\n❌ Release checks failed. Fix errors above.');
    process.exit(1);
  }

  // Validate version match
  if (manifestVersion !== announcementVersion) {
    logError(`Version mismatch: manifest.json (${manifestVersion}) != announcement (${announcementVersion})`);
    console.log('\n❌ Release checks failed. Fix errors above.');
    process.exit(1);
  }
  logSuccess('Version match: manifest == announcement');

  // Check CHANGELOG
  checkChangelog(manifestVersion);

  // Check announcements.json
  checkAnnouncementJson();

  // Summary
  console.log('\n' + '='.repeat(50));
  if (hasErrors) {
    console.log('❌ Release checks failed. Fix errors above.');
    process.exit(1);
  } else {
    console.log('✅ All release checks passed!');
    console.log(`\nReady to release version ${manifestVersion}`);
    console.log('Run: npm run release');
  }
}

runChecks();
