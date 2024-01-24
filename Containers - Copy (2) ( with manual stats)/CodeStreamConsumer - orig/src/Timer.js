// Timer.js code
class Timer {
    static fileTimers = {};

    static startTimer(file, timerName) {
        file.timers = file.timers || {};
        file.timers[timerName] = process.hrtime.bigint();
        return file;
    }

    static endTimer(file, timerName) {
        let end = process.hrtime.bigint();
        let start = file.timers[timerName] || end;
        file.timers[timerName] = end - start;

        // Store file timers globally
        this.fileTimers[file.name] = file.timers;

        return file;
    }

    static getFileTimers() {
        return this.fileTimers;
    }

    static getTimers(file) { return file.timers; }
}

module.exports = Timer;
