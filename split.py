import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace Nav
new_nav = '''<ul class="nav-links">
            <li><a href="index.html#home">Home</a></li>
            <li><a href="index.html#moments">Moments</a></li>
            <li><a href="memory.html#gallery">Gallery</a></li>
            <li><a href="memory.html#videos">Videos</a></li>
            <li><a href="diary.html#diary">Diary</a></li>
        </ul>'''
html = re.sub(r'<ul class="nav-links">.*?</ul>', new_nav, html, flags=re.DOTALL)

# Regular expressions to find sections
home_match = re.search(r'(<!-- Hero Section -->.*?</header>)', html, flags=re.DOTALL)
moments_match = re.search(r'(<!-- Carousel Section \(Moments\) -->.*?</section>)', html, flags=re.DOTALL)
gallery_match = re.search(r'(<!-- Masonry Grid Gallery -->.*?</section>)', html, flags=re.DOTALL)
videos_match = re.search(r'(<!-- Video Showcase Section -->.*?</section>)', html, flags=re.DOTALL)
diary_match = re.search(r'(<!-- Blog / Diary Section -->.*?</section>)', html, flags=re.DOTALL)

# Header and Footer layout
head_match = re.search(r'(<!DOCTYPE html>.*?</nav>)', html, flags=re.DOTALL)
footer_match = re.search(r'(<!-- Footer -->.*?</html>)', html, flags=re.DOTALL)

head = head_match.group(1)
footer = footer_match.group(1)

# Emojis for gallery
gallery_html = gallery_match.group(1)
emojis = ["??", "??", "??", "??", "?", "??", "??", "??", "??", "??", "??", "??", "??", "??"]
import random
def replace_heart(m):
    return f'<div class="hover-emoji" style="font-size: 3rem; text-shadow: 0 0 15px rgba(255,255,255,0.8); animation: heartbeat 1.5s infinite;">{random.choice(emojis)}</div>'

gallery_html = re.sub(r'<i class="fas fa-heart"></i>', replace_heart, gallery_html)

# Create index.html
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(head + '\n\n' + home_match.group(1) + '\n\n' + moments_match.group(1) + '\n\n' + footer)

# Create memory.html
with open('memory.html', 'w', encoding='utf-8') as f:
    f.write(head + '\n\n' + gallery_html + '\n\n' + videos_match.group(1) + '\n\n' + footer)

# Create diary.html
with open('diary.html', 'w', encoding='utf-8') as f:
    f.write(head + '\n\n' + diary_match.group(1) + '\n\n' + footer)

