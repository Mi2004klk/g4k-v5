import re

with open('apps/web/src/app/dashboard/page.tsx', 'r') as f:
    content = f.read()

# Add import
content = content.replace('import { HrTeamAttendanceWidget } from "@/components/dashboard/hr-team-attendance-widget";', 'import { HrTeamAttendanceWidget } from "@/components/dashboard/hr-team-attendance-widget";\nimport { TeamAttendanceWidget } from "@/components/dashboard/team-attendance-widget";')

# Add to employee view
employee_widget = '''
    if (hasCapability(userCapabilities, "hr.view-team-attendance") && activeRole !== "hr" && activeRole !== "super_admin") {
      widgets.push({
        id: "team-attendance",
        component: <TeamAttendanceWidget />,
        defaultLayout: responsiveLayout({ x: 8, y: 0, w: 4, h: 3 }),
      });
    }

    return widgets;
'''
content = content.replace('    return widgets;', employee_widget)

with open('apps/web/src/app/dashboard/page.tsx', 'w') as f:
    f.write(content)

print("TeamAttendanceWidget registered")
