#!/bin/bash

# GPS Dental Training - Strapi Setup Script
# This script creates a new Strapi project with all required content types

echo "🚀 Setting up Strapi CMS for GPS Dental Training..."

# Create Strapi project directory
STRAPI_DIR="../gps-strapi"

if [ -d "$STRAPI_DIR" ]; then
    echo "⚠️  Strapi directory already exists at $STRAPI_DIR"
    read -p "Do you want to delete and recreate? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$STRAPI_DIR"
    else
        echo "Exiting..."
        exit 1
    fi
fi

# Create new Strapi project
echo "📦 Creating Strapi project..."
npx create-strapi-app@latest "$STRAPI_DIR" --quickstart --no-run

cd "$STRAPI_DIR"

# Install additional plugins
echo "📦 Installing plugins..."
npm install strapi-plugin-populate-deep @strapi/plugin-seo

echo ""
echo "✅ Strapi project created successfully!"
echo ""
echo "📝 Next steps:"
echo "1. cd $STRAPI_DIR"
echo "2. npm run develop"
echo "3. Create admin user at http://localhost:1337/admin"
echo "4. Import content types from /docs/strapi-content-types.md"
echo ""
echo "📋 Manual steps required:"
echo "- Create each Content Type in Strapi Admin"
echo "- Configure API permissions (public read for most)"
echo "- Generate API token for frontend"
echo ""
