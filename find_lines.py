with open('moments.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'carousel-container' in line:
        print(f"Start: {i}")
        break

for j in range(i, len(lines)):
    if 'carousel-nav' in lines[j]:
        print(f"Nav: {j}")
        # we know it ends around here
        break
