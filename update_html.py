import re

with open('moments.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Add GSAP and ThreeJS scripts just before closing body tag if not present
if 'three.min.js' not in content:
    scripts = """
    <!-- ThreeJS and GSAP for 3D Globe Carousel -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="carousel3d.js"></script>
"""
    content = content.replace('</body>', scripts + '\n</body>')

# Extract original carousel container
pattern = r'(<div class="carousel-container">)(.*?)(</div>\s*</div>\s*</section>)'
match = re.search(pattern, content, re.DOTALL)

if match:
    original_container_start = match.group(1)
    original_carousel_content = match.group(2)
    end_tags = match.group(3)
    
    # We only want the slides data to preserve it
    slides_match = re.search(r'<div class="carousel-track" id="carousel-track">(.*?)</div>\s*<button', original_carousel_content, re.DOTALL)
    slides_html = slides_match.group(1) if slides_match else ""

    new_carousel_html = f"""<div class="carousel-container" id="globe-carousel-container" style="position: relative; width: 100%; height: 70vh; max-height: 600px; min-height: 400px; overflow: hidden; background: transparent; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); touch-action: none;">
                <!-- Hidden data source for ThreeJS -->
                <div id="globe-data-source" style="display: none;">
                    {slides_html}
                </div>
                
                <!-- Overlay Text -->
                <div id="globe-overlay-text" style="position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); text-align: center; color: white; text-shadow: 0 4px 10px rgba(0,0,0,0.9); pointer-events: none; z-index: 10; opacity: 0; transition: opacity 0.5s ease; width: 90%; max-width: 500px; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 15px; backdrop-filter: blur(5px);">
                    <h3 id="globe-overlay-title" class="romantic-title" style="font-size: 2rem; margin-bottom: 5px; color: #fff;"></h3>
                    <p id="globe-overlay-desc" style="font-size: 1.1rem; margin-bottom: 8px; font-weight: 500;"></p>
                    <div id="globe-overlay-date" style="font-size: 0.85rem; background: rgba(255,107,143,0.8); padding: 4px 12px; border-radius: 20px; display: inline-block; font-weight: bold;"></div>
                </div>
                
                <!-- Interaction Prompt -->
                <div style="position: absolute; top: 15px; right: 20px; background: rgba(0,0,0,0.4); color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; pointer-events: none; z-index: 5; backdrop-filter: blur(4px); display: flex; align-items: center; gap: 6px;">
                    <i class="fas fa-hand-pointer"></i> Drag to rotate globe
                </div>
            """
            
    new_content = content[:match.start()] + new_carousel_html + end_tags + content[match.end():]
    
    with open('moments.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Updated moments.html successfully.")
else:
    print("Could not find carousel-container in moments.html")
