import urllib.request
import json
import uuid

data = json.dumps([{"test": 3}]).encode()
boundary = uuid.uuid4().hex

body = (
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="upload_preset"\r\n\r\n'
    f'nisha_upload\r\n'
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="public_id"\r\n\r\n'
    f'nk_updates\r\n'
    f'--{boundary}\r\n'
    f'Content-Disposition: form-data; name="file"; filename="nk_updates.json"\r\n'
    f'Content-Type: application/json\r\n\r\n'
).encode() + data + f'\r\n--{boundary}--\r\n'.encode()

req = urllib.request.Request('https://api.cloudinary.com/v1_1/dvlxnbn7c/raw/upload', method='POST')
req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')

try:
    response = urllib.request.urlopen(req, body)
    print("SUCCESS!")
    print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
