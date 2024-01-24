from pymongo import MongoClient
import time

client = MongoClient("mongodb://dbstorage:27017")
db = client.cloneDetector  # Use your database name

while True:
    files_count = db.files.count_documents({})
    chunks_count = db.chunks.count_documents({})
    candidates_count = db.candidates.count_documents({})
    clones_count = db.clones.count_documents({})
    
    # Calculate processing time statistics here
    # You can use time.time() to measure time intervals

    # Insert statistics into a separate collection
    db.statistics.insert_one({
        "timestamp": time.time(),
        "files_count": files_count,
        "chunks_count": chunks_count,
        "candidates_count": candidates_count,
        "clones_count": clones_count,
        # Add your processing time metrics here
    })

    time.sleep(60)  # Adjust the sampling interval as needed
