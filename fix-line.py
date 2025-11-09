# Python script to fix the syntax error in index.html
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and remove the problematic line
new_lines = []
for line in lines:
    # Skip the line that contains only "        }"
    if line == '        }\n':
        continue
    new_lines.append(line)

# Write the fixed content back to the file
with open('index.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Syntax error fixed!")