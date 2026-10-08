import urllib.request
import json
import uuid

with open(r"C:\Users\neete\.gemini\antigravity\brain\dd9ff269-61a8-4b61-b81e-9e03747c6bc2\.user_uploaded\media_1791434962639.png", "rb") as f:
    data = f.read()

boundary = uuid.uuid4().hex

body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="upload_preset"\r\n\r\n'
    f'nisha_upload\r\n'
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="test.png"\r\n'
    f'Content-Type: image/png\r\n\r\n'
).encode() + data + f'\r\n--{boundary}--\r\n'.encode()

req = urllib.request.Request('https://api.cloudinary.com/v1_1/dvlxnbn7c/image/upload', method='POST')
req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')

try:
    response = urllib.request.urlopen(req, body)
    print("SUCCESS!")
    print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
