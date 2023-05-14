//window onload
window.addEventListener('load', function () {
    if (!window.jsPDF ) {window.jsPDF = window.jspdf.jsPDF; };
    console.log(jsPDF);
    console.log(window.jsPDF);
    let pause = false;
    const scanner = new jscanify();
    const canvasCtx = canvas.getContext("2d");
    const resultCtx = result.getContext("2d");
    let stream_width = canvas.width;
    let stream_height = canvas.height;
    let video_w = 0;
    let video_h = 0;
    var h, w;

    function setup() {
        // get window width
        w = wrapper.offsetWidth;
        resumeWebCam();
        // calculate canvas height
        h = (w * 3) / 2;
        // get video scaling ratio
        var ratio = h / stream_height;
        // recalculate video width
        video_w = stream_width * ratio;
        video_h = h;
       
    }

    setup();

    function startHighlight(stream) {
        result.style.display = "block";
        let stream_settings = stream.getVideoTracks()[0].getSettings();
        stream_width = stream_settings.width;
        stream_height = stream_settings.height;
        
        canvas.width = w;
        canvas.height = h;
        result.width = w;
        result.height = h;
        //set canvas width and height
        // canvas.width = stream_width;
        // canvas.height = stream_height;
        // result.width = stream_width;
        // result.height = stream_height;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            if (pause) {
                return;
            }
            video.play();

            setInterval(() => {
                canvasCtx.drawImage(video, 0, 0, w, h);
                const resultCanvas = scanner.highlightPaper(canvas);
                resultCtx.drawImage(resultCanvas, 0, 0, w, h);

            }, 10);
        };
    }

    

    function pauseWebCam() {
        pause = true;
        stream = video.srcObject;
        // now get all tracks
        tracks = stream.getTracks();
        // now close each track by having forEach loop
        tracks.forEach(function (track) {
            // stopping every track
            track.stop();
        });
        // assign null to srcObject of video
        video.srcObject = null;
    }

    function resumeWebCam() {
        pause = false;
        //navigator.mediaDevices.enumerateDevices().then(gotDevices);
        navigator.mediaDevices.getUserMedia({
            video: true, audio: false,
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        }).then((stream) => {
            startHighlight(stream);
        });
    }

    scan.addEventListener('click', async function () {
        result.style.display = "none";
        pauseWebCam();
        console.log("scan");
        const new_canvas = document.createElement("canvas");
        new_canvas.width = w;
        new_canvas.height = h;
        //let image_data_url = canvas.toDataURL();
        image.src = canvas.toDataURL();
        // const resultCanvas = scanner.extractPaper(canvas, stream_width, stream_height);
        scanned.innerHTML = "";
        scanned.appendChild(new_canvas);
        scanned.style.display = "block";

        let context = new_canvas.getContext("2d");
        new_canvas.onmousedown = canvasClick;
        new_canvas.onmouseup = stopDragging;
        new_canvas.onmouseout = stopDragging;
        new_canvas.onmousemove = dragCircle;

        scanner.points = [
            scanner.topLeftCorner,
            scanner.topRightCorner,
            scanner.bottomRightCorner,
            scanner.bottomLeftCorner
        ];

        scanner.editablePrespectiveTransform(image, new_canvas);
        after_scan.style.display = "block";
        scan.style.display = "none";
    });

    cancel.addEventListener('click', async function () {
        scanned.innerHTML = "";
        scanned.style.display = "none";
        result.style.display = "block";
        
        resumeWebCam();

        after_scan.style.display = "none";
        scan.style.display = "inline-block";
    });

    save.addEventListener('click',function(){
        const resultCanvas = scanner.extractPaper(canvas, stream_width, stream_height,{
            topLeftCorner: scanner.points[0],
            topRightCorner: scanner.points[1],
            bottomRightCorner: scanner.points[2],
            bottomLeftCorner: scanner.points[3]
        });
        scanned.innerHTML = "";
        scanned.appendChild(resultCanvas);
        scanned.style.display = "block";
        after_scan.style.display = "none";
        after_save.style.display = "block";
    });

    download.addEventListener("click", function() {
       
        //find canvas inside scanned
        var canvas = scanned.querySelector("canvas");
        var imgData = canvas.toDataURL("image/jpeg", 1.0);
        var pdf = new window.jsPDF;
      
        pdf.addImage(imgData, 'JPEG', 0, 0);
        //filename with time
        const fileName = "scan_"+Date.now()+".pdf";
        pdf.save(fileName);
      }, false);

    try_again.addEventListener('click',function(){
        scanned.innerHTML = "";
        scanned.style.display = "none";
        scan.style.display = "inline-block";
        after_scan.style.display = "none";
        after_save.style.display = "none";
        resumeWebCam();
    });

    function canvasClick(e) {
        var x = e.pageX - e.target.offsetLeft;
        var y = e.pageY - e.target.offsetTop;

        for (var i = 0; i < scanner.points.length; i++) {

            if (Math.pow(scanner.points[i].x - x, 2) + Math.pow(scanner.points[i].y - y, 2) < 400) {
                scanner.points[i].selected = true;
                console.log(scanner.points[i]);
            } else {
                if (scanner.points[i].selected) scanner.points[i].selected = false;
            }
        }
    }
    function dragCircle(e) {
        if (scanner.points != null) {
            for (var i = 0; i < scanner.points.length; i++) if (scanner.points[i].selected) {
                scanner.points[i].x = e.pageX - e.target.offsetLeft;
                scanner.points[i].y = e.pageY - e.target.offsetTop;
            }
        }
        scanner.draw();
    }
    function stopDragging(e) {
        for (var i = 0; i < scanner.points.length; i++) {
            scanner.points[i].selected = false;
        }
    }
}, false);