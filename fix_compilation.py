import re

file_path = r"C:\Users\poorn\Downloads\api\FinGuardAPI-main\backend\src\main\java\com\finguard\api\config\DataInitializer.java"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove generateMonthlyCashFlows lines
content = re.sub(r'^\s*generateMonthlyCashFlows\(.*?\);\s*$\n', '', content, flags=re.MULTILINE)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
