#!/usr/bin/env node

/**
 * Simple Video Import Script
 * 
 * This script imports videos from the HTML file with minimal setup.
 * Run with: node scripts/import-videos-simple.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Make sure .env.local contains:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper functions
function extractYouTubeId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function parseCzechDate(dateStr) {
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  return null;
}

function getSeasonFromDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  if (month >= 9) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
}

// Main parsing function
function parseVideos(htmlContent) {
  const videos = [];
  
  // Remove HTML tags and clean up the content
  const cleanContent = htmlContent
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
    .replace(/&ldquo;/g, '"') // Replace HTML entities
    .replace(/&rdquo;/g, '"')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—');
  
  const lines = cleanContent.split('\n');
  
  let currentMatch = null;
  let currentMatchUrls = [];
  
  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    
    // Skip empty lines and headers
    if (!trimmedLine || 
        trimmedLine.includes('1.LIGA') || 
        trimmedLine.includes('PODZIM') || 
        trimmedLine.includes('JARO') ||
        trimmedLine.includes('PRVNÍ LIGA') ||
        trimmedLine.includes('DRUHÁ LIGA') ||
        trimmedLine.includes('ZIMNÍ HALOVÝ POHÁR')) {
      continue;
    }
    
    // Look for match lines with "– Výsledek"
    if (trimmedLine.includes('– Výsledek')) {
      // If we have a previous match, process it
      if (currentMatch && currentMatchUrls.length > 0) {
        processMatch(currentMatch, currentMatchUrls, videos);
      }
      
      // Extract match info
      const matchPattern = /([^–]+?)\s+(\d{1,2}\.\d{1,2}\.\d{4})\s*–\s*Výsledek\s*([^\(]+)(?:\(([^\)]+)\))?/;
      const match = trimmedLine.match(matchPattern);
      
      if (match) {
        currentMatch = {
          teams: match[1].trim(),
          date: match[2],
          result: match[3].trim(),
          halftime: match[4] ? match[4].trim() : null
        };
        currentMatchUrls = [];
      }
    }
    // Look for YouTube URLs
    else if (trimmedLine.includes('https://youtu.be/') && currentMatch) {
      const youtubeUrls = trimmedLine.match(/https:\/\/youtu\.be\/[A-Za-z0-9_-]+/g) || [];
      currentMatchUrls.push(...youtubeUrls);
    }
  }
  
  // Process the last match
  if (currentMatch && currentMatchUrls.length > 0) {
    processMatch(currentMatch, currentMatchUrls, videos);
  }
  
  return videos;
}

// Helper function to process a match and its URLs
function processMatch(match, urls, videos) {
  const recordingDate = parseCzechDate(match.date);
  const season = recordingDate ? getSeasonFromDate(recordingDate) : null;
  
  urls.forEach((url, index) => {
    const youtubeId = extractYouTubeId(url);
    if (!youtubeId) return;
    
    let title;
    if (index === 0) {
      title = `${match.teams} - I. poločas`;
    } else if (index === 1) {
      title = `${match.teams} - II. poločas`;
    } else {
      title = `${match.teams} - ${index + 1}. část`;
    }
    
    videos.push({
      title,
      description: `Zápas: ${match.teams}\nDatum: ${match.date}\nVýsledek: ${match.result}${match.halftime ? ` (${match.halftime})` : ''}`,
      youtube_url: url,
      youtube_id: youtubeId,
      thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
      recording_date: recordingDate ? recordingDate.toISOString().split('T')[0] : null,
      season,
      teams: match.teams,
      result: match.result
    });
  });
}

// Import function
async function importVideos(videos) {
  console.log(`\n📊 Importing ${videos.length} videos...`);
  
  // Get database references
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('is_active', true);
  
  const { data: seasons } = await supabase
    .from('seasons')
    .select('id, name');
  
  const { data: clubs } = await supabase
    .from('clubs')
    .select('id, name')
    .eq('is_active', true);
  
  // Find Svinov club
  const svinovClub = clubs?.find(club => 
    club.name.toLowerCase().includes('svinov')
  );
  
  if (!svinovClub) {
    console.error('❌ Svinov club not found in database');
    return;
  }
  
  // Find men's category (default)
  const mensCategory = categories?.find(cat => 
    cat.name.toLowerCase().includes('muži') || 
    cat.name.toLowerCase().includes('men')
  );
  
  if (!mensCategory) {
    console.error('❌ Men\'s category not found in database');
    return;
  }
  
  console.log(`🏟️ Using club: ${svinovClub.name}`);
  console.log(`🏆 Using category: ${mensCategory.name}`);
  
  let success = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const video of videos) {
    try {
      // Check if video already exists
      const { data: existing } = await supabase
        .from('videos')
        .select('id')
        .eq('youtube_id', video.youtube_id)
        .single();
      
      if (existing) {
        console.log(`⏭️ Skipped (exists): ${video.title}`);
        skipped++;
        continue;
      }
      
      // Find season
      const season = seasons?.find(s => s.name === video.season);
      
      // Insert video
      const { error } = await supabase
        .from('videos')
        .insert({
          title: video.title,
          description: video.description,
          youtube_url: video.youtube_url,
          youtube_id: video.youtube_id,
          category_id: mensCategory.id,
          club_id: svinovClub.id,
          recording_date: video.recording_date,
          season_id: season?.id,
          thumbnail_url: video.thumbnail_url,
          is_active: true
        });
      
      if (error) {
        console.error(`❌ Error: ${video.title} - ${error.message}`);
        errors++;
      } else {
        console.log(`✅ Imported: ${video.title}`);
        success++;
      }
      
    } catch (error) {
      console.error(`❌ Unexpected error: ${video.title} - ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n📊 Import Summary:`);
  console.log(`✅ Success: ${success}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting video import...');
    
    const htmlFile = path.join(__dirname, '..', 'docs', 'buildingAppDocs', 'video-mens-html.md');
    
    if (!fs.existsSync(htmlFile)) {
      console.error(`❌ File not found: ${htmlFile}`);
      process.exit(1);
    }
    
    const htmlContent = fs.readFileSync(htmlFile, 'utf8');
    const videos = parseVideos(htmlContent);
    
    console.log(`📄 Parsed ${videos.length} videos from HTML`);
    
    if (videos.length === 0) {
      console.log('⚠️ No videos found');
      return;
    }
    
    // Show sample
    console.log('\n📋 Sample videos:');
    videos.slice(0, 3).forEach((video, i) => {
      console.log(`  ${i + 1}. ${video.title}`);
    });
    
    await importVideos(videos);
    console.log('\n🎉 Import completed!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
