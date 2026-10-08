import re
import random

emoji_list = ['🥰', '💖', '😘', '💞', '✨', '❤️', '🥺', '🌹', '💫', '💑', '💘', '😍', '💍', '💌']

with open('memory.html', 'r', encoding='utf-8') as f:
    text = f.read()

def repl(m):
    return f'<div class="hover-emoji" style="font-size: 3rem; text-shadow: 0 0 15px rgba(255,255,255,0.8); animation: heartbeat 1.5s infinite;">{random.choice(emoji_list)}</div>'

text = re.sub(r'<div class="hover-emoji"[^>]*>\?+</div>', repl, text)

with open('memory.html', 'w', encoding='utf-8') as f:
    f.write(text)
