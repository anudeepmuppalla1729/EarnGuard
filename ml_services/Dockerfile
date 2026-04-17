FROM python:3.10

WORKDIR /app

# libgomp1 is required for XGBoost to run
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# --prefer-binary is the key: it avoids resource-intensive source builds
# while being faster than the multi-stage wheel approach
RUN pip install --upgrade pip
RUN pip install --default-timeout=1000 -i https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

COPY . .

# Ensure the model directory exists
RUN mkdir -p city_base_price_calc_model/models

EXPOSE 8000

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
