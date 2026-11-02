FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
        git \
        libgl1 \
        libglib2.0-0 \
        libjpeg-dev \
        libsm6 \
        libtesseract-dev \
        libxext6 \
        libxrender1 \
        poppler-utils \
        tesseract-ocr \
        zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN python -m pip install --upgrade pip setuptools wheel \
    && python -m pip install -r requirements.txt

COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:' + str(__import__('os').environ.get('PORT', '8000')) + '/').read()" || exit 1

CMD ["sh", "-c", "gunicorn app:app --workers 2 --bind 0.0.0.0:${PORT:-8000} --worker-class uvicorn.workers.UvicornWorker"]
