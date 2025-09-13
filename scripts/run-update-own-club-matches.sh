#!/bin/bash

# Script to update the own_club_matches materialized view
# This adds category and season information to the materialized view

echo "🔄 Updating own_club_matches materialized view..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please make sure you have the environment variables set up"
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please check your .env.local file"
    exit 1
fi

echo "📊 Updating materialized view with category and season information..."

# Run the SQL script
psql "$NEXT_PUBLIC_SUPABASE_URL" -f scripts/update-own-club-matches-view.sql

if [ $? -eq 0 ]; then
    echo "✅ Successfully updated own_club_matches materialized view"
    echo "📈 The view now includes category.name, category.description, and venue information"
else
    echo "❌ Error updating materialized view"
    exit 1
fi

echo "🎉 Database update complete!"
echo ""
echo "Next steps:"
echo "1. Test your application to see if category information is now displayed"
echo "2. Check the MatchRow components for category.name and category.description"
echo "3. Verify that venue information is showing correctly"
