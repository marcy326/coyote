# ベースイメージ
FROM python:3.8

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係をインストール
COPY requirements.txt .
RUN pip install -r requirements.txt

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションを起動
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
