from flask import Flask, render_template
import pymongo

app = Flask(__name__)
client = pymongo.MongoClient('mongodb://dbstorage:27017/')
db = client['cloneDetector']

@app.route('/')
def index():
    statistics = list(db['statistics'].find({}))
    return render_template('index.html', statistics=statistics)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
