FROM python:3.8-slim
RUN pip install pymongo
COPY . /app
WORKDIR /app
CMD ["python", "monitor_tool.py"]