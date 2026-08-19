import re

with open('apps/web/src/app/dashboard/profile/components/profile-general-tab.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace('import { queryKeys } from "@/lib/query-keys";', 'import { queryKeys } from "@/lib/query-keys";\nimport { useCapabilities, hasCapability } from "@/lib/capabilities";')

hook_code = '''
  const { data: caps = [] } = useCapabilities();
  const canManageDesignation = hasCapability(caps, "users.hr.manage") || hasCapability(caps, "designations.manage");
'''
content = content.replace('const authUser = useAuthStore((s) => s.user);', hook_code + '\n  const authUser = useAuthStore((s) => s.user);')

select_logic = '''
                <Select disabled={!canManageDesignation} value={designationId || "unset"} onValueChange={(v) => { setDesignationId(v === "unset" ? "" : v); }}>
'''
content = content.replace('<Select value={designationId || "unset"} onValueChange={(v) => { setDesignationId(v === "unset" ? "" : v); }}>', select_logic.strip())

with open('apps/web/src/app/dashboard/profile/components/profile-general-tab.tsx', 'w') as f:
    f.write(content)

print("profile-general-tab updated")
