from flask import Flask, Response
from pymongo import MongoClient
import time

app = Flask(__name__)
client = MongoClient("mongodb://dbstorage:27017")
db = client.cloneDetector

@app.route('/metrics')
def metrics():
    latest_stat = db.statistics.find().sort("timestamp", -1).limit(1)[0]
    metrics_response = [
        f"files_count {latest_stat['files_count']}",
        f"chunks_count {latest_stat['chunks_count']}",
        f"candidates_count {latest_stat['candidates_count']}",
        f"clones_count {latest_stat['clones_count']}"
    ]
    return Response('\n'.join(metrics_response), mimetype="text/plain")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
