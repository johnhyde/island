#!/bin/bash
#
# Install git hook
# Run this script after cloning the repository to set up automatic chapter.json updates

set -e # If any of the steps fail, exit.

echo "Installing git hook for Flying Island project..."

chmod +x "build.sh"

chmod +x "./hooks/pre-commit"

if [ -f ".git/hooks/pre-commit" ]; then
    echo "There is already a .git/hooks/pre-commit, which looks like this (may be empty):"
    cat ".git/hooks/pre-commit"
    read -p "THIS SCRIPT WILL OVERWRITE THAT FILE. IF YOU DON'T LIKE THIS, PRESS CTRL-C NOW. Otherwise, press anything else to continue." -n 1 -r
    echo "Overwriting pre-commit hook..."
fi
# You need the shebang for arcane git reasons.
echo "#!/bin/bash" >".git/hooks/pre-commit"
echo "echo Running .git/hooks/pre-commit...; ./hooks/pre-commit" >>".git/hooks/pre-commit"
chmod +x ".git/hooks/pre-commit"
echo "✓ Pre-commit hook installed successfully"
echo "Git hook installation complete!"
echo "The pre-commit hook will automatically regenerate the chapter json and word count appendix for you."