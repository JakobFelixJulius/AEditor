//create for each track an object with an array to keep track of the waveforms
function TrackObject(id){
    this.id = id;
    this.waveformCount = 0;
    this.waveformArray = [];
    this.micActive = false;
    this.gainNode;
    this.analyserNode;
    this.analyserNode2;
    this.splitterNode;
    this.pannerNode;
    this.play = [false];
    this.muted = false;
    this.solo = false;
    this.waveformColor = "hsla(" + (Math.random() * 360) + ", 50%, 40%, 0.2)";
}
//---------------------------------Track Object Functions-----------------------------------//
TrackObject.prototype = {
    constructor: TrackObject,

    init:function(app, trackObject){
        var trackContainer = document.getElementById("track_container");
        var trackControls = document.getElementById("track_controls");
        var trackControlsContainer = document.getElementById("trackControls_container");
        var draggableContainer = document.getElementById("draggable_container");

        var newWaveformContainer = document.createElement("div");
        newWaveformContainer.className = "waveform_container";
        newWaveformContainer.id = "waveform_container" + app.trackID;
        newWaveformContainer.addEventListener("click", function (e){e.preventDefault(); trackObject.clickTrackActive(e, app);}, false);

        var newTrackControl = document.createElement("div");
        newTrackControl.className = "track_controls";
        newTrackControl.id = "track_control" + app.trackID;
        newTrackControl.addEventListener("click", function (e){e.preventDefault(); trackObject.clickTrackActive(e, app);}, false);

        var newTrackControlInnerleft = document.createElement("div");
        newTrackControlInnerleft.className = "track_controls_innerleft";
        newTrackControlInnerleft.id = "track_control_innerleft" + app.trackID;

        var newTrackName = document.createElement("input");
        newTrackName.className = "track_name";
        newTrackName.id = "track_name" + app.trackID;
        newTrackName.placeholder = "Track " + app.trackID;
        newTrackName.style.backgroundColor = trackObject.waveformColor;

        var newTrackButtonsContainer = document.createElement("div");
        newTrackButtonsContainer.className = "track_buttons_container";
        newTrackButtonsContainer.id = "track_buttons_container" + app.trackID;

        var newDeleteButtonContainer = document.createElement("div");
        newDeleteButtonContainer.className = "icon_container";
        newDeleteButtonContainer.id = "cross_icon_container" + app.trackID;
        newDeleteButtonContainer.addEventListener('click', function (e){e.preventDefault(); trackObject.deleteTrack(e, app);}, false);
        newDeleteButtonContainer.style.marginLeft = "4px";

        var newDeleteButton = document.createElement("div");
        newDeleteButton.className = "cross";
        newDeleteButton.id = "cross" + app.trackID;

        var newSoloButtonContainer = document.createElement("div");
        newSoloButtonContainer.className = "icon_container_pressable";
        newSoloButtonContainer.id = "solo_icon_container" + app.trackID;
        newSoloButtonContainer.addEventListener('click', function (e){e.preventDefault(); trackObject.soloTrack(e, app);}, false);

        var newSoloButton = document.createElement("div");
        newSoloButton.className = "solo";
        newSoloButton.id = "solo" + app.trackID;

        var newMicButtonContainer = document.createElement("div");
        newMicButtonContainer.className = "icon_container_pressable";
        newMicButtonContainer.id = "mic_icon_container" + app.trackID;
        newMicButtonContainer.addEventListener('click', function (e){e.preventDefault(); trackObject.setMicActive(e, app);}, false);

        var newMicButton = document.createElement("div");
        newMicButton.className = "micOff";
        newMicButton.id = "mic" + app.trackID;

        var newMicHolderButton = document.createElement("div");
        newMicHolderButton.className = "holderOff";
        newMicHolderButton.id = "holder" + app.trackID;

        var newMuteButtonContainer = document.createElement("div");
        newMuteButtonContainer.className = "icon_container_pressable";
        newMuteButtonContainer.id = "mute_icon_container" + app.trackID;
        newMuteButtonContainer.addEventListener('click', function (e){e.preventDefault(); trackObject.muteTrack(e, app);}, false);

        var newMuteButton = document.createElement("div");
        newMuteButton.className = "volume";
        newMuteButton.id = "mute" + app.trackID;

        var newFrequency = document.createElement("canvas");
        newFrequency.className = "frequency"
        newFrequency.id = "frequency" + app.trackID;
        newFrequency.height = 80;
        newFrequency.width = 52;

        var newTrackVolumeText = document.createElement("div");
        newTrackVolumeText.className = "track_volume_text";
        newTrackVolumeText.id = "track_volume_text" + app.trackID;
        newTrackVolumeText.innerHTML = "0 dB";

        var newTrackVolume = document.createElement("input");
        newTrackVolume.type = "range";
        newTrackVolume.className = "track_slider";
        newTrackVolume.id = "track_volume" + app.trackID;
        newTrackVolume.min = "0";
        newTrackVolume.max = "1";
        newTrackVolume.step = "any";
        newTrackVolume.value = ".8";

        var newTrackPanning = document.createElement("input");
        newTrackPanning.type = "range";
        newTrackPanning.className = "slider";
        newTrackPanning.id = "pan_slider" + app.trackID;
        newTrackPanning.min = "-1";
        newTrackPanning.max = "1";
        newTrackPanning.step = "any";
        newTrackPanning.value = "0";
        newTrackPanning.style.marginTop = "13px";
        newTrackPanning.style.marginLeft = "33px";

        trackControlsContainer.appendChild(newTrackControl);
        draggableContainer.appendChild(newWaveformContainer);
        newTrackControl.appendChild(newTrackControlInnerleft);
        newTrackControlInnerleft.appendChild(newTrackName);
        newTrackControlInnerleft.appendChild(newTrackButtonsContainer);
        newTrackButtonsContainer.appendChild(newDeleteButtonContainer);
        newDeleteButtonContainer.appendChild(newDeleteButton);
        newTrackButtonsContainer.appendChild(newSoloButtonContainer);
        newSoloButtonContainer.appendChild(newSoloButton);
        newTrackButtonsContainer.appendChild(newMicButtonContainer);
        newMicButtonContainer.appendChild(newMicButton);
        newMicButtonContainer.appendChild(newMicHolderButton);
        newTrackButtonsContainer.appendChild(newMuteButtonContainer);
        newMuteButtonContainer.appendChild(newMuteButton);
        newTrackButtonsContainer.appendChild(newTrackPanning);
        newTrackControlInnerleft.appendChild(newTrackVolume);
        newTrackControl.appendChild(newFrequency);
        newTrackControl.appendChild(newTrackVolumeText);
        app.highlightTrack(app.trackID, 0.3);

        //create Splitter and Analyser Nodes for Tracks Frequency Display
        var trackAnalyserNode = app.audioCtx.createAnalyser();
        trackAnalyserNode.smoothingTimeConstant = 0.7;
        trackAnalyserNode.fftSize = 1024;
        var trackAnalyserNode2 = app.audioCtx.createAnalyser();
        trackAnalyserNode2.smoothingTimeConstant = 0.7;
        trackAnalyserNode2.fftSize = 1024;
        var trackSplitter = app.audioCtx.createChannelSplitter();
        var trackPanner = app.audioCtx.createPanner();
        app.audioCtx.listener.setPosition(0, 0, 0);
        trackPanner.setPosition(0, 0, 1);
        trackPanner.panningModel = 'equalpower';

        //add the tracks gainnode to the main gainnode and to the Trackobject
        trackGainNode = app.audioCtx.createGain();
        trackPanner.connect(app.mainGainNode);
        trackGainNode.connect(trackPanner);
        trackGainNode.connect(trackSplitter);
        trackSplitter.connect(trackAnalyserNode,0,0);
        trackSplitter.connect(trackAnalyserNode2,1,0);

        trackGainNode.gain.value = 0.8;
        trackObject.gainNode = trackGainNode;
        trackObject.pannerNode = trackPanner;
        trackObject.analyserNode = trackAnalyserNode;
        trackObject.analyserNode2 = trackAnalyserNode2;
        trackObject.splitterNode = trackSplitter;

        newTrackVolume.addEventListener('input', function (e){e.preventDefault(); trackObject.volumeTrack(e.target.id, this.value, app);}, false);
        newTrackPanning.addEventListener('input', function (e){e.preventDefault(); trackObject.panTrack(e.target.id, this.value, app);}, false);


        app.drawGridLines(app.tempo);
        document.getElementById("tableY").style.height = document.getElementById("grid_container").offsetHeight + 12 + "px";

    },

    //function for each track's delete button
    deleteTrack:function(event, app){
        //get the ID of the clicked deletebutton's track
        clickedDeleteButtonId = event.target.id;
        clickedDeleteButtonId = clickedDeleteButtonId.match(/\d+/)[0];

        //if track is not the last one delete track, else alert
        if (app.trackObjects.length > 1){
            //get the track container and clicked track and delete clicked track
            var trackContainer = document.getElementById("track_container");
            var currentTrackControls = document.getElementById("track_control" + clickedDeleteButtonId);
            var currentTrackWaveformContainer = document.getElementById("waveform_container" + clickedDeleteButtonId);
            currentTrackControls.remove();
            currentTrackWaveformContainer.remove();

            //delete track from trackObjects array
            for (var i = 0; i < app.trackObjects.length; i++){
                if (app.trackObjects[i] != null && app.trackObjects[i].id == clickedDeleteButtonId){
                    app.trackObjects[i].analyserNode.disconnect();
                    app.trackObjects[i].analyserNode2.disconnect();
                    app.trackObjects[i].splitterNode.disconnect();
                    app.trackObjects[i].gainNode.disconnect();
                    var index = app.trackObjects.indexOf(app.trackObjects[i]);
                    app.trackObjects.splice(index,1);
                }
            }

            //if deleted track was highlighted/active track, highlight first track
            if (app.activeTrackId == clickedDeleteButtonId){
                app.highlightTrack(app.trackObjects[0].id, 0.6);
                app.activeTrackId = app.trackObjects[0].id;
            }

            app.drawGridLines(app.tempo);
            document.getElementById("tableY").style.height = document.getElementById("grid_container").offsetHeight + 12 + "px";

        }else{
            alert("No more available tracks to delete!");
        }
    },

        //---------------Function for clicking a track and activating it-----------------//
    clickTrackActive:function(event, app){

        //if klicked element wasn't a button or textfield and track is not recording deselect all track and highlight clicked track
        if (app.recording == false && !(event.target.className == "cross") && !(event.target.className == "text")&& !(event.target.className == "icon_container")){
            var clickedTrackNum = event.target.id;
            clickedTrackNum = clickedTrackNum.match(/\d+/)[0];


            for (var i = 0; i < app.trackObjects.length; i++) {
                temp = app.trackObjects[i].id;
                app.highlightTrack(temp, 0.3);
            }

            //highlight the clicked track and set the clicked track as the active track
            app.highlightTrack(clickedTrackNum, 0.6);
            app.activeTrackId = clickedTrackNum;
        }
    },

    //-----------------------------Function for panning a track-----------------------------//
    panTrack:function(id, value, app){

        for (var i = 0; i < app.trackObjects.length; i++){
            if (app.trackObjects[i].id == id.replace(/[^0-9]/g,'')){
                var x = parseFloat(value);
                y = 0;
                z = 1 - Math.abs(x);
                app.trackObjects[i].pannerNode.setPosition(x,y,z);
            }
        }
    },

    //------------------------------Function for track volume-------------------------------//
    volumeTrack:function(id, value, app){
        for (var i = 0; i < app.trackObjects.length; i++){
            if (app.trackObjects[i].id == id.replace(/[^0-9]/g,'')){
                app.trackObjects[i].gainNode.gain.value = value;
            }
        }
    },

    //------------------------------Visual Frequency Functions------------------------------//
    drawFrequencies:function(app){
        if(app.playing == true){
            for (var i = 0; i < app.trackObjects.length; i++){
                if (app.trackObjects[i].play[0] == true){
                    app.trackObjects[i].drawFrequency(app.trackObjects[i].id, app.trackObjects[i].analyserNode, app.trackObjects[i].analyserNode2);
                }else if(app.trackObjects[i].play[0] == false){
                    document.getElementById("track_volume_text" + app.trackObjects[i].id).innerHTML = "0 dB";
                    var canvas = document.getElementById("frequency" + app.trackObjects[i].id).getContext("2d");
                    canvas.clearRect(0, 0, 60, 80);
                }
            }
        }else if (app.playing == false){
            app.trackObjects[0].drawFrequency(app.activeTrackId, app.analyserNode, app.analyserNode2);
        }
    },

    drawFrequency:function(id, node1, node2){
        var frequecyCanvas;
        //Variables for Frequencydisplay
        frequecyCanvas = document.getElementById("frequency" + id).getContext("2d");
        var gradient = frequecyCanvas.createLinearGradient(0,0,0,80);
        gradient.addColorStop(1,"rgba(46, 113, 49, 0.7)");
        gradient.addColorStop(0.60,"rgba(203, 197, 62, 0.7)");
        gradient.addColorStop(0.40,"rgba(255, 137, 0, 0.7)");
        gradient.addColorStop(0.20,"rgba(239, 40, 40, 0.7)");


        // get the average for the first channel
        var array =  new Uint8Array(node1.frequencyBinCount);
        node1.getByteFrequencyData(array);
        var average = getAverageVolume(array);

        // get the average for the second channel
        var array2 =  new Uint8Array(node2.frequencyBinCount);
        node2.getByteFrequencyData(array2);
        var average2 = getAverageVolume(array2);

        //set the average to a percentage of max 130 dB
        average = (average/130)*80;
        average2 = (average2/130)*80;

        //get the total average for the text display
        var totalAverage = Math.round((average + average2)/2);

        //set the total average as the text display
        document.getElementById("track_volume_text" + id).innerHTML = totalAverage + " dB";

        // clear the current state
        frequecyCanvas.clearRect(0, 0, 60, 80);
        frequecyCanvas.beginPath();

        // set the fill style
        frequecyCanvas.fillStyle=gradient;

        // create the meters
        frequecyCanvas.fillRect(4,80-average,20,80);
        frequecyCanvas.fillRect(28,80-average2,20,80);

        function getAverageVolume(array) {
            var values = 0;
            var average;

            var length = array.length;

            // get all the frequency amplitudes
            for (var i = 0; i < length; i++) {
                values += array[i];
            }

            average = values / length;
            return average;
        }
    },

    soloTrack:function(event, app){
        var clickedId = event.target.id;
        clickedId = clickedId.replace(/\D/g,'');

        var clickedIndex;
        for (var i = 0; i < app.trackObjects.length; i++){
                if (app.trackObjects[i].id == clickedId){
                    clickedIndex = i;
                }
            }

        app.trackObjects[clickedIndex].solo = !app.trackObjects[clickedIndex].solo;
        app.anySolo = false;

        for (var i = 0; i < app.trackObjects.length; i++){
            if (app.trackObjects[i].solo == false){
                app.trackObjects[i].gainNode.gain.value = 0;
                document.getElementById("solo" + app.trackObjects[i].id).className = "solo";
                document.getElementById("solo_icon_container" + app.trackObjects[i].id).style.background = "rgba(255, 255, 255, 0.7)";
            }else if (app.trackObjects[i].solo == true){
                app.anySolo = true;
                document.getElementById("solo" + app.trackObjects[i].id).className = "soloHighlighted";
                document.getElementById("solo_icon_container" + app.trackObjects[i].id).style.background = "rgba(41, 82, 255, 0.7)";
                app.trackObjects[i].gainNode.gain.value = document.getElementById("track_volume" + app.trackObjects[i].id).value;
            }
        }

        if (app.anySolo == false){
            for (var i = 0; i < app.trackObjects.length; i++){
                app.trackObjects[i].gainNode.gain.value = document.getElementById("track_volume" + app.trackObjects[i].id).value;
            }
        }
    },

    muteTrack:function(event, app){
        var clickedId = event.target.id;
        clickedId = clickedId.replace(/\D/g,'');

        var clickedIndex;
        for (var i = 0; i < app.trackObjects.length; i++){
                if (app.trackObjects[i].id == clickedId){
                    clickedIndex = i;
                }
            }

        if (app.trackObjects[clickedIndex].muted == false){
            app.trackObjects[clickedIndex].gainNode.gain.value = 0;
            app.trackObjects[clickedIndex].muted = true;
            document.getElementById("mute" + clickedId).className = "mute";
            document.getElementById("mute_icon_container" + clickedId).style.background = "rgba(41, 82, 255, 0.7)";
        }else if (app.trackObjects[clickedIndex].muted == true){
            app.trackObjects[clickedIndex].gainNode.gain.value = document.getElementById("track_volume" + clickedId).value;
            app.trackObjects[clickedIndex].muted = false;
            document.getElementById("mute" + clickedId).className = "volume";
            document.getElementById("mute_icon_container" + clickedId).style.background = "rgba(255, 255, 255, 0.7)";
        }

    },

    setMicActive:function(event, app){
        var clickedId = event.target.id;
        clickedId = clickedId.replace(/\D/g,'');

        var clickedIndex;
        for (var i = 0; i < app.trackObjects.length; i++){
                if (app.trackObjects[i].id == clickedId){
                    clickedIndex = i;
                }
            }

        app.trackObjects[clickedIndex].micActive = !app.trackObjects[clickedIndex].micActive;

        if (app.trackObjects[clickedIndex].micActive == true){
            document.getElementById("mic_icon_container" + app.trackObjects[clickedIndex].id).style.background = "rgba(41, 82, 255, 0.7)";
            document.getElementById("mic" + app.trackObjects[clickedIndex].id).className = "micOn";
            document.getElementById("holder" + app.trackObjects[clickedIndex].id).className = "holderOn";
            app.sourceNode.connect(app.mainGainNode);
        }else if (app.trackObjects[clickedIndex].micActive == false){
            document.getElementById("mic_icon_container" + app.trackObjects[clickedIndex].id).style.background = "rgba(255, 255, 255, 0.7)";
            document.getElementById("mic" + app.trackObjects[clickedIndex].id).className = "micOff";
            document.getElementById("holder" + app.trackObjects[clickedIndex].id).className = "holderOff";
            app.sourceNode.disconnect();
            app.sourceNode.connect(app.splitter);
        }
    }
}
