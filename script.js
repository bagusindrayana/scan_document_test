//window onload
window.addEventListener('load', function () {
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
        w = window.innerWidth;
        // calculate canvas height
        h = (w * 9) / 16;
        // get video scaling ratio
        var ratio = h / stream_height;
        // recalculate video width
        video_w  = stream_width * ratio;
        video_h = h;
    }

    //navigator.mediaDevices.enumerateDevices().then(gotDevices);
    navigator.mediaDevices.getUserMedia({
        video: true, audio: false,
        video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
        }
    }).then((stream) => {

        let stream_settings = stream.getVideoTracks()[0].getSettings();
        console.log(stream_settings);
        stream_width = stream_settings.width;
        stream_height = stream_settings.height;
        setup();
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
            video.play();

            setInterval(() => {
                canvasCtx.drawImage(video, 0, 0, w, h);
                const resultCanvas = scanner.highlightPaper(canvas);
                resultCtx.drawImage(resultCanvas, 0, 0, w, h);

            }, 10);
        };
    });
    button.addEventListener('click', async function () {
        console.log("scan");
        // let image_data_url = canvas.toDataURL();
        // image.src = canvas.toDataURL();
        const resultCanvas = scanner.extractPaper(canvas, stream_width, stream_height);
        scanned.innerHTML = "";
        scanned.appendChild(resultCanvas);
    });
}, false);