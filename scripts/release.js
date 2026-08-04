#!/usr/bin/env node
/**
 * Release script.
 * Performs the complete release pipeline.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = process.cwd();
const MANIFEST_PATH = path.join(PROJECT_ROOT, 'manifest.json');
const ANNOUNCEMENT_JSON_PATH = path.join(PROJECT_ROOT, 'announcements.json');

// Parse command line arguments
const args = process.argv.slice(2);
const shouldPush = args.includes('--push');

function logError(message) {
  console.error(`❌ ${message}`);
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

function logStep(step, message) {
  console.log(`\n${step} ${message}`);
}

/**
 * Read manifest version.
 */
function getManifestVersion() {
  try {
    const content = fs.readFileSync(MANIFEST_PATH, 'utf-8');
    const manifest = JSON.parse(content);
    return manifest.version;
  } catch (error) {
    logError('Failed to read manifest.json');
    process.exit(1);
  }
}

/**
 * Read announcement ID.
 */
function getAnnouncementId() {
  try {
    const content = fs.readFileSync(ANNOUNCEMENT_JSON_PATH, 'utf-8');
    const json = JSON.parse(content);
    return json.current?.id;
  } catch (error) {
    logError('Failed to read announcements.json');
    return null;
  }
}

/**
 * Run release checks.
 */
function runReleaseChecks() {
  try {
    logStep('1/6', 'Running release checks...');
    execSync('node scripts/release-check.js', { stdio: 'inherit' });
  } catch (error) {
    logError('Release checks failed. Aborting.');
    process.exit(1);
  }
}

/**
 * Build announcement.
 */
function buildAnnouncement() {
  try {
    logStep('2/6', 'Building announcement...');
    execSync('npm run build:announcement', { stdio: 'inherit' });
    logSuccess('Announcement built successfully.');
  } catch (error) {
    logError('Failed to build announcement.');
    process.exit(1);
  }
}

/**
 * Validate generated announcement JSON.
 */
function validateAnnouncementJson() {
  try {
    logStep('3/6', 'Validating announcement JSON...');
    const content = fs.readFileSync(ANNOUNCEMENT_JSON_PATH, 'utf-8');
    const json = JSON.parse(content);
    
    if (json.v !== 1) {
      logError('Invalid announcements.json version');
      process.exit(1);
    }
    
    if (!json.current || !json.current.id) {
      logError('Missing current announcement or id');
      process.exit(1);
    }
    
    if (!json.current.bodyMarkdown) {
      logError('Missing bodyMarkdown in announcement');
      process.exit(1);
    }
    
    logSuccess('Announcement JSON is valid.');
  } catch (error) {
    logError('Failed to validate announcement JSON');
    process.exit(1);
  }
}

/**
 * Create release commit.
 */
function createReleaseCommit(version) {
  try {
    logStep('4/6', 'Creating release commit...');
    
    // Stage all changes
    execSync('git add manifest.json CHANGELOG.md announcements.json announcements/', { stdio: 'inherit' });
    
    // Create commit
    const commitMessage = `Release v${version}`;
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    logSuccess(`Release commit created: ${commitMessage}`);
  } catch (error) {
    logError('Failed to create release commit.');
    process.exit(1);
  }
}

/**
 * Create git tag.
 */
function createGitTag(version) {
  try {
    logStep('5/6', 'Creating git tag...');
    
    const tagName = `v${version}`;
    execSync(`git tag -a ${tagName} -m "Release ${version}"`, { stdio: 'inherit' });
    
    logSuccess(`Git tag created: ${tagName}`);
  } catch (error) {
    logError('Failed to create git tag.');
    process.exit(1);
  }
}

/**
 * Push to remote.
 */
function pushToRemote(version) {
  try {
    logStep('6/6', 'Pushing to remote...');
    
    const tagName = `v${version}`;
    execSync('git push origin main', { stdio: 'inherit' });
    execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
    
    logSuccess(`Pushed to remote: main + ${tagName}`);
  } catch (error) {
    logError('Failed to push to remote.');
    process.exit(1);
  }
}

/**
 * Display summary.
 */
function displaySummary(version, announcementId) {
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Release Summary');
  console.log('='.repeat(50));
  console.log(`✔ Version: ${version}`);
  console.log(`✔ Announcement: ${announcementId}`);
  console.log(`✔ Changelog: Updated`);
  console.log(`✔ Tag: v${version}`);
  
  if (shouldPush) {
    console.log(`✔ Pushed: Yes`);
  } else {
    console.log(`✔ Pushed: No (use --push to push)`);
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (!shouldPush) {
    console.log('\n📝 To complete the release:');
    console.log('   git push origin main');
    console.log(`   git push origin v${version}`);
  }
  
  console.log('\n✅ Release complete!');
}

/**
 * Main release pipeline.
 */
function runRelease() {
  console.log('🚀 Starting release pipeline...\n');

  // Step 1: Run checks
  runReleaseChecks();

  // Step 2: Build announcement
  buildAnnouncement();

  // Step 3: Validate announcement JSON
  validateAnnouncementJson();

  // Get version and announcement ID
  const version = getManifestVersion();
  const announcementId = getAnnouncementId();

  // Step 4: Create release commit
  createReleaseCommit(version);

  // Step 5: Create git tag
  createGitTag(version);

  // Step 6: Push (if --push flag provided)
  if (shouldPush) {
    pushToRemote(version);
  }

  // Display summary
  displaySummary(version, announcementId);
}

runRelease();
