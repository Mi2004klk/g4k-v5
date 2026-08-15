import os
path = r"C:\Users\Founder Desk\3D Objects\Games4Kings-New\apps\api\app\Scopes\HrScope.php"
with open(path, "r") as f:
    c = f.read()

c = c.replace("// else {\n            //     $builder->whereRaw('1 = 0');\n            // }", "else {\n                $builder->whereRaw('1 = 0');\n            }")

with open(path, "w") as f:
    f.write(c)
