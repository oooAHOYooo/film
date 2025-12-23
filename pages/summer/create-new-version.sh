#!/bin/bash

# Script to create a new treatment version
# Usage: ./create-new-version.sh <cred-version> [version-number]
# Example: ./create-new-version.sh cred16G 1.2

if [ -z "$1" ]; then
    echo "Usage: ./create-new-version.sh <cred-version> [version-number]"
    echo "Example: ./create-new-version.sh cred16G 1.2"
    exit 1
fi

CRED_VERSION=$1
VERSION_NUM=${2:-"1.2"}
TREATMENT_FILE="treatment.md"
VERSIONS_DIR="treatment-versions"
DATE=$(date +%Y-%m-%d)

# Get current status from treatment.md
CURRENT_STATUS=$(grep "^\*\*Status:\*\*" "$TREATMENT_FILE" | sed 's/\*\*Status:\*\* //' | tr -d ' ')

if [ -z "$CURRENT_STATUS" ]; then
    echo "Error: Could not find current status in $TREATMENT_FILE"
    exit 1
fi

echo "Current version: $CURRENT_STATUS"
echo "New version: $CRED_VERSION"
echo "Version number: $VERSION_NUM"
echo "Date: $DATE"
echo ""

# Archive current version
ARCHIVE_FILE="$VERSIONS_DIR/treatment-v${VERSION_NUM}-${DATE}-${CURRENT_STATUS}.md"
echo "Archiving current version to: $ARCHIVE_FILE"
cp "$TREATMENT_FILE" "$ARCHIVE_FILE"

# Update treatment.md header
echo "Updating $TREATMENT_FILE..."
sed -i '' "s/^\*\*Version:\*\*.*/\*\*Version:\*\* $VERSION_NUM/" "$TREATMENT_FILE"
sed -i '' "s/^\*\*Last Updated:\*\*.*/\*\*Last Updated:\*\* $DATE/" "$TREATMENT_FILE"
sed -i '' "s/^\*\*Status:\*\*.*/\*\*Status:\*\* $CRED_VERSION/" "$TREATMENT_FILE"

# Update version history
# This is a simple append - you may want to manually format it better
VERSION_HISTORY_LINE="| $VERSION_NUM | $DATE | $CRED_VERSION - Minor edits and spellchecks | AG |"
# Find the line after the table header and insert
sed -i '' "/^| Version | Date | Changes | Author |/a\\
$VERSION_HISTORY_LINE
" "$TREATMENT_FILE"

echo ""
echo "✅ Done! Next steps:"
echo "1. Edit $TREATMENT_FILE with your spellchecks and rephrasing"
echo "2. Update storybook.html to reference $CRED_VERSION"
echo "3. Test the storybook to make sure everything looks good"

