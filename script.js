//window onload
window.addEventListener('load', function () {
    if (!window.jsPDF) { window.jsPDF = window.jspdf.jsPDF; };
    const canvas = document.getElementById("canvas");
    const result = document.getElementById("result");
    const video = document.getElementById("video");
    const scan = document.getElementById("scan");
    const cancel = document.getElementById("cancel");
    const save = document.getElementById("save");
    const scanned = document.getElementById("scanned");
    const after_scan = document.getElementById("after_scan");
    const after_save = document.getElementById("after_save");
    const download = document.getElementById("download");
    const try_again = document.getElementById("try_again");

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
                if (pause) {
                    return;
                }
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
        const new_canvas = document.getElementById("scanned");
        new_canvas.width = w;
        new_canvas.height = h;
        //let image_data_url = canvas.toDataURL();
        image.src = canvas.toDataURL();
        // const resultCanvas = scanner.extractPaper(canvas, stream_width, stream_height);


        interact(new_canvas)
            .draggable({
                max: Infinity,
                maxPerElement: Infinity,
                listeners: {
                    // draw colored squares on move
                    move: function (e) {
                        //var context = event.target.getContext('2d')
                        // calculate the angle of the drag direction
                        // console.log(event.client);
                        // var dragAngle = 180 * Math.atan2(event.dx, event.dy) / Math.PI

                        // // set color based on drag angle and speed
                        // context.fillStyle =
                        //     'hsl(' +
                        //     dragAngle +
                        //     ', 86%, ' +
                        //     (30 + Math.min(event.speed / 1000, 1) * 50) +
                        //     '%)'

                        // // draw squares
                        // context.fillRect(
                        //     event.pageX - pixelSize / 2,
                        //     event.pageY - pixelSize / 2,
                        //     pixelSize,
                        //     pixelSize
                        // )
                        //console.log(e);
                        dragCircle(e);
                    },
                    click:function (e) {
                        console.log(e);
                    }
                }
            })
            // clear the canvas on doubletap
            .on('doubletap', function (event) {
                // var context = event.target.getContext('2d')

                // context.clearRect(0, 0, context.canvas.width, context.canvas.height)
                //resizeCanvases()
            })

        // function resizeCanvases() {
        //     [].forEach.call(document.querySelectorAll('.rainbow-pixel-canvas'), function (
        //         canvas
        //     ) {
        //         delete canvas.width
        //         delete canvas.height

        //         var rect = canvas.getBoundingClientRect()

        //         canvas.width = rect.width
        //         canvas.height = rect.height
        //     })
        // }

        // resizeCanvases()

        // interact.js can also add DOM event listeners
        //interact(window).on('resize', resizeCanvases)

        // let context = new_canvas.getContext("2d");
        new_canvas.onmousedown = canvasClick;
        new_canvas.onmouseup = stopDragging;
        new_canvas.onmouseout = stopDragging;
        //new_canvas.onmousemove = dragCircle;

        //for mobile
        new_canvas.addEventListener("touchstart", canvasClick, false);
        new_canvas.addEventListener("touchend", stopDragging, false);
        new_canvas.addEventListener("touchcancel", stopDragging, false);
        //new_canvas.addEventListener("touchmove", dragCircle, false);

        scanner.points = [
            scanner.topLeftCorner,
            scanner.topRightCorner,
            scanner.bottomRightCorner,
            scanner.bottomLeftCorner
        ];

        setTimeout(() => {
            scanner.editablePrespectiveTransform(image, new_canvas);
            after_scan.style.display = "block";
            scan.style.display = "none";
            scanned.style.display = "block";
        }, 250);
    });

    cancel.addEventListener('click', async function () {
        // scanned.innerHTML = "";
        scanned.style.display = "none";
        result.style.display = "block";

        resumeWebCam();

        after_scan.style.display = "none";
        scan.style.display = "inline-block";
    });

    save.addEventListener('click', function () {
        scanner.extractPaper(canvas, stream_width, stream_height, {
            topLeftCorner: scanner.points[0],
            topRightCorner: scanner.points[1],
            bottomRightCorner: scanner.points[2],
            bottomLeftCorner: scanner.points[3]
        },scanned);
        //transfer resultCanvas to scanned
        
        // scanned.innerHTML = "";
        //scanned.appendChild(resultCanvas);
        scanned.style.display = "block";
        after_scan.style.display = "none";
        after_save.style.display = "block";
    });

    download.addEventListener("click", function () {

        //find canvas inside scanned
        var _canvas = scanned.querySelector("canvas");
        var imgData = _canvas.toDataURL("image/jpeg", 1.0);
        var pdf = new window.jsPDF;

        pdf.addImage(imgData, 'JPEG', 0, 0, w, h);
        //filename with time
        const fileName = "scan_" + Date.now() + ".pdf";
        pdf.save(fileName);
    }, false);

    try_again.addEventListener('click', function () {
        scanned.innerHTML = "";
        scanned.style.display = "none";
        scan.style.display = "inline-block";
        after_scan.style.display = "none";
        after_save.style.display = "none";
        resumeWebCam();
    });

    function canvasClick(e) {
        //console.log(e.pageX,e.target.offsetLeft);
        var x = e.pageX - e.target.offsetLeft;
        var y = e.pageY - e.target.offsetTop;

        for (var i = 0; i < scanner.points.length; i++) {

            if (Math.pow(scanner.points[i].x - x, 2) + Math.pow(scanner.points[i].y - y, 2) < 400) {
                scanner.points[i].selected = true;
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