//--------------------------------------App Object-----------------------------------//
function App(){
    //--------------------------Code to make class Singleton-------------------------//
    if (arguments.callee._singletonInstance)
        return arguments.callee._singletonInstance;
        arguments.callee._singletonInstance = this;

    //-----------------------------------Variables-----------------------------------//
    this.trackObjects = [];

    //-----------------------------Variables for Drawing-----------------------------//
    this.waveformColumn = 0;
    this.timebarColumn = 0;
    this.currentTimebarLocation = 0;
    this.currentWaveformObject;

    //Variable for scaling
    this.scaling = 1;

    //Variables for Timedisplay
    this.currentTimeOffset = 0;
    this.timeCounter = 1;
    this.currentSeconds = 0;
    this.currentMinutes = 0;
    this.currentHours = 0;
    this.currentQuaters = 1;
    this.currentBeats = 1;

    //------------------------------Variables for Audio------------------------------//
    this.audioCtx;
    this.sourceNode;
    this.analyserNode;
    this.analyserNode2;
    this.mainGainNode;
    this.downloadGainNode;
    this.javascriptNode;
    this.recorder;
    this.downloadRecorder;
    this.recording = false;
    this.playing = false;
    this.click = false;
    this.cut = false;
    this.help = true;
    this.showText = false;
    this.anySolo = false;
    this.mute = false;
    this.metronome;

    //--------------------------Variables for keeping track--------------------------//
    this.trackID = 01;
    this.activeTrackId = 01;
    this.tempo = 120.0;
    this.fullscreenMode = false;
    this.downloading = false;
    this.downloadMute = false;

    //-----------------------------------Functions-----------------------------------//
    //-------------Function for creating new Track and all its elements--------------//
    this.createTrack = function(app){
        var newTrackObject = new TrackObject(this.trackID);
        this.trackObjects.push(newTrackObject);
        newTrackObject.init(app, newTrackObject);
        this.trackID++;
    };

    //------------------------Function to create a new waveform-----------------------//
    this.createWaveform = function(id, app){
        var newWaveformObject = new WaveformObject(app.trackObjects[id]);
        this.currentWaveformObject = newWaveformObject;
        this.currentWaveformObject.init(id, app);
    };

    //--------------------------------Audio Functions---------------------------------//
    //---------------------------Setting up the Audio Nodes---------------------------//
    this.initAudioGraph = function(stream, app) {
        app.audioCtx = new AudioContext;
        app.javascriptNode = app.audioCtx.createScriptProcessor(2048, 1, 1);

        app.sourceNode = app.audioCtx.createMediaStreamSource(stream);
        app.mainGainNode = app.audioCtx.createGain();
        app.downloadGainNode = app.audioCtx.createGain();
        app.analyserNode = app.audioCtx.createAnalyser();
        app.analyserNode.smoothingTimeConstant = 0.7;
        app.analyserNode.fftSize = 1024;
        app.analyserNode2 = app.audioCtx.createAnalyser();
        app.analyserNode2.smoothingTimeConstant = 0.7;
        app.analyserNode2.fftSize = 1024;
        app.splitter = app.audioCtx.createChannelSplitter(2);
        app.recorder = new Recorder(app.sourceNode);
        app.downloadRecorder = new Recorder(app.mainGainNode);

        app.sourceNode.connect(app.splitter);
        app.splitter.connect(app.analyserNode,0,0);
        if (navigator.userAgent.toLocaleLowerCase().indexOf("firefox") > -1){
            app.splitter.connect(app.analyserNode2,0,0);
        }else{
            app.splitter.connect(app.analyserNode2,1,0);
        }
        app.analyserNode.connect(app.javascriptNode);
        app.javascriptNode.connect(app.audioCtx.destination);
        app.mainGainNode.connect(app.downloadGainNode);
        app.downloadGainNode.connect(app.audioCtx.destination);

        this.initialize(app);
        this.whileInput(app);
    };

    //------------------------Actions for the javascriptNode--------------------------//
    this.whileInput = function(app){
        this.javascriptNode.onaudioprocess = function() {
            app.currentTime = app.audioCtx.currentTime;
            window.requestAnimationFrame(function(){app.trackObjects[0].drawFrequencies(app);});
            if (app.playing == true || app.recording == true){
                app.extendProject();
                app.focusTimeline();
                app.moveTimeLine(app.timebarColumn + app.currentTimebarLocation);
                app.timebarColumn++;
                app.calculateTime();
                if (app.playing == true){app.startSounds();}
                if (app.downloading == true){app.checkDownload(app);}
                if (app.recording == true){window.requestAnimationFrame(function(){app.currentWaveformObject.drawWaveform(app);}); app.startSounds();}
            }
        }
    };

    //----------------------------Function for rec button-----------------------------//
    this.startRecording = function(app) {
        if (this.recording == false){
            this.playClick(app);

            this.waveformColumn=0;
            this.timebarColumn = 0;

            if(this.playing == true){
                this.playing = false;
                this.playPauseIcon();
            }

            //set the currentTimebarLocation variable to the current timebar location
            this.currentTimebarLocation = document.getElementById("timeline").offsetLeft;

            document.getElementById("rec").style.background = "red";
            document.getElementById("rec_icon_container").style.background = "rgba(41, 82, 255, 0.7)";

            this.timeCounter = 1;
            this.currentTimeOffset = this.audioCtx.currentTime - ((this.currentTimebarLocation/21.5)%1);

            //create the waveformcanvas to draw in
            var currentIndex;
            for (var i = 0; i < this.trackObjects.length; i++){
                if (this.trackObjects[i].id == this.activeTrackId){
                    currentIndex = i;
                }
            }
            this.createWaveform(currentIndex, app);

            //start the magic (start writing audio data into an sound buffer array/blob)
            this.recorder.record();

            //set recording to true
            this.recording = true;


        }else{
            this.stopWhileRecording(app);
        }
    };

    //---------------------------Function for stop button-----------------------------//
    this.stopRecording = function(app) {
        if (this.recording == true){
            this.stopWhileRecording(app);
        }else{
            if (this.playing == true){
                this.playClick(app);
                document.getElementById("frequency" + this.activeTrackId).style.backgroundColor = "rgba(255, 255, 255, 0.7)";
                document.getElementById("track_volume_text" + this.activeTrackId).style.backgroundColor = "rgba(255, 255, 255, 0.7)";
                this.playing = false;
                this.playPauseIcon();
                this.stopAllSounds();
            }
            this.timebarColumn=0;
            this.waveformColumn=0;
            this.currentTimebarLocation = 0;
            this.moveTimeLine(this.timebarColumn + this.currentTimebarLocation);
            this.currentMinutes = 0;
            this.currentHours = 0;
            this.currentQuaters = 1;
            this.currentBeats = 1;
            this.displayTime(0);
        }
        document.getElementById("scrollable_container").scrollLeft = 0;

        for (var i = 0; i < this.trackObjects.length; i++){
            for (var j = 0; j < this.trackObjects[i].waveformArray.length; j++){
                this.trackObjects[i].waveformArray[j].played = false;
            }
        }
    };

    //-------------------------Function for play/play button--------------------------//
    this.playRecording = function(app) {
            if (this.recording == true){
                this.stopWhileRecording(app);
            }else{
                if (this.playing == false) {
                    document.getElementById("frequency" + this.activeTrackId).style.backgroundColor = "rgba(255, 255, 255, 0.3)";
                    document.getElementById("track_volume_text" + this.activeTrackId).style.backgroundColor = "rgba(255, 255, 255, 0.3)";
                    this.currentTimebarLocation = document.getElementById("timeline").offsetLeft;
                    this.timeCounter = 1;
                    this.currentTimeOffset = this.audioCtx.currentTime - ((this.currentTimebarLocation/21.5)%1);
                    this.startCurrentSounds();
                }else{
                    document.getElementById("frequency" + this.activeTrackId).style.backgroundColor = "rgba(255, 255, 255, 0.7)";
                    document.getElementById("track_volume_text" + this.activeTrackId).style.backgroundColor = "rgba(255, 255, 255, 0.7)";
                    this.stopAllSounds();

                }
                this.timebarColumn=0;
                this.playing = !this.playing;
                this.playPauseIcon();
                this.playClick(app);
            }
    };

    //---------------------------Function to stop recording---------------------------//
    this.stopWhileRecording = function(app){
        //set the icon to black
        document.getElementById("rec").style.background = "#555";
        document.getElementById("rec_icon_container").style.background = "rgba(255, 255, 255, 0.7)";

        //if click is on while recoding turn it off
        this.playClick(app);
        this.stopAllSounds();

        //if recording stop the magic (stop writing audio data into the sound buffer aray/blob)
        this.recorder.stop();

        //call function to add recorded sound buffer to the audio context
        this.currentWaveformObject.createWaveformBuffer(app);

        //clear the sound buffer
        this.recorder.clear();

        //reset the column counter for drawing and set recording to false
        this.waveformColumn=0;
        this.timebarColumn=0;
        this.recording = false;
        this.playing = false;
    };

    //---------------Function to keep starting sounds at current position-------------//
    this.startSounds = function(){
        var timelinePosition = document.getElementById("timeline").offsetLeft-5;

        //go over each track
        for (var i = 0; i < this.trackObjects.length; i++){

            //go over each waveform
            for (var j = 0; j < this.trackObjects[i].waveformArray.length; j++){

                //get the left and right position of the waveform
                var waveformPositionLeft = this.trackObjects[i].waveformArray[j].startPosition;
                var waveformPositionRight = this.trackObjects[i].waveformArray[j].stopPosition;

                //when the timeline reaches the left position of the waveform,
                //create an AudioBufferSourceNode and play it and add it to the waveformArray,
                //also check if there are waveforms dragged over each other
                if (timelinePosition == waveformPositionLeft){
                    var highest = true;
                    //go over all waveforms of the track
                    for (var k = 0; k < this.trackObjects[i].waveformArray.length; k++){
                        //check if the waveform is on the same position as the wavefrom that is about to start
                        if (waveformPositionLeft > this.trackObjects[i].waveformArray[k].startPosition &&
                           waveformPositionLeft < this.trackObjects[i].waveformArray[k].stopPosition){
                            //check if the waveform is not the same as the one we're trying to start
                            if (this.trackObjects[i].waveformArray[k].reference != this.trackObjects[i].waveformArray[j].reference){
                                //check if the waveform we're trying to start is the one "on top" (with the highest z-Index)
                                if (this.trackObjects[i].waveformArray[k].reference.style.zIndex >
                                    this.trackObjects[i].waveformArray[j].reference.style.zIndex){
                                    highest = false;
                                }
                            }
                        }
                    }
                    //play the waveform only if it is the one on top (highest z-Index) and stop all other waveform currently playing
                    if (highest == true){
                        this.stopCurrentTrackSounds(i);
                        this.playSound(i,j,0);
                    }
                }

                //when the timeline reaches the right position of the waveform, stop the AudioBufferSourceNode,
                //disconnect it from the Audiocontext and remove it from the Waveformarray,
                //also check if there are waveforms dragged over each other
                if (timelinePosition == waveformPositionRight){
                    if (this.trackObjects[i].waveformArray[j].playing == true){
                        this.stopSound(i,j);
                        var underlying = false;

                        for (var k = 0; k < this.trackObjects[i].waveformArray.length; k++){
                            //check if there is any waveform under the waveform wer're about to stop
                            if (waveformPositionRight > this.trackObjects[i].waveformArray[k].startPosition &&
                               waveformPositionRight < this.trackObjects[i].waveformArray[k].stopPosition){
                                //check if the found waveform is not the same one we're trying to stop
                                if (this.trackObjects[i].waveformArray[k].reference != this.trackObjects[i].waveformArray[j].reference){
                                    //check if the found waveform is underlying the current waveform (via z-Index)
                                    if (this.trackObjects[i].waveformArray[k].reference.style.zIndex <
                                        this.trackObjects[i].waveformArray[j].reference.style.zIndex){
                                        underlying = true;
                                    }
                                }
                            }
                        }
                        //if there is a waveform lying under the currently played waveform, on stop continue playing the underlying one
                        if (underlying == true){
                            this.startCurrentTrackSounds(i);
                        }
                    }
                }
            }
        }
    };

    //----------------------Function to start all current Sounds----------------------//
    this.startCurrentSounds = function(){
        //go over each track
        for (var i = 0; i < this.trackObjects.length; i++){
            this.startCurrentTrackSounds(i);
        }
    };

    //------------------Function to start each tracks current sound-------------------//
    this.startCurrentTrackSounds = function(i){
        var timelinePosition = document.getElementById("timeline").offsetLeft;

        //go over each waveform
        for (var j = 0; j < this.trackObjects[i].waveformArray.length; j++){

            //get the left and right position of the waveform
            var waveformPositionLeft = this.trackObjects[i].waveformArray[j].startPosition;
            var waveformPositionRight = this.trackObjects[i].waveformArray[j].stopPosition;

            if (timelinePosition > waveformPositionLeft && timelinePosition < waveformPositionRight){
                var waveformWidth = waveformPositionRight - waveformPositionLeft;
                var positionPercent = (timelinePosition - waveformPositionLeft)/waveformWidth;
                var audioBufferDuration = this.trackObjects[i].waveformArray[j].audioBuffer.duration;

                this.playSound(i, j, audioBufferDuration*positionPercent);

            }
        }
    };

    //----------------------------Function to play a sound----------------------------//
    this.playSound = function(trackId, waveformId, offset){
        var audioBuffer = this.trackObjects[trackId].waveformArray[waveformId].audioBuffer;
        this.trackObjects[trackId].waveformArray[waveformId].playing = true;
        var newSource = this.audioCtx.createBufferSource();

        this.trackObjects[trackId].play[0] = true;
        this.trackObjects[trackId].play[1] = waveformId;

        newSource.buffer = audioBuffer;
        newSource.connect(this.trackObjects[trackId].gainNode);
        newSource.start(0, offset);

        this.trackObjects[trackId].waveformArray[waveformId].bufferSource = newSource;
    };

    //--------------------------Function to stop all sounds---------------------------//
    this.stopAllSounds = function(){
        for (var i = 0; i < this.trackObjects.length; i++){
            this.stopCurrentTrackSounds(i);
        }
    };

    //-----------------------Function to stop each tracks sounds----------------------//
    this.stopCurrentTrackSounds = function(i){
        for (var j = 0; j < this.trackObjects[i].waveformArray.length; j++){
            if (this.trackObjects[i].waveformArray[j].bufferSource != null){
                this.stopSound(i,j);
            }
        }
    };

    //----------------------------Function to stop a sound----------------------------//
    this.stopSound = function(trackId,waveformId){
        var bufferSource = this.trackObjects[trackId].waveformArray[waveformId].bufferSource;
        this.trackObjects[trackId].waveformArray[waveformId].playing = false;
        this.trackObjects[trackId].waveformArray[waveformId].played = true;
        bufferSource.stop(0);
        bufferSource.disconnect();
        this.trackObjects[trackId].waveformArray[waveformId].bufferSource = null;
        this.trackObjects[trackId].play[0] = false;
        this.trackObjects[trackId].play.pop();
    };

    //-------------------------Function to download recording-------------------------//
    this.download = function(app){
        //only execute if anything is recorded
        var temp = 0;
        for (var i = 0; i < this.trackObjects.length; i++){
            for (var j = 0; j < this.trackObjects[i].waveformArray.length; j++){
                temp++;
            }
        }


        if(temp > 0){
            this.downloading = !(this.downloading);

            if (this.downloading == true){
                //reset the playing position, start recording and playback the project
                this.stopRecording(app);
                this.downloadRecorder.record();
                this.playing = true;

            }else if (this.downloading == false){
                this.stopRecording(app);
                this.downloadRecorder.stop();
                this.downloadRecorder.download(document.getElementById("project_name").value);
                this.downloadRecorder.clear();
                this.help = false;

                var downloadArrow = document.createElement("div");
                downloadArrow.id = "download_arrow";
                downloadArrow.className = "arrow_icon";

                var downloadText = document.createElement("div");
                downloadText.id = "download_text";
                downloadText.className = "help_text";
                downloadText.innerHTML = "<p>Your file is ready and being downloaded</p>";

                var downloadReadyContainer = document.createElement("div");
                downloadReadyContainer.id = "download_ready_container";

                downloadReadyContainer.appendChild(downloadArrow);
                downloadReadyContainer.appendChild(downloadText);
                document.body.appendChild(downloadReadyContainer);
            }
        }
    };

    this.checkDownload = function(app){
        var anyPlay = false;
        //go over each tracks waveforms and see if there is any left to play
        for (var i = 0; i < this.trackObjects.length; i++){
            for (var j = 0; j < this.trackObjects[i].waveformArray.length; j++){
                if (this.trackObjects[i].waveformArray[j].played == false) {anyPlay = true;}
            }
        }

        if (anyPlay == false) {this.playing = false; this.download(app);}
    };

    //-------------------Function to mute/unmute the master volume-------------------//
    this.muting = function(muteVariable, muteIconContainer, muteIcon, gainNode, slider){
        this.muteVariable = !this.muteVariable;
        if (this.muteVariable == true){
            gainNode.gain.value = 0;
            muteIcon.className = "mute";
            muteIconContainer.style.background = "rgba(41, 82, 255, 0.7)";
        }else if(this.muteVariable == false){
            muteIcon.className = "volume";
            muteIconContainer.style.background = "rgba(255, 255, 255, 0.7)";
            gainNode.gain.value = slider.value;
        }
    };

    //----------------------Function to set the cutting listener---------------------//
    this.cutWaveformActive = function(){
        document.body.style.cursor = "crosshair";
        this.cut = true;
        document.getElementById("cut1").className = "cutHighlighted1";
        document.getElementById("cut2").className = "cutHighlighted2";
        document.getElementById("cut_icon_container").style.background = "rgba(41, 82, 255, 0.7)";
    };

    //---------------------------Function to cut waveform----------------------------//
    this.cutWaveform = function(target, targetId, targetX, app){
        var clickedId = targetId;
        if (targetId != undefined) {
            var waveformName = clickedId.replace(/[0-9]/g, '');

        //when cutting is active and clicked element is a waveform execute cutting
        if (waveformName == "waveform"){
            var waveformNum = clickedId.replace(/[a-z]/g, '');
            var clickedTrackId = clickedId.charAt(8);
            var currentWaveformCount = String(waveformNum).substr(1);
            var waveformAudioBuffer;
            var currentIndex;
            for (var i = 0; i < this.trackObjects.length; i++){
                if (this.trackObjects[i].id == clickedTrackId){
                    currentIndex = i;
                }
            }

            //get the audio buffer of cutted waveform, go over the waveformArray
            for (var i = 0; i < this.trackObjects[currentIndex].waveformArray.length; i++){
                //compare the waveformCounts/numbers of each waveformarray in the array with
                //the correct waveformCount of the clicked waveform
                if (this.trackObjects[currentIndex].waveformArray[i].id == currentWaveformCount){
                    //when found save the AudioBuffer in variable
                    waveformAudioBuffer = this.trackObjects[currentIndex].waveformArray[i].audioBuffer;

                }
            }

            var x = targetX;
            var fullWaveformCanvas = target;
            var boundingRect = fullWaveformCanvas.getBoundingClientRect();

            //get position of click on clicked waveform
            x -= boundingRect.left;

            //create new left waveform
            var newWaveformLeft = document.createElement("canvas");
            var newWaveformLeftCtx = newWaveformLeft.getContext("2d");
            newWaveformLeft.className = "waveform"
            newWaveformLeft.id = clickedId + "1";
            newWaveformLeft.height = 110;
            newWaveformLeft.width = x;
            newWaveformLeft.style.left =  fullWaveformCanvas.style.left;
            document.getElementById("waveform_container" + this.trackObjects[currentIndex].id).appendChild(newWaveformLeft);

            //create left waveform object and add to track
            var newWaveformLeftObject = new WaveformObject(this.activeTrackId);
            newWaveformLeftObject.id = newWaveformLeft.id.slice(9);
            newWaveformLeftObject.reference = newWaveformLeft;
            newWaveformLeftObject.startPosition = newWaveformLeft.offsetLeft;
            newWaveformLeftObject.stopPosition = newWaveformLeft.offsetLeft + newWaveformLeft.width;
            newWaveformLeftObject.length = newWaveformLeftObject.stopPosition - newWaveformLeftObject.startPosition;
            newWaveformLeftObject.audioBuffer = waveformAudioBuffer;
            newWaveformLeftObject.colorWaveform(newWaveformLeft, currentIndex, app);
            newWaveformLeftObject.addWaveformDeleteButton(newWaveformLeft, app, newWaveformLeftObject);

            var activeIndex;
            for (var i = 0; i < this.trackObjects.length; i++){
                if (this.trackObjects[i].id == this.activeTrackId){
                    activeIndex = i;
                }
            }
            this.trackObjects[activeIndex].waveformArray.push(newWaveformLeftObject);

            //create new right waveform
            var newWaveformRight = document.createElement("canvas");
            var newWaveformRightCtx = newWaveformRight.getContext("2d");
            newWaveformRight.className = "waveform"
            newWaveformRight.id = clickedId + "2";
            newWaveformRight.height = 110;
            newWaveformRight.width = fullWaveformCanvas.width - x;
            newWaveformRight.style.left = fullWaveformCanvas.offsetLeft + x + "px";
            document.getElementById("waveform_container" + this.trackObjects[currentIndex].id).appendChild(newWaveformRight);

            //create new audiobuffer for right waveform and fill it with
            //the length of the cutted waveform (left waveform can always use the existing audiobuffer)
            var tempBufferArray0 = waveformAudioBuffer.getChannelData(0);
            var tempBufferArray1 = waveformAudioBuffer.getChannelData(1);

            //get the starting offset percentage of the right array and cut the tempbufferarray from the beginning to that point
            var audioBufferRightOffset = x / fullWaveformCanvas.width;
            var sliceStart = Math.round(tempBufferArray0.length * audioBufferRightOffset);
            tempBufferArray0 = tempBufferArray0.subarray(sliceStart);
            tempBufferArray1 = tempBufferArray1.subarray(sliceStart);

            var audioBufferRight = this.audioCtx.createBuffer(2, tempBufferArray0.length, this.audioCtx.sampleRate);
            audioBufferRight.copyToChannel(tempBufferArray0, 0)
            audioBufferRight.copyToChannel(tempBufferArray1, 1)

            //create right waveform object and add to track
            var newWaveformRightObject = new WaveformObject(this.trackObjects[activeIndex].id);
            newWaveformRightObject.id = newWaveformRight.id.slice(9);
            newWaveformRightObject.reference = newWaveformRight;
            newWaveformRightObject.startPosition = newWaveformRight.offsetLeft;
            newWaveformRightObject.stopPosition = newWaveformRight.offsetLeft + newWaveformRight.width;
            newWaveformRightObject.length = newWaveformRightObject.stopPosition - newWaveformRightObject.startPosition;
            newWaveformRightObject.audioBuffer = audioBufferRight;
            newWaveformRightObject.colorWaveform(newWaveformRight, currentIndex, app);
            newWaveformRightObject.addWaveformDeleteButton(newWaveformRight, app, newWaveformRightObject);
            this.trackObjects[activeIndex].waveformArray.push(newWaveformRightObject);

            //draw the left and right part of the original canvas into the new left and right canvas
            newWaveformLeftCtx.drawImage(fullWaveformCanvas, 0, 0,
                                         newWaveformLeft.width, newWaveformLeft.height, 0, 0,
                                         newWaveformLeft.width, newWaveformLeft.height);
            newWaveformRightCtx.drawImage(fullWaveformCanvas, x, 0,
                                          newWaveformRight.width, newWaveformRight.height, 0, 0,
                                          newWaveformRight.width, newWaveformRight.height);

            //call function to make new waveforms draggable
            newWaveformRightObject.makeWaveformDraggable(app);

            //delete original waveformcanvas
            var waveformContainer = document.getElementById("waveform_container" + clickedTrackId);
            waveformContainer.removeChild(fullWaveformCanvas);

            //set cut variable to false (cutting is done) and cursor back to auto
            document.body.style.cursor = "auto";
            this.cut = false;
            document.getElementById("cut1").className = "cut1";
            document.getElementById("cut2").className = "cut2";
            document.getElementById("cut_icon_container").style.background = "rgba(255, 255, 255, 0.7)";

            //delete original waveform from waveformarray
            for (var i = 0; i < this.trackObjects[currentIndex].waveformArray.length; i++){

                if (this.trackObjects[currentIndex].waveformArray[i].reference == fullWaveformCanvas){
                    this.trackObjects[currentIndex].waveformArray.splice(i, 1);
                    break;
                }
            }
        }else if (clickedId != "cut_icon_container" && clickedId != "cut1" && clickedId != "cut2"){
            document.body.style.cursor = "auto";
            this.cut = false;
            document.getElementById("cut1").className = "cut1";
            document.getElementById("cut2").className = "cut2";
            document.getElementById("cut_icon_container").style.background = "rgba(255, 255, 255, 0.7)";
        }
        }
    };

    //-----------Function to activate the metronome on playback or record------------//
    this.clickOnOff = function(app){
        this.click = !this.click;
        if (this.playing == true || this.recording == true ){
                app.metronome.playMetronome(app.metronome);
        }

        if (this.click == true){
            document.getElementById("clock").className = "clockHighlighted";
            document.getElementById("clock_icon_container").style.background = "rgba(41, 82, 255, 0.7)";
        }else if (this.click == false){
            document.getElementById("clock").className = "clock";
            document.getElementById("clock_icon_container").style.background = "rgba(255, 255, 255, 0.7)";
        }
    };

    this.playClick = function(app){
        if (this.click == true){app.metronome.playMetronome(app.metronome);}
    };

    //----------------Function to change the play/pause button icon------------------//
    this.playPauseIcon = function(){
        var playPauseButton = document.getElementById("play");
        if(this.playing == true){
            playPauseButton.style.width = "2px";
            playPauseButton.style.height = "14px";
            playPauseButton.style.border = "4px solid white";
            playPauseButton.style.borderTop = "none";
            playPauseButton.style.borderBottom = "none";
            playPauseButton.style.margin = "11px 0 0 13px";
            document.getElementById("play_icon_container").style.background = "rgba(41, 82, 255, 0.7)";
        }else if (this.playing == false){
            playPauseButton.style.width = "0px";
            playPauseButton.style.height = "0px";
            playPauseButton.style.borderStyle = "solid";
            playPauseButton.style.borderColor = "transparent transparent transparent #555";
            playPauseButton.style.borderWidth = "8px 8px 8px 12px";
            playPauseButton.style.margin = "10px 0 0 14px";
            document.getElementById("play_icon_container").style.background = "rgba(255, 255, 255, 0.7)";
        }
    };

    //------------------Function to enable/disable fullscreen mode-------------------//
    this.fullscreen = function(){
        var element = document.documentElement;

        if (this.fullscreenMode == false){
             var docElm = document.documentElement;
                if (docElm.requestFullscreen) {
                    docElm.requestFullscreen();
                }
                else if (docElm.msRequestFullscreen) {
                    docElm.msRequestFullscreen();
                }
                else if (docElm.mozRequestFullScreen) {
                    docElm.mozRequestFullScreen();
                }
                else if (docElm.webkitRequestFullScreen) {
                    docElm.webkitRequestFullScreen();
                }

                document.body.style.backgroundSize =  "auto, cover, cover";
        }else{
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
                else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                }
                else if (document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                }
        }
        this.fullscreenMode = !this.fullscreenMode;
    };

    //--------------Function to add a zero to a number smaller than 10----------------//
    this.addZero = function(n){
        return n > 9 ? "" + n: "0" + n;
    };

    //-----------------------Function to change the scale/zoom------------------------//
    this.changeScale = function(factor){
        this.scaling = factor;
        this.drawTimebar(this.tempo);
        this.drawGridLines(this.tempo);
        this.createGridLines();
        document.getElementById("timeline").style.width = (2/this.scaling) + "px";

        var scalableContainer = document.getElementById("draggable_container")

        scalableContainer.style.webkitTransform = "scaleX("+factor+")";
        scalableContainer.style.transform = "scaleX("+factor+")";
        scalableContainer.style.WebkitTransformOrigin = "left";
        scalableContainer.style.transformOrigin = "left";
    };

    //------------------------Function to reset the scale/zoom------------------------//
    this.resetScale = function(){
        document.getElementById("scale_slider").value = 1;
        this.changeScale(1);
    };

    //-----------------------Function to open/close help screen------------------------//
    this.openCloseModalDialog = function(targetId, app){
        if (targetId != "logo_container" &&
            targetId != "download_mute_container" &&
            targetId != "download_icon_container" &&
            targetId != "download_volume" &&
            targetId != "download_volume_slider"){

            this.help = !this.help;
            if (this.help == false){
                if (targetId != "init" && document.getElementById("logo_container1") == null){
                    this.addLogo(app);
                    document.getElementById("overlay_title").style.opacity = "1";
                    document.getElementById("help_controls_container").style.height = "395px";
                }
                document.getElementById("overlay").style.visibility = "visible";
                document.getElementById("logo").style.visibility = "visible";
                document.getElementById("overlay_title").style.visibility = "visible";
                document.getElementById("logo_container1").style.visibility = "visible";
                document.getElementById("logo_container").style.visibility = "visible";
                document.getElementById("main_container").style.webkitFilter = "blur(10px)";
                document.getElementById("main_container").style.filter = "blur(10px)";
                if(targetId == "help_icon_container" || targetId == "help1" || targetId == "help2"){
                    document.getElementById("help_controls_container").style.opacity = "1";
                }
                this.showText = true;
                this.showingText("init");
            }else if (this.help == true && this.downloading == false){
                this.removeLogo();
                document.getElementById("help_controls_container").style.opacity = "0";
                document.getElementById("help_controls_container").style.height = "0px";
                document.getElementById("overlay").style.visibility = "hidden";
                document.getElementById("main_container").style.webkitFilter = "blur(0px)";
                document.getElementById("main_container").style.filter = "blur(0px)";
            }

            if (targetId == "download" ||targetId == "download_icon_container"){

                var downloadMuteContainer = document.createElement("div");
                downloadMuteContainer.id = "download_mute_container";

                var downloadMuteIconContainer = document.createElement("div");
                downloadMuteIconContainer.id = "download_mute_icon_container";
                downloadMuteIconContainer.className = "icon_container";

                var downloadMute = document.createElement("div");
                downloadMute.id = "download_volume";
                downloadMute.className = "volume";

                var downloadVolume = document.createElement("input");
                downloadVolume.type = "range";
                downloadVolume.className = "slider";
                downloadVolume.id = "download_volume_slider";
                downloadVolume.min = "0";
                downloadVolume.max = "1";
                downloadVolume.step = "any";
                downloadVolume.value = ".8";

                var downloadText = document.createElement("div");
                downloadText.id = "download_screen_text";
                downloadText.innerHTML = "<p>Your recorded files are being prepared for downloading. This is going to take a little while. You can hear your Project while it is being prepared or mute it.</p>";

                downloadMuteIconContainer.appendChild(downloadMute);
                downloadMuteContainer.appendChild(downloadText);
                downloadMuteContainer.appendChild(downloadMuteIconContainer);
                downloadMuteContainer.appendChild(downloadVolume);
                document.getElementById("logo_container1").appendChild(downloadMuteContainer);
                downloadVolume.addEventListener('input', function() {app.downloadGainNode.gain.value = this.value;});
                downloadMuteIconContainer.addEventListener("click", function() {app.muting(app.downloadMute, downloadMuteIconContainer, downloadMute, app.downloadGainNode, downloadVolume)});
            }

        }
    };

    //-----------------------Function to show/hide logo info text----------------------//
    this.showingText = function(targetId){
            this.showText = !this.showText;
            if (this.showText == true){
                document.getElementById("logo").style.visibility = "hidden";
                document.getElementById("logo_text").style.visibility = "visible";
                document.getElementById("logo_container").style.backgroundColor = "rgba(41, 82, 255, 0.8)";

            }else if (this.showText == false){
                document.getElementById("logo").style.visibility = "visible";
                document.getElementById("logo_text").style.visibility = "hidden";
                document.getElementById("logo_container").style.backgroundColor = "rgba(255, 255, 255, 0.8)";
            }

    };

    //------Function to extend the project if timeline runs further than border-------//
    this.extendProject = function(){
        var timeLinePosition = document.getElementById("timeline").style.left.replace(/[^0-9]/g,'') - 254.0;
        var scalableWidth = document.getElementById("scalable_container").offsetWidth;
        var timebarWidth = document.getElementById("timebar").width;

        if(timeLinePosition+10 >= timebarWidth){
            document.getElementById("timebar").width = timebarWidth + 2;
            this.drawTimebar(this.tempo);
            document.getElementById("scalable_container").style.width = scalableWidth + 2 + "px";
        }
    };

    //--------Function to keep timeline in focus when running out of the screen-------//
    this.focusTimeline = function(){
        var rect = document.getElementById("timeline").getBoundingClientRect();
        var timeLinePosition = rect.left;

        if(Math.round(timeLinePosition/document.getElementById("scale_slider").value) >= (window.innerWidth-10)){
            document.getElementById("scrollable_container").scrollLeft += 2;
        }
    };

    //---------------------------------Visualization Functions-------------------------------//
    //------------------------------Function to clear any canvas-----------------------------//
    this.clearCanvas = function(inputCanvas) {
        inpCvs = inputCanvas.getContext("2d");
        inpCvs.clearRect(0, 0, inputCanvas.width, inputCanvas.height);
    };

    //------------------------------Timebar visualization Function---------------------------//
    this.drawTimebar = function(speed){
        var tb = document.getElementById("timebar");
        var timebar = tb.getContext("2d");
        var secondsPerBeat = 60.0 / speed;
        var pixelBeat = Math.round(21.5*secondsPerBeat*this.scaling);
        var quaterCounter = 0;
        var beatCounter = 1;

        this.clearCanvas(tb);

        for (var i = 0; i < tb.width; i++) {
            if (i%pixelBeat == 0){
                quaterCounter++;
                if (quaterCounter == 1){
                    //draw all full notes and beat numbers
                    timebar.font="10px 'Source Sans Pro'";
                    timebar.fillStyle = "#555";
                    if(beatCounter < 10){
                        timebar.fillText(beatCounter,i-3,14);
                    }else if ((beatCounter >= 10 && beatCounter < 100)){
                        timebar.fillText(beatCounter,i-5,14);
                    }else if ((beatCounter >= 100)){
                        timebar.fillText(beatCounter,i-7,14);
                    }
                    timebar.beginPath();
                    timebar.moveTo(i,0);
                    timebar.lineTo(i,5);
                    timebar.strokeStyle="black";
                    timebar.stroke();
                    timebar.beginPath();
                    timebar.moveTo(i,20);
                    timebar.lineTo(i,15);
                    timebar.strokeStyle="black";
                    timebar.stroke();
                    beatCounter++;
                }else if (pixelBeat >= 22){
                    //draw all half notes
                    timebar.beginPath();
                    timebar.moveTo(i,5);
                    timebar.lineTo(i,15);
                    timebar.strokeStyle="#990000";
                    timebar.stroke();
                }else if (pixelBeat >= 11 && quaterCounter == 3){
                    //draw all quaters
                    timebar.beginPath();
                    timebar.moveTo(i,5);
                    timebar.lineTo(i,15);
                    timebar.strokeStyle="#990000";
                    timebar.stroke();
                }
            }

            if (quaterCounter == 4){
                quaterCounter = 0;
            }
        }
    };

    //-------------------Function for clicking a new position on the timebar-----------------//
    this.clickTimebar = function(event, app){
        var rect = document.getElementById("timebar").getBoundingClientRect();
        var offsetLeft = rect.left + document.body.scrollLeft;

        var x = event.pageX;
        x -= offsetLeft;
        x = x-(5);

        //calculate scaling
        x = Math.round(x/document.getElementById("scale_slider").value);
        this.currentTimebarLocation = x;
        this.timebarColumn = 0;
        this.moveTimeLine(this.currentTimebarLocation);
        this.currentSeconds = 0;
        this.currentMinutes = 0;
        this.currentHours = 0;
        this.currentQuaters = 0;
        this.currentBeats = 1;

        var offset = document.getElementById("timeline").style.left.replace(/[^0-9]/g,'') - 254.0;
        var beatOffset = offset/(Math.round(4*22.0*60.0/this.tempo));

        while(beatOffset > 0){
            beatOffset -= 0.25;
            this.currentQuaters++;
            if (this.currentQuaters == 5){
                this.currentQuaters = 1;
                this.currentBeats++;
            }
        }
        if(this.playing == true || this.recording == true){this.playClick(app);this.playClick(app);}
        this.displayTime(Math.round((x+5)/22.0));
    };

    //------------------Function to move the timeline on playback/record---------------------//
    this.moveTimeLine = function(amount){
        var timeLinePosition = 259 + amount;
        document.getElementById("timeline").style.left = timeLinePosition + "px";
    };

    //------------------------Function to calculate time and display beats-------------------//
    this.calculateTime = function(){
        var currentTime = this.audioCtx.currentTime;
        currentTime -= this.currentTimeOffset;

        var offset = document.getElementById("timeline").style.left.replace(/[^0-9]/g,'') - 254.0;
        var quatersPerSecond = 60.0 / this.tempo;

        //call everytime the current beat is one quater ahead
        if (offset%Math.round(21.5*quatersPerSecond) == 0){
            if (this.currentQuaters >= 4){this.currentQuaters = 0; this.currentBeats++;}
            this.currentQuaters++;
            this.displayTime(this.currentSeconds);
        }

        //call everytime the current time is one second ahead
        if (currentTime >= this.timeCounter){
            this.timeCounter++;
            this.currentSeconds++;
            this.displayTime(this.currentSeconds);
        }
    };

    //---------------------------------Function to display time------------------------------//
    this.displayTime = function(seconds){
        this.currentSeconds = seconds;

        //if seconds are greater than 60, count one minute and reset seconds
        while(this.currentSeconds >= 60){
            this.currentSeconds -= 60;
            this.currentMinutes++;
        }

        //if minutes are greater than 60, count one hour and reset minutes
        while(this.currentMinutes >= 60){
            this.currentMinutes -= 60;
            this.currentHours++;
        }

        document.getElementById("current_time").innerHTML = this.addZero(this.currentHours) + ":" + this.addZero(this.currentMinutes) + ":" + this.addZero(this.currentSeconds) + " |" + this.currentBeats + ":" + this.currentQuaters;
    };

    //--------------------------------Function to draw grid lines----------------------------//
    this.drawGridLines = function(speed){
        var gridCanvas = document.getElementById("grid_canvas");
        var gridContext = gridCanvas.getContext("2d");
        gridCanvas.height = document.getElementById("grid_container").offsetHeight;

        this.clearCanvas(gridCanvas);

        var secondsPerBeat = 60.0 / speed;
        var pixelBeat = Math.round(21.5*secondsPerBeat*this.scaling);
        var quaterCounter = 0;
        var beatCounter = 1;

        for (var i = 0; i < gridCanvas.width; i++) {
            if (i%pixelBeat == 0){
                quaterCounter++;
                if (quaterCounter == 1){
                    //draw all full notes and beat numbers
                    gridContext.beginPath();
                    gridContext.moveTo(i,0);
                    gridContext.lineTo(i,gridCanvas.height);
                    gridContext.strokeStyle= "rgba(255, 255, 255, 0.3)";
                    gridContext.stroke();
                    beatCounter++;
                }else if (pixelBeat >= 14){
                    //draw all quaters
                    gridContext.beginPath();
                    gridContext.moveTo(i,20);
                    gridContext.lineTo(i,gridCanvas.height);
                    gridContext.strokeStyle= "rgba(255, 255, 255, 0.15)";
                    gridContext.stroke();
                }
            }

            if (quaterCounter == 4){
                quaterCounter = 0;
            }
        }
    };

    //-------------------------------Function to create grid lines---------------------------//
    this.createGridLines = function(){
        var gridContainer = document.getElementById("grid_container");
        var gridWidth = gridContainer.offsetWidth;
        var pixelBeat = Math.round(21.5*(60/this.tempo)*this.scaling);

        if (document.getElementById("tableY") != null){
            gridContainer.removeChild(document.getElementById("tableY"));
        }

        var tableElem = document.createElement('table');
        tableElem.id = "tableY";
        tableElem.className = "tableY";
        tableElem.style.height = document.getElementById("grid_container").offsetHeight + 12 + "px";
        var counter = 1;

        for (var i = 1; i <= gridWidth; i++){
            if (i%pixelBeat == 0 && counter == 4){
                colElem = document.createElement('td');
                colElem.className = "col1";
                tableElem.appendChild(colElem);
                if (pixelBeat <=  14){
                    colElem.style.padding = (2*pixelBeat)-2 + "px";
                }else{
                    colElem.style.padding = (pixelBeat/2)-2 + "px";
                }
            }
            counter++;
            if (counter == 5){counter = 0};
        }
        gridContainer.appendChild(tableElem);
    };

    //----------------------------------Function for key input-------------------------------//
    this.checkKey = function(e, app) {
        e = e || window.event;
        keyCode = e.keyCode;

        if (e.target.tagName.toLowerCase() != 'input'){
            /*play/pause*/ if (keyCode == 32){this.playRecording(app);}
            /*click*/ if (keyCode == 75){app.clickOnOff(app);}
            /*download*/ if (keyCode == 68){app.download(app); app.openCloseModalDialog("download", app);}
            /*cut*/ if (keyCode == 67){app.cutWaveformActive();}
            /*master mute*/ if (keyCode == 77){app.muting(app.mute, document.getElementById("masterVolume_icon_container"), document.getElementById("masterVolume"), app.mainGainNode, document.getElementById("main_volume"));}
            /*add track*/ if (keyCode == 65){app.createTrack(app);}
            /*fullscreen*/ if (keyCode == 70){app.fullscreen("button");}
            /*help*/ if (keyCode == 72){app.openCloseModalDialog("help1", app);}
            /*reset scale*/ if (keyCode == 82){app.startRecording(app);}
            /*reset scale*/ if (keyCode == 83){alert("yeah");}
        }
    };

    //-----------------------------------Function to add Logo--------------------------------//
    this.addLogo = function(app){
        var logoContainer1 = document.createElement("div");
        logoContainer1.id = "logo_container1";

        var logoContainer = document.createElement("div");
        logoContainer.id = "logo_container";

        var logo = document.createElement("div");
        logo.id = "logo";
        logo.innerHTML = "&#x00C6;";

        var overlayTitle = document.createElement("div");
        overlayTitle.id = "overlay_title";
        overlayTitle.innerHTML = "<h2>&#x00C6;ditor.</h2><h2>The Audio Editor and Music Production Software on the Web.</h2><p><br>- - - - - - - - - - - - - -<p>Developed by Jakob Sudau</p><h3>jakob.sudau@googlemail.com</h3><p>- - - - - - - - - - - -</p>";

        var logoText = document.createElement("div");
        logoText.id = "logo_text";
        logoText.innerHTML = "- no plugins<br>(okay, jQuery UI)<br><br>- 4000 lines of Code<br>(Web Audio native to Browsers)<br><br>- pure CSS, HTML & JavaScript<br>(super fast, also no images)<br><br>- client-based<br>(no servers)";
        logoText.style.visibility = "hidden";
        logoContainer.appendChild(logo);
        logoContainer.appendChild(logoText);
        logoContainer1.appendChild(logoContainer);
        logoContainer1.appendChild(overlayTitle);
        document.body.insertBefore(logoContainer1, document.body.childNodes[0]);
        logoContainer.addEventListener("mousedown", function (e){e.preventDefault(); app.showingText(e.target.id);});
        logoContainer1.addEventListener("click", function (e){e.preventDefault(); app.openCloseModalDialog(e.target.id, app);}, false);

    };

    //----------------------------------Function to remove Logo------------------------------//
    this.removeLogo = function(){
        document.body.removeChild(document.getElementById("logo_container1"));

        if(document.getElementById("download_ready_container") != null){
            document.body.removeChild(document.getElementById("download_ready_container"));
        }
    };

    //-------------------------------Function to highlight a track---------------------------//
    this.highlightTrack = function(id, value){
        var higherValue = value+0.1;

        var currentTrack = document.getElementById("waveform_container" + id);
        currentTrack.style.backgroundColor = "rgba(255, 255, 255, " + value +  ")";

        var currentTrackControls = document.getElementById("track_control" + id);
        currentTrackControls.style.backgroundColor = "rgba(255, 255, 255, " + higherValue +  ")";

        var currentFrequency = document.getElementById("frequency" + id);
        currentFrequency.style.backgroundColor = "rgba(255, 255, 255, " + value +  ")";

        document.getElementById("track_volume_text" + id).style.backgroundColor = "rgba(255, 255, 255, " + value +  ")";

        if (value == 0.3){
            document.getElementById("track_volume_text" + id).innerHTML = "0 dB";
            this.clearCanvas(currentFrequency);
        }
    };

    //--Starting the App by asking the user for microphone permission, adding initial Logo--//
    this.starting = function(app){
        //----------------------------Hack to handle vendor prefixes----------------------------//
        try {
            //window.URL = window.URL || window.webkitURL;
            navigator.getUserMedia = (navigator.getUserMedia       ||
                                      navigator.webkitGetUserMedia ||
                                      navigator.mozGetUserMedia);

            window.requestAnimFrame = (function(){
                            return  window.webkitRequestAnimationFrame ||
                                    window.mozRequestAnimationFrame    ||
                                    window.oRequestAnimationFrame      ||
                            function(callback, element){window.setTimeout(callback, 1000 / 60);};
                                    })();

            window.AudioContext = (function(){return window.AudioContext})();
        } catch (e) {
            alert('No web audio support in this browser!');
        }

        app.addLogo(app);
        navigator.getUserMedia({audio: true}, function(stream){app.initAudioGraph(stream, app);}, function(e) {});
    };

    //--------------------------------Function to initialize app-----------------------------//
    this.initialize = function(app){
        //--------------------------Main Container----------------------------//

        //--------------------------Main Container----------------------------//
        var mainContainer = document.createElement("div");
        mainContainer.id = "main_container";
        mainContainer.className = "fade";
        mainContainer.style.opacity = "1";

        //--------------------------Overlay Elements--------------------------//
        var overlay = document.createElement("div");
        overlay.id = "overlay";
        overlay.className = "overlay";

        var helpControlsContainer = document.createElement("div");
        helpControlsContainer.id = "help_controls_container";
        helpControlsContainer.style.opacity = "0";

        var helpTrackContainer = document.createElement("div");
        helpTrackContainer.id = "help_track_container";

        var helpTrackText = document.createElement("div");
        helpTrackText.id = "help_track_text";

        var crossIconContainer = document.createElement("div");
        crossIconContainer.id = "cross_icon_container0";
        crossIconContainer.className = "icon_container";

        var cross = document.createElement("div");
        cross.id = "cross0";
        cross.className = "cross";

        var helpTrackTextCross = document.createElement("div");
        helpTrackTextCross.className = "help_text";
        helpTrackTextCross.innerHTML = "<p>delete track</p>";

        var soloIconContainer = document.createElement("div");
        soloIconContainer.id = "solo_icon_container0";
        soloIconContainer.className = "icon_container";

        var solo = document.createElement("div");
        solo.id = "solo0";
        solo.className = "solo";

        var helpTrackTextSolo = document.createElement("div");
        helpTrackTextSolo.className = "help_text";
        helpTrackTextSolo.innerHTML = "<p>listen only to soloed track</p>";

        var micIconContainer = document.createElement("div");
        micIconContainer.id = "mic_icon_container0";
        micIconContainer.className = "icon_container";

        var mic = document.createElement("div");
        mic.id = "mic0";
        mic.className = "micOff";

        var holder = document.createElement("div");
        holder.id = "holder0";
        holder.className = "holderOff";

        var helpTrackTextMic = document.createElement("div");
        helpTrackTextMic.className = "help_text";
        helpTrackTextMic.innerHTML = "<p>switch microphone<br>playback on/off</p>";
        helpTrackTextMic.style.marginTop = "7px";
        helpTrackTextMic.style.marginBottom = "11px";

        var muteIconContainer = document.createElement("div");
        muteIconContainer.id = "mute_icon_container0";
        muteIconContainer.className = "icon_container";

        var mute = document.createElement("div");
        mute.id = "volume0";
        mute.className = "volume";

        var helpTrackTextMute = document.createElement("div");
        helpTrackTextMute.className = "help_text";
        helpTrackTextMute.innerHTML = "<p>mute track and<br>set volume via slider</p>";
        helpTrackTextMute.style.marginTop = "9px";

        var helpTrackArrow = document.createElement("div");
        helpTrackArrow.id = "help_track_arrow";
        helpTrackArrow.className = "arrow_icon";

        var helpControls1 = document.createElement("div");
        helpControls1.id = "help_controls1";
        helpControls1.className = "help_controls";

        var helpControlsText1 = document.createElement("div");
        helpControlsText1.id = "help_controls_text1";
        helpControlsText1.className = "help_controls_text";

        var helpControlsTextPlay = document.createElement("div");
        helpControlsTextPlay.className = "help_text";
        helpControlsTextPlay.innerHTML = "<p>play back or pause project</p>";

        var helpControlsTextStop = document.createElement("div");
        helpControlsTextStop.className = "help_text";
        helpControlsTextStop.innerHTML = "<p>stop playback or recording</p>";

        var helpControlsTextRec = document.createElement("div");
        helpControlsTextRec.className = "help_text";
        helpControlsTextRec.innerHTML = "<p>record audio</p>";

        var helpControlsTextPlus = document.createElement("div");
        helpControlsTextPlus.className = "help_text";
        helpControlsTextPlus.innerHTML = "<p>add new track</p>";

        var helpControlsTextCut = document.createElement("div");
        helpControlsTextCut.className = "help_text";
        helpControlsTextCut.innerHTML = "<p>cut waveform</p>";

        var helpControlsArrow1 = document.createElement("div");
        helpControlsArrow1.id = "help_controls_arrow1";
        helpControlsArrow1.className = "arrow_icon";

        var helpControls2 = document.createElement("div");
        helpControls2.id = "help_controls2";
        helpControls2.className = "help_controls";

        var helpControlsText2 = document.createElement("div");
        helpControlsText2.id = "help_controls_text2";
        helpControlsText2.className = "help_controls_text";

        var helpControlsTextClock = document.createElement("div");
        helpControlsTextClock.className = "help_text";
        helpControlsTextClock.innerHTML = "<p>metronome on/off,<br>set bpm via text input</p>";
        helpControlsTextClock.style.marginTop = "7px";
        helpControlsTextClock.style.height = "41px";


        var helpControlsTextMasterMute = document.createElement("div");
        helpControlsTextMasterMute.className = "help_text";
        helpControlsTextMasterMute.innerHTML = "<p>mute/unmute master volume<br>and set volume via slider</p>";
        helpControlsTextMasterMute.style.marginTop = "9px";
        helpControlsTextMasterMute.style.height = "39px";

        var helpControlsArrow2 = document.createElement("div");
        helpControlsArrow2.id = "help_controls_arrow2";
        helpControlsArrow2.className = "arrow_icon";

        var helpControls3 = document.createElement("div");
        helpControls3.id = "help_controls3";
        helpControls3.className = "help_controls";

        var helpControlsText3 = document.createElement("div");
        helpControlsText3.id = "help_controls_text3";
        helpControlsText3.className = "help_controls_text";

        var helpControlsTextFullscreen = document.createElement("div");
        helpControlsTextFullscreen.className = "help_text";
        helpControlsTextFullscreen.innerHTML = "<p>fullscreen mode on/off</p>";

        var helpControlsTextDownload = document.createElement("div");
        helpControlsTextDownload.className = "help_text";
        helpControlsTextDownload.innerHTML = "<p>download current project</p>";

        var helpControlsTextHelp = document.createElement("div");
        helpControlsTextHelp.className = "help_text";
        helpControlsTextHelp.innerHTML = "<p>toggle help screen on/off</p>";

        var helpControlsTextScale = document.createElement("div");
        helpControlsTextScale.className = "help_text";
        helpControlsTextScale.innerHTML = "<p>reset zoom to default<br> and zoom in/out via slider</p>";
        helpControlsTextScale.style.marginTop = "9px";

        var helpControlsArrow3 = document.createElement("div");
        helpControlsArrow3.id = "help_controls_arrow3";
        helpControlsArrow3.className = "arrow_icon";

        //---------------------------Main Controls----------------------------//
        var mainControls = document.createElement("div");
        mainControls.id = "main_controls";

        var mainControlsContainer = document.createElement("div");
        mainControlsContainer.id = "main_controls_container";

        var mainControlButtons = document.createElement("div");
        mainControlButtons.id = "main_control_buttons";

        var projectName = document.createElement("input");
        projectName.className = "text";
        projectName.id = "project_name";
        projectName.placeholder = "Your Project Name";

        //----------------------------UI Container----------------------------//
        var uiContainer = document.createElement("div");
        uiContainer.id = "ui_container";

        var playIconContainer = document.createElement("div");
        playIconContainer.id = "play_icon_container";
        playIconContainer.className = "icon_container";

        var play = document.createElement("div");
        play.id = "play";

        var stopIconContainer = document.createElement("div");
        stopIconContainer.id = "stop_icon_container";
        stopIconContainer.className = "icon_container";

        var stop = document.createElement("div");
        stop.id = "stop";

        var recIconContainer = document.createElement("div");
        recIconContainer.id = "rec_icon_container";
        recIconContainer.className = "icon_container_pressable";

        var rec = document.createElement("div");
        rec.id = "rec";

        var plusIconContainer = document.createElement("div");
        plusIconContainer.id = "plus_icon_container";
        plusIconContainer.className = "icon_container";

        var plus = document.createElement("div");
        plus.id = "plus";

        var cutIconContainer = document.createElement("div");
        cutIconContainer.id = "cut_icon_container";
        cutIconContainer.className = "icon_container_pressable";

        var cut1 = document.createElement("div");
        cut1.id = "cut1";
        cut1.className = "cut1";

        var cut2 = document.createElement("div");
        cut2.id = "cut2";
        cut2.className = "cut2";

        //---------------------------Scale Container--------------------------//
        var scaleContainer = document.createElement("div");
        scaleContainer.id = "scale_container";

        var fullscreenIconContainer = document.createElement("div");
        fullscreenIconContainer.id = "fullscreen_icon_container";
        fullscreenIconContainer.className = "icon_container";

        var fullscreen1 = document.createElement("div");
        fullscreen1.id = "fullscreen1";
        fullscreen1.className = "fullscreen1";

        var fullscreen2 = document.createElement("div");
        fullscreen2.id = "fullscreen2";
        fullscreen2.className = "fullscreen2";

        var downloadIconContainer = document.createElement("div");
        downloadIconContainer.id = "download_icon_container";
        downloadIconContainer.className = "icon_container";

        var downloadIcon = document.createElement("div");
        downloadIcon.id = "download";

        var helpIconContainer = document.createElement("div");
        helpIconContainer.id = "help_icon_container";
        helpIconContainer.className = "icon_container";

        var helpIcon1 = document.createElement("div");
        helpIcon1.id = "help1";

        var helpIcon2 = document.createElement("div");
        helpIcon2.id = "help2";

        var scaleSlider = document.createElement("input");
        scaleSlider.type = "range";
        scaleSlider.className = "slider";
        scaleSlider.id = "scale_slider";
        scaleSlider.min = "0.6";
        scaleSlider.max = "1.4";
        scaleSlider.step = "any";
        scaleSlider.value = "1";

        var scaleIconContainer = document.createElement("div");
        scaleIconContainer.id = "scale_icon_container";
        scaleIconContainer.className = "icon_container";

        var scale = document.createElement("div");
        scale.id = "scale";

        //-----------------------------Current Time---------------------------//
        var currentTimeDiv = document.createElement("div");
        currentTimeDiv.id = "current_time";
        currentTimeDiv.innerHTML = "00:00:00 |1:1";

        //----------------------Master Volume Container-----------------------//
        var masterVolumeContainer = document.createElement("div");
        masterVolumeContainer.id = "master_volume_container";

        var bpmDiv = document.createElement("input");
        bpmDiv.type = "number";
        bpmDiv.id = "bpm";
        bpmDiv.value = "120";

        var clockIconContainer = document.createElement("div");
        clockIconContainer.id = "clock_icon_container";
        clockIconContainer.className = "icon_container_pressable";

        var clock = document.createElement("div");
        clock.id = "clock";
        clock.className = "clock";

        var masterVolumeIconContainer = document.createElement("div");
        masterVolumeIconContainer.id = "masterVolume_icon_container";
        masterVolumeIconContainer.className = "icon_container_pressable";

        var masterVolume = document.createElement("div");
        masterVolume.id = "masterVolume";
        masterVolume.className = "volume";

        var mainVolume = document.createElement("input");
        mainVolume.type = "range";
        mainVolume.className = "slider";
        mainVolume.id = "master_volume";
        mainVolume.min = "0";
        mainVolume.max = "1";
        mainVolume.step = "any";
        mainVolume.value = ".8";

        //--------------------------Track Container---------------------------//
        var trackContainer = document.createElement("div");
        trackContainer.id = "track_container";

        var trackContainerTopFill = document.createElement("div");
        trackContainerTopFill.id = "track_container_topFill";

        var trackControlsContainer = document.createElement("div");
        trackControlsContainer.id = "trackControls_container";

        var trackControlsTopFill = document.createElement("div");
        trackControlsTopFill.id = "trackControls_topFill";

        //------------------------Scrollable Container------------------------//
        var scrollableContainer = document.createElement("div");
        scrollableContainer.id = "scrollable_container";


        var scalableContainer = document.createElement("div");
        scalableContainer.id = "scalable_container";

        var timebar = document.createElement("canvas");
        timebar.className = "timebar";
        timebar.id = "timebar";
        timebar.height = 20;
        timebar.width = 8194;

        var draggableContainer = document.createElement("div");
        draggableContainer.id = "draggable_container";

        var timeline = document.createElement("div");
        timeline.id = "timeline";

        var gridContainer = document.createElement("div");
        gridContainer.id = "grid_container";

        var gridCanvas = document.createElement("canvas");
        gridCanvas.id = "grid_canvas";
        gridCanvas.height = 112;
        gridCanvas.width = 8194;

        //------------------------------Scripts-------------------------------//
        var trackScript = document.createElement("script");
        trackScript.type = "text/javascript";
        trackScript.src = "js/track.js";

        var waveformScript = document.createElement("script");
        waveformScript.type = "text/javascript";
        waveformScript.src = "js/waveform.js";

        var recorderScript = document.createElement("script");
        recorderScript.type = "text/javascript";
        recorderScript.src = "js/recorder.js";

        var metronomeScript = document.createElement("script");
        metronomeScript.type = "text/javascript";
        metronomeScript.src = "js/metronome.js";

        //--------------------------Appending Divs----------------------------//
        uiContainer.appendChild(playIconContainer);
        playIconContainer.appendChild(play);
        uiContainer.appendChild(stopIconContainer);
        stopIconContainer.appendChild(stop);
        uiContainer.appendChild(recIconContainer);
        recIconContainer.appendChild(rec);
        uiContainer.appendChild(plusIconContainer);
        plusIconContainer.appendChild(plus);
        uiContainer.appendChild(cutIconContainer);
        cutIconContainer.appendChild(cut1);
        cutIconContainer.appendChild(cut2);
        uiContainer.appendChild(currentTimeDiv);

        scaleContainer.appendChild(fullscreenIconContainer);
        fullscreenIconContainer.appendChild(fullscreen1);
        fullscreenIconContainer.appendChild(fullscreen2);
        scaleContainer.appendChild(downloadIconContainer);
        downloadIconContainer.appendChild(downloadIcon);
        scaleContainer.appendChild(helpIconContainer);
        helpIconContainer.appendChild(helpIcon1);
        helpIconContainer.appendChild(helpIcon2);
        scaleContainer.appendChild(scaleIconContainer);
        scaleIconContainer.appendChild(scale);
        scaleContainer.appendChild(scaleSlider);


        masterVolumeContainer.appendChild(bpmDiv);
        masterVolumeContainer.appendChild(clockIconContainer);
        clockIconContainer.appendChild(clock);
        masterVolumeContainer.appendChild(masterVolumeIconContainer);
        masterVolumeIconContainer.appendChild(masterVolume);
        masterVolumeContainer.appendChild(mainVolume);

        scrollableContainer.appendChild(scalableContainer);
        scalableContainer.appendChild(timebar);
        scalableContainer.appendChild(draggableContainer);
        draggableContainer.appendChild(timeline);
        scalableContainer.appendChild(gridContainer);

        gridContainer.appendChild(gridCanvas);

        trackContainer.appendChild(trackControlsContainer);
        trackControlsContainer.appendChild(trackControlsTopFill);
        trackContainer.appendChild(scrollableContainer);

        mainControlButtons.appendChild(uiContainer);
        mainControlButtons.appendChild(scaleContainer);
        mainControlButtons.appendChild(masterVolumeContainer);

        mainControls.appendChild(mainControlButtons);

        mainControlsContainer.appendChild(projectName);
        mainControlsContainer.appendChild(mainControls);


        mainContainer.appendChild(mainControlsContainer);
        mainContainer.appendChild(trackContainer);
        mainContainer.appendChild(overlay);

        helpControlsContainer.appendChild(helpControls1);
        helpControls1.appendChild(helpControlsText1);
        helpControlsText1.appendChild(playIconContainer.cloneNode(true));
        helpControlsText1.appendChild(helpControlsTextPlay);
        helpControlsText1.appendChild(stopIconContainer.cloneNode(true));
        helpControlsText1.appendChild(helpControlsTextStop);
        helpControlsText1.appendChild(recIconContainer.cloneNode(true));
        helpControlsText1.appendChild(helpControlsTextRec);
        helpControlsText1.appendChild(plusIconContainer.cloneNode(true));
        helpControlsText1.appendChild(helpControlsTextPlus);
        helpControlsText1.appendChild(cutIconContainer.cloneNode(true));
        helpControlsText1.appendChild(helpControlsTextCut);
        helpControls1.appendChild(helpControlsArrow1);
        helpControlsContainer.appendChild(helpControls2);
        helpControls2.appendChild(helpControlsText2);
        helpControlsText2.appendChild(clockIconContainer.cloneNode(true));
        helpControlsText2.appendChild(helpControlsTextClock);
        helpControlsText2.appendChild(masterVolumeIconContainer.cloneNode(true));
        helpControlsText2.appendChild(helpControlsTextMasterMute);
        helpControls2.appendChild(helpControlsArrow2);
        helpControlsContainer.appendChild(helpControls3);
        helpControlsText3.appendChild(fullscreenIconContainer.cloneNode(true));
        helpControlsText3.appendChild(helpControlsTextFullscreen);
        helpControlsText3.appendChild(downloadIconContainer.cloneNode(true));
        helpControlsText3.appendChild(helpControlsTextDownload);
        helpControlsText3.appendChild(helpIconContainer.cloneNode(true));
        helpControlsText3.appendChild(helpControlsTextHelp);
        helpControlsText3.appendChild(scaleIconContainer.cloneNode(true));
        helpControlsText3.appendChild(helpControlsTextScale);
        helpControls3.appendChild(helpControlsArrow3);
        helpControls3.appendChild(helpControlsText3);
        helpControlsContainer.appendChild(helpTrackContainer);
        crossIconContainer.appendChild(cross);
        soloIconContainer.appendChild(solo);
        muteIconContainer.appendChild(mute);
        micIconContainer.appendChild(mic);
        micIconContainer.appendChild(holder);
        helpTrackText.appendChild(crossIconContainer);
        helpTrackText.appendChild(helpTrackTextCross);
        helpTrackText.appendChild(soloIconContainer);
        helpTrackText.appendChild(helpTrackTextSolo);
        helpTrackText.appendChild(micIconContainer);
        helpTrackText.appendChild(helpTrackTextMic);
        helpTrackText.appendChild(muteIconContainer);
        helpTrackText.appendChild(helpTrackTextMute);
        helpTrackContainer.appendChild(helpTrackArrow);
        helpTrackContainer.appendChild(helpTrackText);

        document.body.insertBefore(helpControlsContainer, document.body.childNodes[0]);
        document.body.insertBefore(mainContainer, document.body.childNodes[0]);

        //--------------------------------Adding Eventlisteners----------------------------------//
        scaleSlider.addEventListener('input', function() {app.changeScale(this.value);});
        mainVolume.addEventListener('input', function() {app.mainGainNode.gain.value = this.value;;});
        masterVolumeIconContainer.addEventListener("click", function() {app.muting(app.mute, masterVolumeIconContainer, masterVolume, app.mainGainNode, mainVolume);});
        playIconContainer.addEventListener("click", function() {app.playRecording(app);});
        stopIconContainer.addEventListener("click", function() {app.stopRecording(app);});
        recIconContainer.addEventListener("click", function() {app.startRecording(app);});
        plusIconContainer.addEventListener("click", function() {app.createTrack(app);});
        downloadIconContainer.addEventListener("click", function (){app.download(app); app.openCloseModalDialog("download", app);});
        clockIconContainer.addEventListener("click", function() {app.clickOnOff(app);});
        fullscreenIconContainer.addEventListener("click", function() {app.fullscreen("button");});
        cutIconContainer.addEventListener("click", function() {app.cutWaveformActive();});
        scaleIconContainer.addEventListener("click", function() {app.resetScale();});
        bpmDiv.addEventListener('input', function(){app.tempo = event.target.value; app.drawTimebar(app.tempo); app.drawGridLines(app.tempo);});
        timebar.addEventListener("mousedown", function (e){e.preventDefault(); app.clickTimebar(e, app);}, false);
        overlay.addEventListener("click", function (e){e.preventDefault(); app.openCloseModalDialog(e.target.id, app);}, false);
        helpIconContainer.addEventListener("click", function (e){e.preventDefault(); app.openCloseModalDialog(e.target.id, app);}, false);

        document.addEventListener("click", function(e) {e.preventDefault(); if(app.cut == true){app.cutWaveform(e.target, e.target.id, e.clientX, app);}}, false);
        document.addEventListener("keyup", function (e){e.preventDefault(); app.checkKey(e, app);});

        //----------------------------Calling initializing functions-----------------------------//
        app.metronome = new Metronome(app);
        app.metronome.init(app.metronome);
        this.drawGridLines(this.tempo);
        this.createGridLines();
        app.createTrack(app);
        this.highlightTrack(1, 0.6);
        this.playPauseIcon();
        //Draw the scale units for the Timebar
        app.moveTimeLine(this.timebarColumn + this.currentTimebarLocation);
        this.drawTimebar(this.tempo);
        this.openCloseModalDialog("init", app);
        document.getElementById("overlay_title").className = "fade";
        document.getElementById("overlay_title").style.opacity = "1";
    };
}

//---------------------------------starting the app-------------------------------------//
var myApp = new App();
myApp.starting(myApp);
