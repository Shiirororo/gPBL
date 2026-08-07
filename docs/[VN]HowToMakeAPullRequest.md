

# Lưu ý cho các con vợ:

Khi cần sửa mã nguồn, đừng có git init lại nữa, không thì sửa merge history mệt lắm

# Cách làm đúng:
## Clone
```
git clone https://github.com/Shiirororo/RSA.git
```
## Tạo nhánh mới để làm tính năng
```
git checkout -b rsa-feature-xyz
```
## Code và Commit:
```
git add .
git commit -m "feat: mô tả tính năng vừa làm"
```
## Push nhánh lên GitHub:
```
git push origin rsa-feature-xyz
```
## Tạo Pull Request: Lên GitHub nhấn nút Compare & Pull Request.

Thanks


# Cách viêt Test cho các con vợ

## Bước 1: Tạo file mock test có dạng tests/test_<module_name>.py

## Bước 2: import thư viện unittest, viết class Test

## Bước 3: git push lên branch (test được deploy trên mọi branch), hoặc tạo pull request (test chạy ở branch main)

## Bước 4: Lên git check test có thành công không 