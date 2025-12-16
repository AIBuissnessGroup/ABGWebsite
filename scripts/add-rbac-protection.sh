#!/bin/bash

# Script to add RBAC protection to all admin pages
# Run from the root of the project: ./scripts/add-rbac-protection.sh

echo "🔒 Adding RBAC Protection to Admin Pages"
echo "========================================"
echo ""

# Array of admin pages and their protection levels
declare -A pages=(
  ["events"]="events"
  ["recruitment"]="recruitment"
  ["coffee-chats"]="coffee-chats"
  ["interviews"]="interviews"
  ["member-levels"]="member-levels"
  ["projects"]="projects"
  ["team"]="team"
  ["about"]="about"
  ["join"]="join"
  ["hero"]="hero"
  ["content"]="content"
  ["newsroom"]="newsroom"
  ["newsletter"]="newsletter"
  ["notifications"]="notifications"
  ["internships"]="internships"
  ["companies"]="companies"
  ["forms"]="forms"
  ["users"]="users"
  ["permissions"]="permissions"
  ["settings"]="settings"
  ["audit"]="audit"
  ["analytics"]="analytics"
  ["waitlists"]="waitlists"
  ["recruitment-timeline"]="recruitment-timeline"
  ["changelog"]="changelog"
)

for page in "${!pages[@]}"; do
  page_file="src/app/admin/$page/page.tsx"
  permission="${pages[$page]}"
  
  if [ -f "$page_file" ]; then
    # Check if already protected
    if grep -q "withAdminPageProtection" "$page_file"; then
      echo "✓ $page - Already protected"
    else
      echo "⚠ $page - Needs protection"
      echo "  Add this at the bottom of $page_file:"
      echo "  export default withAdminPageProtection(${page^}Page, '$permission');"
      echo ""
    fi
  else
    echo "✗ $page - File not found ($page_file)"
  fi
done

echo ""
echo "========================================"
echo "📝 Manual Steps Required:"
echo "1. Import the HOC at the top of each file:"
echo "   import { withAdminPageProtection } from '@/components/admin/AdminPageProtection';"
echo ""
echo "2. Change the default export from:"
echo "   export default function PageName() { ... }"
echo "   to:"
echo "   function PageName() { ... }"
echo "   export default withAdminPageProtection(PageName, 'page-permission');"
echo ""
echo "3. Test each page to ensure proper access control"
echo ""
