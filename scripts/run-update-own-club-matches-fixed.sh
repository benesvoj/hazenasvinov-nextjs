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
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "Please check your .env.local file"
    exit 1
fi

# Extract project reference from Supabase URL
PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co||')

echo "📊 Updating materialized view with category and season information..."
echo "🔗 Using project reference: $PROJECT_REF"

# Construct PostgreSQL connection string
DB_URL="postgresql://postgres.${PROJECT_REF}:${DB}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

echo "🔧 Running SQL script..."

# Run the SQL script using the constructed connection string
psql "$DB_URL" -f scripts/update-own-club-matches-view.sql

if [ $? -eq 0 ]; then
    echo "✅ Successfully updated own_club_matches materialized view"
    echo "📈 The view now includes category.name, category.description, and venue information"
else
    echo "❌ Error updating materialized view"
    echo "💡 You may need to run this manually in the Supabase SQL editor"
    echo "📝 Copy the contents of scripts/update-own-club-matches-view.sql and run it in Supabase"
    exit 1
fi

echo "🎉 Database update complete!"
echo ""
echo "Next steps:"
echo "1. Test your application to see if category information is now displayed"
echo "2. Check the MatchRow components for category.name and category.description"
echo "3. Verify that venue information is showing correctly"
