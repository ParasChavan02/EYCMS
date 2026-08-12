import requests

# 1. Login as admin
login_res = requests.post("http://localhost:8000/api/v1/auth/login", data={"username": "admin@example.com", "password": "adminpassword"})
print("Login status:", login_res.status_code)
token = login_res.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

# 2. Test upload-bill
url = "http://localhost:8000/api/v1/admin/transactions/upload-bill?amount=7788&budget_line=Travel&vendor=aa&description=vvv"
files = {"file": ("test.pdf", b"%PDF-1.4 test file content", "application/pdf")}
res = requests.post(url, headers=headers, files=files)

print("Upload Bill Status:", res.status_code)
print("Upload Bill Response:", res.text)
