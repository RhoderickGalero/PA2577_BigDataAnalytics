# cat manual.py
from pymongo import MongoClient
client = MongoClient("mongodb://dbstorage:27017")
db = client.cloneDetector
statistics = db.statistics.find()
for stat in statistics:
    print(stat)
client.close()