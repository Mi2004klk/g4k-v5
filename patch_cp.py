import re

with open('apps/web/src/components/app-shell/command-palette.tsx', 'r') as f:
    content = f.read()

# Add quick notes command to Navigation
nav_group = '''
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <AppIcon name="dashboard" className=" mr-2" />
            <span>Dashboard</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/notes"))}>
            <AppIcon name="edit" className=" mr-2" />
            <span>Open Quick Notes</span>
          </CommandItem>
'''
content = content.replace('<CommandGroup heading="Navigation">\n          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>\n            <AppIcon name="dashboard" className=" mr-2" />\n            <span>Dashboard</span>\n            <CommandShortcut>⌘D</CommandShortcut>\n          </CommandItem>', nav_group)

with open('apps/web/src/components/app-shell/command-palette.tsx', 'w') as f:
    f.write(content)

print("Command Palette updated")
