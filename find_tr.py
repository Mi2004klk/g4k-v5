import re

with open('apps/web/src/components/projects/tasks-tab.tsx', 'r') as f:
    content = f.read()

# Add highlight logic
highlight_setup = '''
  const isReview = searchParams.get("review") === "1";
  const highlightId = searchParams.get("highlight");
'''
content = content.replace('  const isReview = searchParams.get("review") === "1";', highlight_setup)

# We need to find the TableRow rendering. Let's see if we can find it.
print(content.find('<TableRow'))
