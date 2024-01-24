import pymongo
import time

def monitor_db():
    client = pymongo.MongoClient('mongodb://dbstorage:27017/')
    db = client['cloneDetector']

    previous_counts = {'files': 0, 'chunks': 0, 'candidates': 0, 'clones': 0}
    while True:
        current_time = time.time()
        current_counts = {
            'files': db['files'].count_documents({}),
            'chunks': db['chunks'].count_documents({}),
            'candidates': db['candidates'].count_documents({}),
            'clones': db['clones'].count_documents({})
        }

        # Store the current counts in the 'statistics' collection
        db['statistics'].insert_one({
            'timestamp': current_time,
            'counts': current_counts
        })

        previous_counts = current_counts
        time.sleep(300)  # Wait for 5 minutes before the next check

if __name__ == "__main__":
    monitor_db()
