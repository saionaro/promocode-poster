#!/usr/bin/env node

// Simple test to validate multiple config loading functionality
import { BaseEngine } from '../src/engines/base.js';
import { resolve } from 'path';
import { getDirname } from '../src/util.js';

const __dirname = getDirname(import.meta.url);

async function testMultipleConfigs() {
  console.log('Testing multiple config loading...');
  
  // Test with multiple configs
  const multiConfigPath = resolve(__dirname, '../parsers/genshin.json') + ',' + 
                         resolve(__dirname, '../parsers/honkai.json');
  
  try {
    const multiConfigs = await BaseEngine.loadConfig(multiConfigPath);
    console.log(`✓ Successfully loaded ${multiConfigs.length} parsers from multiple configs`);
    
    // Verify we have parsers from both files
    const genshinParsers = multiConfigs.filter(p => p.source_url.includes('genshin'));
    const honkaiParsers = multiConfigs.filter(p => p.source_url.includes('honkai'));
    
    console.log(`  - Genshin parsers: ${genshinParsers.length}`);
    console.log(`  - Honkai parsers: ${honkaiParsers.length}`);
    
    if (genshinParsers.length > 0 && honkaiParsers.length > 0) {
      console.log('✓ Both config types loaded successfully');
    } else {
      throw new Error('Missing expected parser types');
    }
  } catch (error) {
    console.error('✗ Failed to load multiple configs:', error.message);
    return false;
  }
  
  // Test with single config (backward compatibility)
  const singleConfigPath = resolve(__dirname, '../parsers/genshin.json');
  
  try {
    const singleConfigs = await BaseEngine.loadConfig(singleConfigPath);
    console.log(`✓ Successfully loaded ${singleConfigs.length} parsers from single config`);
    
    if (singleConfigs.length > 0) {
      console.log('✓ Single config loading (backward compatibility) works');
    } else {
      throw new Error('No parsers loaded from single config');
    }
  } catch (error) {
    console.error('✗ Failed to load single config:', error.message);
    return false;
  }
  
  console.log('✓ All tests passed!');
  return true;
}

// Run the test
testMultipleConfigs()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });