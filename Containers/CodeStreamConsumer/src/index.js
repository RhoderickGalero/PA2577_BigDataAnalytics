const express = require('express');
const formidable = require('formidable');
const fs = require('fs/promises');
const app = express();
const PORT = 3000;

const Timer = require('./Timer');
const CloneDetector = require('./CloneDetector');
const CloneStorage = require('./CloneStorage');
const FileStorage = require('./FileStorage');

const fileTimers = {};

// Express and Formidable stuff to receice a file for further processing
// --------------------
const form = formidable({multiples:false});

app.post('/', fileReceiver );
function fileReceiver(req, res, next) {
    form.parse(req, (err, fields, files) => {
        fs.readFile(files.data.filepath, { encoding: 'utf8' })
            .then( data => { return processFile(fields.name, data); });
    });
    return res.end('');
}

app.get('/', viewClones );

app.get('/timers', viewTimers);

const server = app.listen(PORT, () => { console.log('Listening for files on port', PORT); });


// Page generation for viewing current progress
// --------------------
function getStatistics() {
    let cloneStore = CloneStorage.getInstance();
    let fileStore = FileStorage.getInstance();
    let output = 'Processed ' + fileStore.numberOfFiles + ' files containing ' + cloneStore.numberOfClones + ' clones.'
    return output;
}

function lastFileTimersHTML() {
    if (!lastFile) return '';
    output = '<p>Timers for last file processed:</p>\n<ul>\n'
    let timers = Timer.getTimers(lastFile);
    for (t in timers) {
        output += '<li>' + t + ': ' + (timers[t] / (1000n)) + ' µs\n'
    }
    output += '</ul>\n';
    return output;
}

function listClonesHTML() {
    let cloneStore = CloneStorage.getInstance();
    let output = '';

    cloneStore.clones.forEach( clone => {
        output += '<hr>\n';
        output += '<h2>Source File: ' + clone.sourceName + '</h2>\n';
        output += '<p>Starting at line: ' + clone.sourceStart + ' , ending at line: ' + clone.sourceEnd + '</p>\n';
        output += '<ul>';
        clone.targets.forEach( target => {
            output += '<li>Found in ' + target.name + ' starting at line ' + target.startLine + '\n';            
        });
        output += '</ul>\n'
        output += '<h3>Contents:</h3>\n<pre><code>\n';
        output += clone.originalCode;
        output += '</code></pre>\n';
    });

    return output;
}

function listProcessedFilesHTML() {
    let fs = FileStorage.getInstance();
    let output = '<HR>\n<H2>Processed Files</H2>\n'
    output += fs.filenames.reduce( (out, name) => {
        out += '<li>' + name + '\n';
        return out;
    }, '<ul>\n');
    output += '</ul>\n';
    return output;
}

function viewClones(req, res, next) {
    let page='<HTML><HEAD><TITLE>CodeStream Clone Detector</TITLE></HEAD>\n';
    page += '<BODY><H1>CodeStream Clone Detector</H1>\n';
    page += '<P>' + getStatistics() + '</P>\n';
    page += lastFileTimersHTML() + '\n';
    page += listClonesHTML() + '\n';
    page += listProcessedFilesHTML() + '\n';
    page += '</BODY></HTML>';
    res.send(page);
}

function viewTimers(req, res, next) {
    let page = '<HTML><HEAD><TITLE>CodeStream Clone Detector - Timers</TITLE></HEAD>\n';
    page += '<BODY><H1>CodeStream Clone Detector - Timers</H1>\n';

    // Calculate and display average times per file
    const totalFiles = Object.keys(fileTimers).length;
    const totalTimers = {};
    let totalDuration = 0n;

    for (const fileName in fileTimers) {
        const timers = fileTimers[fileName];
        for (const timerName in timers) {
            totalTimers[timerName] = (totalTimers[timerName] || 0n) + timers[timerName];
            totalDuration += timers[timerName];
        }
    }

    const averageTimesPerFile = {};
    for (const timerName in totalTimers) {
        averageTimesPerFile[timerName] = totalTimers[timerName] / BigInt(totalFiles);
    }

    page += '<h2>Average Times Per File:</h2>\n';
    page += '<ul>\n';
    for (const timerName in averageTimesPerFile) {
        page += `<li>${timerName}: ${averageTimesPerFile[timerName] / 1000n} µs</li>\n`;
    }
    page += '</ul>\n';

    // Calculate and display average times per last 100 files
    const last100Files = Object.keys(fileTimers).slice(-100);
    const averageTimesLast100Files = {};
    const totalTimersLast100Files = {};

    for (const fileName of last100Files) {
        const timers = fileTimers[fileName];
        for (const timerName in timers) {
            totalTimersLast100Files[timerName] = (totalTimersLast100Files[timerName] || 0n) + timers[timerName];
        }
    }

    for (const timerName in totalTimersLast100Files) {
        averageTimesLast100Files[timerName] = totalTimersLast100Files[timerName] / BigInt(last100Files.length);
    }

    page += '<h2>Average Times Per Last 100 Files:</h2>\n';
    page += '<ul>\n';
    for (const timerName in averageTimesLast100Files) {
        page += `<li>${timerName}: ${averageTimesLast100Files[timerName] / 1000n} µs</li>\n`;
    }
    page += '</ul>\n';

    // Calculate and display average times per last 1000 files
    const last1000Files = Object.keys(fileTimers).slice(-1000);
    const averageTimesLast1000Files = {};
    const totalTimersLast1000Files = {};

    for (const fileName of last1000Files) {
        const timers = fileTimers[fileName];
        for (const timerName in timers) {
            totalTimersLast1000Files[timerName] = (totalTimersLast1000Files[timerName] || 0n) + timers[timerName];
        }
    }

    for (const timerName in totalTimersLast1000Files) {
        averageTimesLast1000Files[timerName] = totalTimersLast1000Files[timerName] / BigInt(last1000Files.length);
    }

    page += '<h2>Average Times Per Last 1000 Files:</h2>\n';
    page += '<ul>\n';
    for (const timerName in averageTimesLast1000Files) {
        page += `<li>${timerName}: ${averageTimesLast1000Files[timerName] / 1000n} µs</li>\n`;
    }
    page += '</ul>\n';

    // Display total duration
    page += '<h2>Total Duration for All Files:</h2>\n';
    page += `<p>${totalDuration / 1000n} µs</p>\n`;

    page += '</BODY></HTML>';
    res.send(page);
}

// Some helper functions
// --------------------
// PASS is used to insert functions in a Promise stream and pass on all input parameters untouched.
PASS = fn => d => {
    try {
        fn(d);
        return d;
    } catch (e) {
        throw e;
    }
};

const STATS_FREQ = 100;
const URL = process.env.URL || 'http://localhost:8080/';
var lastFile = null;

function maybePrintStatistics(file, cloneDetector, cloneStore) {
    if (0 == cloneDetector.numberOfProcessedFiles % STATS_FREQ) {
        console.log('Processed', cloneDetector.numberOfProcessedFiles, 'files and found', cloneStore.numberOfClones, 'clones.');
        let timers = Timer.getTimers(file);
        let str = 'Timers for last file processed: ';
        for (t in timers) {
            str += t + ': ' + (timers[t] / (1000n)) + ' µs '
        }
        console.log(str);
        console.log('List of found clones available at', URL);
    }

    return file;
}

// Processing of the file
// --------------------
function processFile(filename, contents) {
    let cd = new CloneDetector();
    let cloneStore = CloneStorage.getInstance();

    const startTime = process.hrtime.bigint();

    return Promise.resolve({name: filename, contents: contents} )
        //.then( PASS( (file) => console.log('Processing file:', file.name) ))
        .then( (file) => Timer.startTimer(file, 'total') )
        .then( (file) => cd.preprocess(file) )
        .then( (file) => cd.transform(file) )

        .then( (file) => Timer.startTimer(file, 'match') )
        .then( (file) => cd.matchDetect(file) )
        .then( (file) => cloneStore.storeClones(file) )
        .then( (file) => Timer.endTimer(file, 'match') )

        .then( (file) => cd.storeFile(file) )
        .then((file) => {
            const endTime = process.hrtime.bigint();
            const elapsedTime = endTime - startTime;

            // Store the timer for this file
            fileTimers[filename] = file.timers;

            // Print file processing time
            console.log(`Processing file ${filename}: ${elapsedTime / 1000n} µs`);
            return Timer.endTimer(file, 'total');
        })
        .then( PASS( (file) => lastFile = file ))
        .then( PASS( (file) => maybePrintStatistics(file, cd, cloneStore) ))
    // TODO Store the timers from every file (or every 10th file), create a new landing page /timers
    // and display more in depth statistics there. Examples include:
    // average times per file, average times per last 100 files, last 1000 files.
    // Perhaps throw in a graph over all files.
        .catch( console.log );
};

/*
1. Preprocessing: Remove uninteresting code, determine source and comparison units/granularities
2. Transformation: One or more extraction and/or transformation techniques are applied to the preprocessed code to obtain an intermediate representation of the code.
3. Match Detection: Transformed units (and/or metrics for those units) are compared to find similar source units.
4. Formatting: Locations of identified clones in the transformed units are mapped to the original code base by file location and line number.
5. Post-Processing and Filtering: Visualisation of clones and manual analysis to filter out false positives
6. Aggregation: Clone pairs are aggregated to form clone classes or families, in order to reduce the amount of data and facilitate analysis.
*/
