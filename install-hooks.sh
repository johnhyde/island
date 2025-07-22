#!/bin/bash
#
# Install git hooks for Flying Island project
# Run this script after cloning the repository to set up automatic chapter.json updates
#

echo "Installing git hooks for Flying Island project..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "Error: This script must be run from the root of the git repository"
    exit 1
fi

# Check if hooks directory exists
if [ ! -d "hooks" ]; then
    echo "Error: hooks directory not found in repository"
    exit 1
fi

# Install pre-commit hook
if [ -f "hooks/pre-commit" ]; then
    echo "Installing pre-commit hook..."
    cp "hooks/pre-commit" ".git/hooks/pre-commit"
    chmod +x ".git/hooks/pre-commit"
    echo "✓ Pre-commit hook installed successfully"
else
    echo "Warning: hooks/pre-commit not found"
fi

# Check if build.sh exists and is executable
if [ -f "build.sh" ]; then
    if [ ! -x "build.sh" ]; then
        echo "Making build.sh executable..."
        chmod +x "build.sh"
    fi
else
    echo "Warning: build.sh not found - the pre-commit hook requires this script"
fi

echo ""
echo "Git hooks installation complete!"
echo ""
echo "The pre-commit hook will now automatically:"
echo "- Detect when chapter files (##*.md) are being committed"
echo "- Run build.sh to regenerate site/chapters.json"
echo "- Add the updated chapters.json to your commit"
echo ""
echo "No manual intervention required when adding new chapters!"