#!/usr/bin/env node

/**
 * Video Import Script from HTML
 * 
 * This script parses the video-mens-html.md file and imports video data into the database.
 * It extracts match information, YouTube URLs, and organizes them by seasons and categories.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to extract YouTube ID from URL
function extractYouTubeId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Helper function to parse date from Czech format
function parseCzechDate(dateStr) {
  // Handle formats like "18.5.2025", "4.5.2025", etc.
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JavaScript months are 0-based
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  return null;
}

// Helper function to extract match information from text
function parseMatchInfo(text) {
  // Pattern to match: "TJ Sokol Svinov X Podlázky 18.5.2025 – Výsledek 17:17 (5:7)"
  const matchPattern = /([^–]+?)\s+(\d{1,2}\.\d{1,2}\.\d{4})\s*–\s*Výsledek\s*([^\(]+)(?:\(([^\)]+)\))?/;
  const match = text.match(matchPattern);
  
  if (match) {
    const teams = match[1].trim();
    const date = match[2];
    const result = match[3].trim();
    const halftime = match[4] ? match[4].trim() : null;
    
    return {
      teams,
      date,
      result,
      halftime,
      fullText: text
    };
  }
  
  return null;
}

// Helper function to determine season from date
function getSeasonFromDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-based
  
  // Czech handball seasons typically run from September to May
  if (month >= 9) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
}

// Helper function to determine category from match info
function getCategoryFromMatch(teams, season) {
  // This is a simplified mapping - you might need to adjust based on your actual categories
  const teamName = teams.toLowerCase();
  
  if (teamName.includes('junior') || teamName.includes('juniory')) {
    return 'Juniory';
  } else if (teamName.includes('ženy') || teamName.includes('ženský')) {
    return 'Ženy';
  } else if (teamName.includes('muži') || teamName.includes('mužský')) {
    return 'Muži';
  } else {
    // Default to men's category for most matches
    return 'Muži';
  }
}

// Main parsing function
function parseVideoData(htmlContent) {
  const videos = [];
  const lines = htmlContent.split('\n');
  
  let currentSeason = null;
  let currentCategory = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Detect season headers
    if (line.includes('1.LIGA') && line.includes('-------')) {
      const seasonMatch = line.match(/(\d{4}\/\d{4})/);
      if (seasonMatch) {
        currentSeason = seasonMatch[1];
        console.log(`📅 Found season: ${currentSeason}`);
      }
      continue;
    }
    
    // Detect category headers (PODZIM, JARO, etc.)
    if (line.includes('PODZIM') || line.includes('JARO')) {
      currentCategory = line.replace(/[–-]/g, '').trim();
      console.log(`🏆 Found category: ${currentCategory}`);
      continue;
    }
    
    // Parse match lines
    if (line.includes('– Výsledek') && line.includes('https://youtu.be/')) {
      const matchInfo = parseMatchInfo(line);
      if (!matchInfo) continue;
      
      // Extract YouTube URLs from the line
      const youtubeUrls = line.match(/https:\/\/youtu\.be\/[A-Za-z0-9_-]+/g) || [];
      
      if (youtubeUrls.length > 0) {
        const recordingDate = parseCzechDate(matchInfo.date);
        const season = recordingDate ? getSeasonFromDate(recordingDate) : currentSeason;
        const category = getCategoryFromMatch(matchInfo.teams, season);
        
        // Create video entries for each YouTube URL
        youtubeUrls.forEach((url, index) => {
          const youtubeId = extractYouTubeId(url);
          if (!youtubeId) return;
          
          // Determine video title based on URL position
          let videoTitle;
          if (index === 0) {
            videoTitle = `${matchInfo.teams} - I. poločas`;
          } else if (index === 1) {
            videoTitle = `${matchInfo.teams} - II. poločas`;
          } else {
            videoTitle = `${matchInfo.teams} - ${index + 1}. část`;
          }
          
          videos.push({
            title: videoTitle,
            description: `Zápas: ${matchInfo.teams}\nDatum: ${matchInfo.date}\nVýsledek: ${matchInfo.result}${matchInfo.halftime ? ` (${matchInfo.halftime})` : ''}`,
            youtube_url: url,
            youtube_id: youtubeId,
            thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
            recording_date: recordingDate ? recordingDate.toISOString().split('T')[0] : null,
            season: season,
            category: category,
            match_info: matchInfo
          });
        });
      }
    }
  }
  
  return videos;
}

// Database import function
async function importVideosToDatabase(videos) {
  console.log(`\n📊 Starting import of ${videos.length} videos...`);
  
  // Get existing categories and seasons
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, code');
    
  if (categoriesError) {
    console.error('❌ Error fetching categories:', categoriesError);
    return;
  }
  
  const { data: seasons, error: seasonsError } = await supabase
    .from('seasons')
    .select('id, name');
    
  if (seasonsError) {
    console.error('❌ Error fetching seasons:', seasonsError);
    return;
  }
  
  const { data: clubs, error: clubsError } = await supabase
    .from('clubs')
    .select('id, name, short_name')
    .eq('is_active', true);
    
  if (clubsError) {
    console.error('❌ Error fetching clubs:', clubsError);
    return;
  }
  
  console.log(`📋 Found ${categories.length} categories, ${seasons.length} seasons, ${clubs.length} clubs`);
  
  // Create category and season mappings
  const categoryMap = new Map();
  categories.forEach(cat => {
    categoryMap.set(cat.name.toLowerCase(), cat.id);
    categoryMap.set(cat.code.toLowerCase(), cat.id);
  });
  
  const seasonMap = new Map();
  seasons.forEach(season => {
    seasonMap.set(season.name, season.id);
  });
  
  // Find Svinov club
  const svinovClub = clubs.find(club => 
    club.name.toLowerCase().includes('svinov') || 
    club.short_name.toLowerCase().includes('svinov')
  );
  
  if (!svinovClub) {
    console.error('❌ Could not find Svinov club in database');
    return;
  }
  
  console.log(`🏟️ Using club: ${svinovClub.name} (${svinovClub.id})`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // Process videos in batches
  const batchSize = 10;
  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = videos.slice(i, i + batchSize);
    
    for (const video of batch) {
      try {
        // Find category ID
        const categoryId = categoryMap.get(video.category.toLowerCase()) || 
                          categoryMap.get('muži'); // Default to men's category
        
        if (!categoryId) {
          console.warn(`⚠️ Category not found: ${video.category}`);
          errorCount++;
          errors.push(`Category not found: ${video.category}`);
          continue;
        }
        
        // Find season ID
        const seasonId = seasonMap.get(video.season);
        
        // Check if video already exists
        const { data: existingVideo } = await supabase
          .from('videos')
          .select('id')
          .eq('youtube_id', video.youtube_id)
          .single();
        
        if (existingVideo) {
          console.log(`⏭️ Video already exists: ${video.title}`);
          continue;
        }
        
        // Insert video
        const { data, error } = await supabase
          .from('videos')
          .insert({
            title: video.title,
            description: video.description,
            youtube_url: video.youtube_url,
            youtube_id: video.youtube_id,
            category_id: categoryId,
            club_id: svinovClub.id,
            recording_date: video.recording_date,
            season_id: seasonId,
            thumbnail_url: video.thumbnail_url,
            is_active: true
          })
          .select()
          .single();
        
        if (error) {
          console.error(`❌ Error inserting video "${video.title}":`, error);
          errorCount++;
          errors.push(`Error inserting "${video.title}": ${error.message}`);
        } else {
          console.log(`✅ Imported: ${video.title}`);
          successCount++;
        }
        
      } catch (error) {
        console.error(`❌ Unexpected error for video "${video.title}":`, error);
        errorCount++;
        errors.push(`Unexpected error for "${video.title}": ${error.message}`);
      }
    }
    
    // Small delay between batches
    if (i + batchSize < videos.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`\n📊 Import Summary:`);
  console.log(`✅ Successfully imported: ${successCount} videos`);
  console.log(`❌ Failed: ${errorCount} videos`);
  
  if (errors.length > 0) {
    console.log(`\n❌ Errors:`);
    errors.forEach(error => console.log(`  - ${error}`));
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting video import from HTML...');
    
    // Read the HTML file
    const htmlFilePath = path.join(__dirname, '..', 'docs', 'video-mens-html.md');
    
    if (!fs.existsSync(htmlFilePath)) {
      console.error(`❌ HTML file not found: ${htmlFilePath}`);
      process.exit(1);
    }
    
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
    console.log(`📄 Read HTML file: ${htmlFilePath}`);
    
    // Parse video data
    const videos = parseVideoData(htmlContent);
    console.log(`🎥 Parsed ${videos.length} videos from HTML`);
    
    if (videos.length === 0) {
      console.log('⚠️ No videos found in HTML file');
      return;
    }
    
    // Show sample of parsed data
    console.log('\n📋 Sample parsed videos:');
    videos.slice(0, 3).forEach((video, index) => {
      console.log(`  ${index + 1}. ${video.title}`);
      console.log(`     Category: ${video.category}, Season: ${video.season}`);
      console.log(`     Date: ${video.recording_date}, URL: ${video.youtube_url}`);
    });
    
    if (videos.length > 3) {
      console.log(`  ... and ${videos.length - 3} more videos`);
    }
    
    // Ask for confirmation
    console.log('\n❓ Do you want to proceed with the import? (y/N)');
    
    // For automated execution, you can set this environment variable
    const autoConfirm = process.env.AUTO_CONFIRM === 'true';
    
    if (!autoConfirm) {
      // In a real script, you'd use readline for user input
      // For now, we'll proceed automatically
      console.log('🤖 Auto-confirming import...');
    }
    
    // Import to database
    await importVideosToDatabase(videos);
    
    console.log('\n🎉 Video import completed!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { parseVideoData, importVideosToDatabase };
