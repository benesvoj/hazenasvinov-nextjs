#!/bin/bash

# Database optimization script
# This script runs the database optimization SQL file safely

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting database optimization...${NC}"

# Check if database URL is provided
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL environment variable is not set${NC}"
    echo "Please set DATABASE_URL to your PostgreSQL connection string"
    echo "Example: export DATABASE_URL='postgresql://user:password@localhost:5432/database'"
    exit 1
fi

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql command not found${NC}"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Test database connection
echo -e "${YELLOW}🔍 Testing database connection...${NC}"
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Cannot connect to database${NC}"
    echo "Please check your DATABASE_URL and database availability"
    exit 1
fi

echo -e "${GREEN}✅ Database connection successful${NC}"

# Run the optimization script
echo -e "${YELLOW}📊 Running database optimization script...${NC}"

if psql "$DATABASE_URL" -f scripts/optimize-database-queries-simple.sql; then
    echo -e "${GREEN}✅ Database optimization completed successfully!${NC}"
    echo -e "${GREEN}📈 Performance improvements applied:${NC}"
    echo "  - Strategic indexes created"
    echo "  - Materialized views created"
    echo "  - Query optimization functions added"
    echo "  - Automatic refresh triggers set up"
else
    echo -e "${RED}❌ Error: Database optimization failed${NC}"
    echo "Please check the error messages above and fix any issues"
    exit 1
fi

# Verify the optimization
echo -e "${YELLOW}🔍 Verifying optimization...${NC}"

# Check if materialized views exist
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM match_stats;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Materialized view 'match_stats' created successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Materialized view 'match_stats' not found${NC}"
fi

# Check if optimized view exists
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM matches_with_teams_optimized LIMIT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Optimized view 'matches_with_teams_optimized' created successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Optimized view 'matches_with_teams_optimized' not found${NC}"
fi

# Check indexes
echo -e "${YELLOW}🔍 Checking created indexes...${NC}"
INDEX_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'matches';" | tr -d ' ')
echo -e "${GREEN}✅ Created $INDEX_COUNT indexes on matches table${NC}"

echo -e "${GREEN}🎉 Database optimization completed!${NC}"
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "  1. Test your application to ensure everything works correctly"
echo "  2. Monitor query performance using the performance monitoring tools"
echo "  3. Consider running ANALYZE on your tables if you have large datasets"
echo "  4. Set up regular refresh of materialized views if needed"

echo -e "${YELLOW}📚 For more information, see docs/PERFORMANCE_OPTIMIZATION.md${NC}"
