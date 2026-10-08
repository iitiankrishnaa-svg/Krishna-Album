import re
with open('moments.html', 'r', encoding='utf-8') as f:
    content = f.read()

m = re.search(r'<div class="carousel-track" id="carousel-track">(.*?)</div>\s*<button class="carousel-button', content, re.DOTALL)
if m:
    print(m.group(1).strip())
else:
    print("NOT FOUND")
