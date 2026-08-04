#!/usr/bin/env node
/**
 * Build script for announcements.
 * Reads markdown files from the announcements/ directory and generates announcements.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANNOUNCEMENTS_DIR = path.join(process.cwd(), 'announcements');
const OUTPUT_FILE = path.join(process.cwd(), 'announcements.json');

const VALID_PRIORITIES = ['low', 'normal', 'high', 'critical'];
const VALID_TYPES = ['release', 'tip', 'bugfix', 'warning', 'community', 'info'];
const VALID_ACTION_TYPES = ['url', 'internal'];

/**
 * Parse YAML front matter from markdown content.
 */
function parseFrontMatter(content) {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontMatterRegex);
  
  if (!match) {
    throw new Error('No valid YAML front matter found. File must start with ---');
  }
  
  const frontMatterText = match[1];
  const bodyMarkdown = match[2];
  
  const frontMatter = {};
  const lines = frontMatterText.split('\n');
  
  let currentKey = null;
  let currentValue = [];
  let inList = false;
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    // Check for list items
    if (line.trim().startsWith('- ')) {
      inList = true;
      const item = line.trim().substring(2);
      
      if (currentKey === 'actions') {
        const actionParts = item.split(':').map(s => s.trim());
        if (actionParts.length >= 2) {
          const actionKey = actionParts[0];
          const actionValue = actionParts.slice(1).join(':').trim();
          
          if (!frontMatter[currentKey]) {
            frontMatter[currentKey] = [];
          }
          
          const lastAction = frontMatter[currentKey][frontMatter[currentKey].length - 1];
          if (lastAction) {
            lastAction[actionKey] = actionValue;
          }
        }
      }
      continue;
    }
    
    // Check for nested list items (action properties)
    if (inList && line.startsWith('  ')) {
      const item = line.trim();
      const actionParts = item.split(':').map(s => s.trim());
      if (actionParts.length >= 2) {
        const actionKey = actionParts[0];
        const actionValue = actionParts.slice(1).join(':').trim();
        
        if (currentKey === 'actions' && frontMatter[currentKey]) {
          const lastAction = frontMatter[currentKey][frontMatter[currentKey].length - 1];
          if (lastAction) {
            lastAction[actionKey] = actionValue;
          }
        }
      }
      continue;
    }
    
    // Reset list state when we hit a new key
    if (line.includes(':')) {
      inList = false;
      currentKey = null;
      currentValue = [];
    }
    
    // Parse key-value pairs
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      
      // Handle arrays
      if (value === '' || value === '[]') {
        frontMatter[key] = [];
        currentKey = key;
        continue;
      }
      
      // Handle quoted strings
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        frontMatter[key] = value.slice(1, -1);
      } else {
        frontMatter[key] = value;
      }
      
      currentKey = key;
    }
  }
  
  return { frontMatter, bodyMarkdown };
}

/**
 * Validate announcement data.
 */
function validateAnnouncement(data) {
  const errors = [];
  
  // Required fields
  if (!data.id) errors.push('Missing required field: id');
  if (!data.title) errors.push('Missing required field: title');
  if (!data.summary) errors.push('Missing required field: summary');
  if (!data.bodyMarkdown) errors.push('Missing required field: bodyMarkdown (markdown content)');
  
  // Validate priority
  if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
    errors.push(`Invalid priority: ${data.priority}. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
  
  // Validate type
  if (data.type && !VALID_TYPES.includes(data.type)) {
    errors.push(`Invalid type: ${data.type}. Must be one of: ${VALID_TYPES.join(', ')}`);
  }
  
  // Validate actions
  if (data.actions && Array.isArray(data.actions)) {
    data.actions.forEach((action, index) => {
      if (!action.label) errors.push(`Action ${index + 1}: Missing label`);
      if (!action.type) errors.push(`Action ${index + 1}: Missing type`);
      if (action.type && !VALID_ACTION_TYPES.includes(action.type)) {
        errors.push(`Action ${index + 1}: Invalid type "${action.type}". Must be one of: ${VALID_ACTION_TYPES.join(', ')}`);
      }
      if (!action.target) errors.push(`Action ${index + 1}: Missing target`);
    });
  }
  
  return errors;
}

/**
 * Build announcements.json from markdown files.
 */
function buildAnnouncements() {
  console.log('📢 Building announcements...');
  
  // Check if announcements directory exists
  if (!fs.existsSync(ANNOUNCEMENTS_DIR)) {
    console.error(`❌ Announcements directory not found: ${ANNOUNCEMENTS_DIR}`);
    console.error('   Create an "announcements" directory with a "current.md" file.');
    process.exit(1);
  }
  
  // Find current.md or versioned markdown files
  const files = fs.readdirSync(ANNOUNCEMENTS_DIR);
  const markdownFiles = files.filter(f => f.endsWith('.md'));
  
  if (markdownFiles.length === 0) {
    console.error('❌ No markdown files found in announcements directory.');
    process.exit(1);
  }
  
  // Use current.md if it exists, otherwise use the first markdown file
  const currentFile = markdownFiles.includes('current.md') ? 'current.md' : markdownFiles[0];
  const filePath = path.join(ANNOUNCEMENTS_DIR, currentFile);
  
  console.log(`📖 Reading: ${currentFile}`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Parse front matter
  let frontMatter, bodyMarkdown;
  try {
    ({ frontMatter, bodyMarkdown } = parseFrontMatter(content));
  } catch (error) {
    console.error(`❌ Failed to parse front matter: ${error.message}`);
    process.exit(1);
  }
  
  // Add bodyMarkdown to the data
  const announcementData = {
    ...frontMatter,
    bodyMarkdown,
  };
  
  // Validate
  const errors = validateAnnouncement(announcementData);
  if (errors.length > 0) {
    console.error('❌ Validation errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    process.exit(1);
  }
  
  // Build the output structure
  const output = {
    v: 1,
    current: {
      id: announcementData.id,
      version: announcementData.version,
      title: announcementData.title,
      summary: announcementData.summary,
      bodyMarkdown: announcementData.bodyMarkdown,
      publishedAt: announcementData.publishedAt,
      primaryImageUrl: announcementData.primaryImageUrl,
      type: announcementData.type,
      priority: announcementData.priority,
      actions: announcementData.actions,
    },
  };
  
  // Remove undefined fields
  if (!output.current.version) delete output.current.version;
  if (!output.current.publishedAt) delete output.current.publishedAt;
  if (!output.current.primaryImageUrl) delete output.current.primaryImageUrl;
  if (!output.current.type) delete output.current.type;
  if (!output.current.priority) delete output.current.priority;
  if (!output.current.actions || output.current.actions.length === 0) delete output.current.actions;
  
  // Write output file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  
  console.log('✅ announcements.json generated successfully!');
  console.log(`   Output: ${OUTPUT_FILE}`);
  console.log(`   ID: ${output.current.id}`);
  console.log(`   Title: ${output.current.title}`);
  console.log(`   Priority: ${output.current.priority || 'normal (default)'}`);
}

// Run the build
buildAnnouncements();
