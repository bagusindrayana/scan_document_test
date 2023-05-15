/*! jscanify v1.2.0 | (c) ColonelParrot and other contributors | MIT License */

(function (global, factory) {
    typeof exports === "object" && typeof module !== "undefined"
        ? (module.exports = factory())
        : typeof define === "function" && define.amd
            ? define(factory)
            : (global.jscanify = factory());
})(this, function () {
    "use strict";

    /**
     * Calculates distance between two points. Each point must have `x` and `y` property
     * @param {*} p1 point 1
     * @param {*} p2 point 2
     * @returns distance between two points
     */
    function distance(p1, p2) {
        return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }

    class jscanify {
        constructor() {
            this.topLeftCorner = null;
            this.topRightCorner = null;
            this.bottomLeftCorner = null;
            this.bottomRightCorner = null;
            this.points = [];
            this.canvas = null;
            this.img = null;
        }

        /**
         * Finds the contour of the paper within the image
         * @param {*} img image to process (cv.Mat)
         * @returns the biggest contour inside the image
         */
        findPaperContour(img) {
            const imgGray = new cv.Mat();
            cv.cvtColor(img, imgGray, cv.COLOR_RGBA2GRAY);

            const imgBlur = new cv.Mat();
            cv.GaussianBlur(
                imgGray,
                imgBlur,
                new cv.Size(5, 5),
                0,
                0,
                cv.BORDER_DEFAULT
            );

            const imgThresh = new cv.Mat();
            cv.threshold(
                imgBlur,
                imgThresh,
                0,
                255,
                cv.THRESH_BINARY + cv.THRESH_OTSU
            );

            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();

            cv.findContours(
                imgThresh,
                contours,
                hierarchy,
                cv.RETR_CCOMP,
                cv.CHAIN_APPROX_SIMPLE
            );
            let maxArea = 0;
            let maxContourIndex = -1;
            for (let i = 0; i < contours.size(); ++i) {
                let contourArea = cv.contourArea(contours.get(i));
                if (contourArea > maxArea) {
                    maxArea = contourArea;
                    maxContourIndex = i;
                }
            }

            const maxContour = contours.get(maxContourIndex);

            imgGray.delete();
            imgBlur.delete();
            imgThresh.delete();
            contours.delete();
            hierarchy.delete();
            return maxContour;
        }

        /**
         * Highlights the paper detected inside the image.
         * @param {*} image image to process
         * @param {*} options options for highlighting. Accepts `color` and `thickness` parameter
         * @returns `HTMLCanvasElement` with original image and paper highlighted
         */
        highlightPaper(image, options) {
            options = options || {};
            options.color = options.color || "orange";
            options.thickness = options.thickness || 10;
            const canvas = document.createElement("canvas");
            // this.canvas = canvas;
            const ctx = canvas.getContext("2d");
            const img = cv.imread(image);

            const maxContour = this.findPaperContour(img);
            cv.imshow(canvas, img);
            if (maxContour) {
                const {
                    topLeftCorner,
                    topRightCorner,
                    bottomLeftCorner,
                    bottomRightCorner,
                } = this.getCornerPoints(maxContour, img);

                if (
                    topLeftCorner &&
                    topRightCorner &&
                    bottomLeftCorner &&
                    bottomRightCorner
                ) {
                    ctx.strokeStyle = options.color;
                    ctx.lineWidth = options.thickness;
                    ctx.beginPath();
                    ctx.moveTo(...Object.values(topLeftCorner));
                    ctx.lineTo(...Object.values(topRightCorner));
                    ctx.lineTo(...Object.values(bottomRightCorner));
                    ctx.lineTo(...Object.values(bottomLeftCorner));
                    ctx.lineTo(...Object.values(topLeftCorner));
                    ctx.stroke();
                    this.topLeftCorner = topLeftCorner;
                    this.topRightCorner = topRightCorner;
                    this.bottomLeftCorner = bottomLeftCorner;
                    this.bottomRightCorner = bottomRightCorner;

                }
            }

            img.delete();
            return canvas;
        }

        editablePrespectiveTransform(img,canvas) {
            if(canvas != null){
                this.canvas = canvas;
            }
            this.img = img;
            // this.points = [this.topLeftCorner, this.topRightCorner, this.bottomLeftCorner, this.bottomRightCorner];
            
            this.drawPoints(this.canvas, this.points);
            console.log(this.points);
        }

        draw(){
            let context = this.canvas.getContext("2d");
            context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            context.drawImage(this.img,0,0,this.canvas.width,this.canvas.height);
            context.strokeStyle = 'orange';
            context.lineWidth = 10;
            context.beginPath();

            
            context.moveTo(...Object.values(this.points[0]));
            context.lineTo(...Object.values(this.points[1]));
            context.lineTo(...Object.values(this.points[2]));
            context.lineTo(...Object.values(this.points[3]));
            context.lineTo(...Object.values(this.points[0]));
            context.stroke();
            this.drawPoints(this.canvas, this.points);
        }

        



        /**
         * Extracts and undistorts the image detected within the frame.
         * @param {*} image image to process
         * @param {*} resultWidth desired result paper width
         * @param {*} resultHeight desired result paper height
         * @param {*} cornerPoints optional custom corner points, in case automatic corner points are incorrect
         * @returns `HTMLCanvasElement` containing undistorted image
         */
        extractPaper(image, resultWidth, resultHeight, cornerPoints,myCanvas) {
            const canvas = myCanvas || document.createElement("canvas");

            const img = cv.imread(image);

            const maxContour = this.findPaperContour(img);

            const {
                topLeftCorner,
                topRightCorner,
                bottomLeftCorner,
                bottomRightCorner,
            } = cornerPoints || this.getCornerPoints(maxContour, img);
            let warpedDst = new cv.Mat();

            let dsize = new cv.Size(resultWidth, resultHeight);
            let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
                topLeftCorner.x,
                topLeftCorner.y,
                topRightCorner.x,
                topRightCorner.y,
                bottomLeftCorner.x,
                bottomLeftCorner.y,
                bottomRightCorner.x,
                bottomRightCorner.y,
            ]);

            let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
                0,
                0,
                resultWidth,
                0,
                0,
                resultHeight,
                resultWidth,
                resultHeight,
            ]);

            let M = cv.getPerspectiveTransform(srcTri, dstTri);
            cv.warpPerspective(
                img,
                warpedDst,
                M,
                dsize,
                cv.INTER_LINEAR,
                cv.BORDER_CONSTANT,
                new cv.Scalar()
            );

            cv.imshow(canvas, warpedDst);


            img.delete()
            warpedDst.delete()
            return canvas;
        }

        /**
         * Calculates the corner points of a contour.
         * @param {*} contour contour from {@link findPaperContour}
         * @returns object with properties `topLeftCorner`, `topRightCorner`, `bottomLeftCorner`, `bottomRightCorner`, each with `x` and `y` property
         */
        getCornerPoints(contour) {
            let rect = cv.minAreaRect(contour);
            const center = rect.center;

            let topLeftCorner;
            let topLeftCornerDist = 0;

            let topRightCorner;
            let topRightCornerDist = 0;

            let bottomLeftCorner;
            let bottomLeftCornerDist = 0;

            let bottomRightCorner;
            let bottomRightCornerDist = 0;

            for (let i = 0; i < contour.data32S.length; i += 2) {
                const point = { x: contour.data32S[i], y: contour.data32S[i + 1] };
                const dist = distance(point, center);
                if (point.x < center.x && point.y < center.y) {
                    // top left
                    if (dist > topLeftCornerDist) {
                        topLeftCorner = point;
                        topLeftCornerDist = dist;
                    }
                } else if (point.x > center.x && point.y < center.y) {
                    // top right
                    if (dist > topRightCornerDist) {
                        topRightCorner = point;
                        topRightCornerDist = dist;
                    }
                } else if (point.x < center.x && point.y > center.y) {
                    // bottom left
                    if (dist > bottomLeftCornerDist) {
                        bottomLeftCorner = point;
                        bottomLeftCornerDist = dist;
                    }
                } else if (point.x > center.x && point.y > center.y) {
                    // bottom right
                    if (dist > bottomRightCornerDist) {
                        bottomRightCorner = point;
                        bottomRightCornerDist = dist;
                    }
                }
            }

            return {
                topLeftCorner,
                topRightCorner,
                bottomLeftCorner,
                bottomRightCorner,
            };
        }

        drawPoints(canvas, points) {
            let context = canvas.getContext('2d');
            for (var i = 0; i < points.length; i++) {
                var circle = points[i];

                // 绘制圆圈
                context.globalAlpha = 0.85;
                context.beginPath();
                context.arc(circle.x, circle.y, 20, 0, Math.PI * 2);
                context.fillStyle = "yellow";
                context.strokeStyle = "yellow";
                context.lineWidth = 1;
                context.fill();
                // context.stroke();
                // context.beginPath();
                // context.moveTo(circle.x, circle.y);
                // context.lineTo(points[i - 1 >= 0 ? i - 1 : 3].x, points[i - 1 >= 0 ? i - 1 : 3].y);
                // context.stroke();

            }
        }
    }

    return jscanify;
});