# Hướng dẫn cài đặt & chạy dự án / セットアップ・起動ガイド

---

## 🇻🇳 Tiếng Việt

### Yêu cầu / Prerequisites
- Python **3.10+**
- Git

---

### Bước 1: Clone dự án

```bash
git clone https://github.com/Shiirororo/gPBL.git
cd gPBL
```

---

### Bước 2: Tạo và kích hoạt môi trường ảo (Virtual Environment)

**Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**
```bat
python -m venv venv
venv\Scripts\activate
```

> Khi kích hoạt thành công, bạn sẽ thấy `(venv)` xuất hiện ở đầu dòng lệnh.

---

### Bước 3: Cài đặt các thư viện

```bash
pip install -r requirements.txt
```

---

### Bước 4: Chạy migration để khởi tạo database

```bash
cd src && python src/manage.py migrate
```

---

### Bước 5: Khởi động server ở chế độ phát triển

```bash
python src/manage.py runserver
```

Server sẽ chạy tại: **http://127.0.0.1:8000/**

---

### ⚠️ Lưu ý quan trọng

- **Không commit** file `venv/` lên Git (đã có trong `.gitignore`).
- `DEBUG = True` đang được bật trong `settings.py` — **không dùng cấu hình này trên môi trường production**.
- Mỗi khi có thành viên thêm migration mới (thay đổi model), hãy chạy lại `python src/manage.py migrate` sau khi `git pull`.

---
---

## 🇯🇵 日本語

### 必要環境 / Prerequisites
- Python **3.10+**
- Git

---

### ステップ 1: リポジトリをクローンする

```bash
git clone https://github.com/Shiirororo/gPBL.git
cd gPBL
```

---

### ステップ 2: 仮想環境を作成・有効化する

**Linux / macOS:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**
```bat
python -m venv venv
venv\Scripts\activate
```

> 有効化に成功すると、ターミナルのプロンプトに `(venv)` が表示されます。

---

### ステップ 3: 依存パッケージをインストールする

```bash
pip install -r requirements.txt
```

---

### ステップ 4: データベースのマイグレーションを実行する

```bash
cd src && python src/manage.py migrate
```

---

### ステップ 5: 開発サーバーを起動する

```bash
python src/manage.py runserver
```

サーバーは次のアドレスで起動します: **http://127.0.0.1:8000/**

---

### ⚠️ 注意事項

- `venv/` フォルダは `.gitignore` に登録済みのため、**Git にコミットしないでください**。
- `settings.py` で `DEBUG = True` が設定されています — **本番環境では絶対に使用しないでください**。
- チームメンバーがモデルを変更した場合、`git pull` 後に `python src/manage.py migrate` を再度実行してください。
