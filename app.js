console.log("Script loaded");

const fileInput = document.getElementById("myFile");
const analyzeButton = document.getElementById("analyze-button");
const preview = document.getElementById("preview");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const resultText = document.getElementById("resultText");

function resizeCanvas() {
    canvas.width = preview.clientWidth;
    canvas.height = preview.clientHeight;
}

window.addEventListener("resize", () => {
    resizeCanvas();

    // redraw boxes after resize
    if (window.lastDetections) {
        drawBoxes(window.lastDetections);
    }
});

const classNames = {
    0: "No Tumor",
    1: "Tumor"
};

analyzeButton.addEventListener("click", async () => {
    console.log("Analyze button clicked");
    const file = fileInput.files[0];

    if (!file) {
        alert("Upload an MRI image first");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";

    preview.onload = async () => {
        requestAnimationFrame(async () => {
            resizeCanvas();
        
            const response = await fetch(
                "https://brain-website-backend.onrender.com/predict",
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();
            console.log("detections:", data.detections);

            window.lastDetections = data.detections; 
            drawBoxes(data.detections);
            showResults(data.detections);
        });
    };
});

function drawBoxes(detections) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / 512;
    const scaleY = canvas.height / 512;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.font = "16px Arial";

    detections.forEach(det => {
        let [x1, y1, x2, y2] = det.bbox;

        x1 *= scaleX;
        x2 *= scaleX;
        y1 *= scaleY;
        y2 *= scaleY;

        const posX = preview.offsetLeft + x1;
        const posY = preview.offsetTop + y1;

        ctx.strokeRect(posX, posY, x2 - x1, y2 - y1);

        ctx.fillText(
            `${classNames[det.class]} ${(det.confidence * 100).toFixed(1)}%`,
            posX,
            posY - 5
        );
    });
}

function showResults(detections) {
    if (detections.length === 0) {
        resultText.innerHTML = "<p>No detections found</p>";
        return;
    }

    resultText.innerHTML = detections.map(det =>
        `<p>${classNames[det.class]} — ${(det.confidence * 100).toFixed(1)}%</p>`
    ).join("");
}


const observer = new ResizeObserver(() => {
    resizeCanvas();

    if (window.lastDetections) {
        drawBoxes(window.lastDetections);
    }
});

observer.observe(preview);

/*
async function analyzeImage(file) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
        "https://brain-website-backend.onrender.com/predict",
        {
            method: "POST",
            body: formData
        }
    );

    const data = await response.json();
    console.log(data);
    return data;
}
*/
