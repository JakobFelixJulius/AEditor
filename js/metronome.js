function Metronome(app){
    this.isPlaying = false;      //Are we currently playing?
    this.lookahead = 25.0;       //How frequently to call scheduling function (in milliseconds)
    this.scheduleAheadTime = 0.1;//How far ahead to schedule audio (sec), this is calculated from lookahead, and overlaps with next interval (in case the timer is late)
    this.nextNoteTime = 0.0;     //when the next note is due.
    this.noteLength = 0.05;      //length of "beep" (in seconds)
    this.timerWorker = null;     //The Web Worker used to fire timer messages
    this.app = app;
}

Metronome.prototype = {
    constructor: Metronome,

    playMetronome:function(metro){
        this.isPlaying = !this.isPlaying;

        if (this.isPlaying) {    //start playing
            var offset = document.getElementById("timeline").style.left.replace(/[^0-9]/g,'') - 254.0;
            var quatersPerSecond = 60.0/this.app.tempo;
            var quaterOffset = offset/((Math.round(22*quatersPerSecond)));
            var beatOffset = offset/((Math.round(4*22*quatersPerSecond)));

            var integerPart = Math.floor(quaterOffset);
            quaterOffset = quaterOffset - integerPart;
            currentQuaterNote = 0;

            while(beatOffset > 0){
                beatOffset -= 0.25;
                currentQuaterNote++;
                if (currentQuaterNote == 4){currentQuaterNote = 0;}
            }

            this.nextNoteTime = this.app.audioCtx.currentTime+(quatersPerSecond-quatersPerSecond*quaterOffset);
            this.timerWorker.postMessage("start");
        } else {
            this.timerWorker.postMessage("stop");
        }
    },

    nextNote:function(metro){                                    //Advance current note and time by a quater note...
        var secondsPerBeat = 60.0 / metro.app.tempo;    //Notice this picks up the CURRENT tempo value to calculate beat length.
        metro.nextNoteTime += secondsPerBeat;           //Add beat length to last beat time

        currentQuaterNote++;                                //Advance the beat number, wrap to zero
        if (currentQuaterNote == 4) {currentQuaterNote = 0;}
    },

    scheduleNote:function(beatNumber, time, metro){    //create an oscillator
        var osc = metro.app.audioCtx.createOscillator();
        osc.connect( metro.app.audioCtx.destination );
        if (beatNumber % 16 == 0){               //beat 0 = high pitch
            osc.frequency.value = 880.0;
        }else{                                    //other notes = low pitch
            osc.frequency.value = 440.0;
        }
        osc.start(time);
        osc.stop(time + metro.noteLength);
    },

    scheduler:function(metro){ //while there are notes that will need to play before the next interval, schedule them and advance the pointer.
        while (metro.nextNoteTime < metro.app.audioCtx.currentTime + metro.scheduleAheadTime) {
            this.scheduleNote(currentQuaterNote, metro.nextNoteTime, metro);
            this.nextNote(metro);
        }
    },

    init:function(metro){
        metro.timerWorker = new Worker("js/metronomeworker.js");
        metro.timerWorker.onmessage = function(e) {if (e.data == "tick") {metro.scheduler(metro);}};
        metro.timerWorker.postMessage({"interval":metro.lookahead});
    }
}
