with open('script.js', 'r', encoding='utf-8') as f:
    content = f.read()

start_str = "function enableProtection() {"
start = content.find(start_str)

if start != -1:
    start_brace = content.find('{', start)
    brace_count = 1
    end_idx = -1
    
    for i in range(start_brace + 1, len(content)):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                end_idx = i
                break
            
    if end_idx != -1:
        new_func = "function enableProtection() {\n        // Protection disabled per user request\n        return;\n    }"
        new_content = content[:start] + new_func + content[end_idx+1:]
        
        with open('script.js', 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully replaced enableProtection by counting braces.")
    else:
        print("Could not find matching closing brace")
else:
    print("Could not find start_str")
