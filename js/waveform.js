//waveformobject for each wafevorm
function WaveformObject(id){
    this.id = id;
    this.reference;
    this.startPosition;
    this.stopPosition;
    this.length = this.stopPosition - this.startPosition;
    this.audioBuffer;
    this.playing = false;
    this.bufferSource = null;
    this.played = false;
}

WaveformObject.prototype = {
    constructor: WaveformObject,
        //-----------------------------Waveform visualization function---------------------------//
    drawWaveform:function(app){
        var currentIndex;
        for (var i = 0; i < app.trackObjects.length; i++){
            if (app.trackObjects[i].id == app.activeTrackId){currentIndex = i;}
        }

        var amplitudeArray = new Uint8Array(app.analyserNode.frequencyBinCount);
        app.analyserNode.getByteTimeDomainData(amplitudeArray);
        var waveformCanvas = app.currentWaveformObject.reference;
        var waveformContext = waveformCanvas.getContext("2d");
        var waveformWidth  = waveformCanvas.width;
        var waveformHeight = waveformCanvas.height;
        var tempCanvas = document.createElement("canvas");
        var tempContext = tempCanvas.getContext("2d");
        tempCanvas.width= waveformCanvas.width;
        tempCanvas.height= waveformCanvas.height;

        var minValue = 9999999;
        var maxValue = 0;

        //set the starting position of the waveformcanvas
        waveformCanvas.style.left = app.currentTimebarLocation + "px";

        //go over the array and find min and max values
        for (var i = 0; i < amplitudeArray.length; i++) {
            var value = amplitudeArray[i] / 256;
            if(value > maxValue) {
                maxValue = value;
            } else if(value < minValue) {
                minValue = value;
            }
        }

        //set the relative min and max values
        var y_lo = waveformHeight - (waveformHeight * minValue) - 1;
        var y_hi = waveformHeight - (waveformHeight * maxValue) - 1;

        //draw the min and max values
        waveformContext.fillStyle = "white";
        waveformContext.fillRect(app.waveformColumn,y_lo, 1, y_hi - y_lo);

        //copy the current canvas into temp canvas
        tempContext.drawImage(waveformCanvas, 0, 0, waveformWidth, waveformHeight);

        //extend the canvas
        waveformWidth++;
        waveformCanvas.width = waveformWidth;

        //insert saved canvas into newly extended canvas and extend temp canvas to the size of the current canvas
        waveformContext.drawImage(tempCanvas, 0, 0, (waveformWidth-1), waveformHeight, 0, 0, (waveformWidth-1), waveformHeight);

        //go to the next column
        app.waveformColumn++;
    },

    init:function(id, app){
        var newWaveform = document.createElement("canvas");
        newWaveform.className = "waveform"
        newWaveform.id = "waveform" + app.trackObjects[id].id + app.trackObjects[id].waveformCount + "0";
        newWaveform.height = 110;
        newWaveform.width = 1;
        document.getElementById("waveform_container" + app.trackObjects[id].id).appendChild(newWaveform);

        //move waveform to current timeline position
        newWaveform.style.left = app.currentTimebarLocation + "px";
        newWaveform.style.backgroundColor = "rgba(230, 56, 56, 0.3)";

        app.currentWaveformObject.reference = newWaveform;
        app.currentWaveformObject.id = app.trackObjects[id].waveformCount + "0";
    },

        //----------------Function to create a waveform when recording stops--------------//
    createWaveformBuffer:function(app){
        app.recorder && app.recorder.getBuffer(function(buffers){
            var newBuffer = app.audioCtx.createBuffer(2, buffers[0].length, app.audioCtx.sampleRate);
            newBuffer.getChannelData(0).set(buffers[0]);
            newBuffer.getChannelData(1).set(buffers[1]);

            var currentIndex;
            for (var i = 0; i < app.trackObjects.length; i++){
                if (app.trackObjects[i].id == app.activeTrackId){
                    currentIndex = i;
                }
            }

            var waveform = document.getElementById("waveform" + app.trackObjects[currentIndex].id + app.trackObjects[currentIndex].waveformCount + "0");

            //create waveform Object and save it in the tracks Waveformarray
            app.currentWaveformObject.startPosition = waveform.offsetLeft;
            app.currentWaveformObject.stopPosition = waveform.offsetLeft + waveform.width;
            app.currentWaveformObject.length = app.currentWaveformObject.stopPosition - app.currentWaveformObject.startPosition;
            app.currentWaveformObject.audioBuffer = newBuffer;

            app.currentWaveformObject.addWaveformDeleteButton(waveform, app, app.currentWaveformObject);
            app.currentWaveformObject.colorWaveform(waveform, currentIndex, app);

            //call function to make waveforms draggable
            app.currentWaveformObject.makeWaveformDraggable(app);

            app.trackObjects[currentIndex].waveformArray.push(app.currentWaveformObject);

            //count the tracks waveformCount one up
            app.trackObjects[currentIndex].waveformCount++;
        });
    },

    colorWaveform:function(waveform, trackId, app){
        //set the color of the waveform to tracks waveformcolor
        waveform.style.backgroundColor = app.trackObjects[trackId].waveformColor;
    },

    addWaveformDeleteButton:function(canvas, app, waveformObject){
        var context = canvas.getContext("2d");
        var width = canvas.width;

        context.fillStyle = "#555";
        context.fillRect(width-10,0,10,10);

        context.moveTo(width-8, 2);
        context.lineTo(width-2, 8);
        context.moveTo(width-8, 8);
        context.lineTo(width-2, 2);
        context.strokeStyle = "white";
        context.stroke();

        canvas.addEventListener("mousedown", function (e){e.preventDefault(); waveformObject.deleteWaveform(e, app);}, false);
    },

        //--------------------------Function to delete waveform---------------------------//
    deleteWaveform:function(event, app){
        var x = event.pageX;
        var y = event.pageY;
        var canvas = event.target;
        var width = canvas.width;
        var waveformNum = canvas.id.substr(9);
        var boundingRect = canvas.getBoundingClientRect();

        //get position of click
        x -= boundingRect.left;
        y -= boundingRect.top;

        //if click was on the delete button delete
        if (x >= width-10 && y <= 10){

            //delete waveformcanvas
            var waveformContainer = document.getElementById("waveform_container" + app.activeTrackId);
            waveformContainer.removeChild(canvas);

            var currentIndex;
            for (var i = 0; i < app.trackObjects.length; i++){
                if (app.trackObjects[i].id == app.activeTrackId){
                    currentIndex = i;
                }
            }

            //delete waveform from waveformarray
                for (var i = 0; i < app.trackObjects[currentIndex].waveformArray.length; i++){

                    if (app.trackObjects[currentIndex].waveformArray[i].reference == canvas){
                        app.trackObjects[currentIndex].waveformArray.splice(i, 1);
                        break;
                    }
                }
            //no need to delete Audio Data, (can't do it anyways), no sourcenode availabe and audio buffer is not connected
        }
    },

    makeWaveformDraggable:function(app){
        //jQuery UI function to make waveform draggable
        $(".waveform").draggable({
            grid: [1, 112],
            snap: "td",
            snapTolerance: 5,
            stack: ".waveform",
            containment: "#draggable_container",
            distance: 0,
            cursor: "move",
            start: function (event, ui) {ui.position.left = Math.round(ui.position.left/document.getElementById("scale_slider").value);},
            drag: function (event, ui) {ui.position.left = Math.round(ui.position.left/document.getElementById("scale_slider").value);},
            stop: function(event, ui){
                var stopPosition = event.target.getBoundingClientRect().top-81;
                var x = event.clientX;
                var y = event.clientY;
                var trackContainer = document.getElementById("track_container");
                var scrollOffset = trackContainer.scrollTop;
                var waveform;
                stopPosition += scrollOffset;

                var elementMouseIsOver = document.elementFromPoint(x, y);

                if(app.cut == true){app.cutWaveform(event.target, event.target.id, x, app);}
                    var currentIndex;
                    for (var i = 0; i < app.trackObjects.length; i++){
                        if (app.trackObjects[i].id == app.activeTrackId){currentIndex = i;}
                    }

                //set the new start and stop positions of the dragged waveform object
                for (var i = 0; i < app.trackObjects[currentIndex].waveformArray.length; i++){
                    //compare the waveformCounts/numbers of each waveformarray in the array with
                    //the correct waveformCount of the clicked waveform
                    if (app.trackObjects[currentIndex].waveformArray[i].reference == this){
                        //when found set the new start and stop positions
                        app.trackObjects[currentIndex].waveformArray[i].startPosition = this.offsetLeft;
                        app.trackObjects[currentIndex].waveformArray[i].stopPosition = this.offsetLeft + this.width;
                        waveform = app.trackObjects[currentIndex].waveformArray[i];
                    }
                }

                //only call dragging action if waveform is being dragged to different track
                for (var i = 0; i < app.trackObjects.length; i++){
                    var rect = document.getElementById("waveform_container" + app.trackObjects[i].id).getBoundingClientRect();
                    var trackPosition = rect.top + document.getElementById("track_container").scrollTop - 80;
                    if (trackPosition == stopPosition && app.trackObjects[i].id != this.id.charAt(8)){
                        waveform.appendWaveformTo(stopPosition, elementMouseIsOver, app);
                    }
                }
            }
        });
    },

    appendWaveformTo:function(position, element, app){
        var previousTrackId = element.id.charAt(8);
        var waveformAudioBuffer;
        var draggedWaveformNum = element.id.replace(/[a-z]/g, '');
        draggedWaveformNum = String(draggedWaveformNum).substr(1);

        var previousIndex;
            for (var i = 0; i < app.trackObjects.length; i++){
                if (app.trackObjects[i].id == previousTrackId){
                    previousIndex = i;
                }
            }
        var newActiveTrackIndex;
        for (var i = 0; i < app.trackObjects.length; i++){
                if (app.trackObjects[i].id == app.activeTrackId){
                    newActiveTrackIndex = i;
                }
            }

        //get the audio buffer of dragged waveform, go over the waveformArray of the original track
        for (var i = 0; i < app.trackObjects[previousIndex].waveformArray.length; i++){
            //compare the waveformCounts/numbers of each waveformarray in the array with the correct waveformCount of the clicked waveform
            if (app.trackObjects[previousIndex].waveformArray[i].reference == element){
                //when found save the AudioBuffer in variable
                waveformAudioBuffer = app.trackObjects[previousIndex].waveformArray[i].audioBuffer;
            }
        }

        //go over each track, lowlight it and get the track where wavefrom has been dragged to
        for (var i = 0; i < app.trackObjects.length; i++){
            var rect = document.getElementById("waveform_container" + app.trackObjects[i].id).getBoundingClientRect();
            var trackPosition = rect.top + document.getElementById("track_container").scrollTop - 80;
            app.highlightTrack(app.trackObjects[i].id, 0.3);

            //if position of waveform and track match (and track is not the same track as before), create a new waveform at same position
            //and save all data to it, then delete dragged waveform (complicated way because of positioning glitches)
            if (trackPosition == position){

                app.createWaveform(i, app);
                var newWaveform = document.getElementById("waveform" + app.trackObjects[i].id + app.trackObjects[i].waveformCount + "0");
                var newWaveformCtx = newWaveform.getContext('2d');
                newWaveform.width = element.width;
                newWaveform.style.left = element.style.left;
                newWaveformCtx.drawImage(element, 0, 0);

                //create new waveform object and append to track
                var newWaveformObject = new WaveformObject(app.activeTrackId);
                newWaveformObject.id = newWaveform.id.slice(9);
                newWaveformObject.reference = newWaveform;
                newWaveformObject.startPosition = newWaveform.offsetLeft;
                newWaveformObject.stopPosition = newWaveform.offsetLeft + newWaveform.width;
                newWaveformObject.length = newWaveformObject.stopPosition - newWaveformObject.startPosition;
                newWaveformObject.audioBuffer = waveformAudioBuffer;
                newWaveformObject.colorWaveform(newWaveform, i, app);
                newWaveformObject.addWaveformDeleteButton(newWaveform, app, newWaveformObject);
                app.trackObjects[i].waveformArray.push(newWaveformObject);

                app.trackObjects[i].waveformCount++;

                newWaveformObject.makeWaveformDraggable(app);

                //delete dragged waveform canvas
                element.remove();

                //set the track where waveform was dragged to as active track
                app.highlightTrack(app.trackObjects[i].id, 0.6);
                app.activeTrackId = app.trackObjects[i].id;
            }
        }

        //delete dragged waveform from waveformarray
        for (var i = 0; i < app.trackObjects[previousIndex].waveformArray.length; i++){
            if (app.trackObjects[previousIndex].waveformArray[i].reference == element){
                app.trackObjects[previousIndex].waveformArray.splice(i, 1);
                break;
            }
        }
    }
}
