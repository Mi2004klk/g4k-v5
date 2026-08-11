import os, re

files = [
    ('profile/page.tsx', r'className="space-y-6 p-6 max-w-5xl', 'className="space-y-6 max-w-5xl'),
    ('profile/page.tsx', r'className="p-6 space-y-6"', 'className="space-y-6"'),
    ('org/users/page.tsx', r'className="space-y-6 p-6"', 'className="space-y-6"'),
    ('org/designations/page.tsx', r'className="space-y-6 p-6"', 'className="space-y-6"'),
    ('org/departments/page.tsx', r'className="space-y-6 p-6"', 'className="space-y-6"'),
    ('org/attendance/page.tsx', r'className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-950 p-6"', 'className="flex-1 overflow-auto"'),
    ('directory/page.tsx', r'className="space-y-6 p-6"', 'className="space-y-6"'),
    ('attendance/page.tsx', r'className="space-y-6 p-6"', 'className="space-y-6"'),
    ('admin/reports/page.tsx', r'className="flex-1 p-6 max-w-7xl', 'className="flex-1 max-w-7xl'),
    ('admin/attendance/page.tsx', r'className="flex-1 overflow-auto bg-neutral-50 dark:bg-neutral-950 p-6"', 'className="flex-1 overflow-auto"')
]

base_dir = r'c:\Users\Founder Desk\3D Objects\Games4Kings-New\apps\web\src\app\dashboard'
for rel_path, old_str, new_str in files:
    full_path = os.path.join(base_dir, rel_path)
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        content = content.replace(old_str, new_str)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {rel_path}')
