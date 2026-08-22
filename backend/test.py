import requests
import json
import time
import os

print("Registering...")
resp = requests.post("http://localhost:8081/api/v1/auth/register", json={
    "email": "test@test.com",
    "password": "password",
    "name": "Test User"
})
print(resp.status_code)
if resp.status_code != 200 and resp.status_code != 201 and resp.status_code != 400:
    print(resp.text)

print("Logging in...")
resp = requests.post("http://localhost:8081/api/v1/auth/login", json={
    "email": "test@test.com",
    "password": "password"
})
token = resp.json().get("token")
print("Token:", token)

with open("dummy.pdf", "wb") as f:
    f.write(b"%PDF-1.4 dummy pdf content for testing affinda")

print("Uploading...")
with open("dummy.pdf", "rb") as f:
    resp = requests.post("http://localhost:8081/api/v1/resumes/upload", headers={
        "Authorization": f"Bearer {token}"
    }, files={"file": f})

print(resp.status_code)
print(resp.text)
