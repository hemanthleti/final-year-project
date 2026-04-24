const preview = document.getElementById("preview");
const imageInput = document.getElementById("imageInput");
const uploadZone = document.getElementById("uploadZone");
const previewPlaceholder = document.getElementById("previewPlaceholder");
const loader = document.getElementById("loader");
const result = document.getElementById("result");
const progressList = document.getElementById("progressList");
const reportDisease = document.getElementById("reportDisease");
const reportMeta = document.getElementById("reportMeta");
const downloadReportBtn = document.getElementById("downloadReportBtn");
const zoomSlider = document.getElementById("zoomSlider");
const zoomValue = document.getElementById("zoomValue");
const uploadPreview = document.getElementById("uploadPreview");
const scanOverlay = document.getElementById("scanOverlay");

let latestReport = null;
let currentZoom = 1;

const medicalDisclaimer = "This AI system provides preliminary skin disease prediction based on image analysis. It is not a medical diagnosis and should not replace professional clinical evaluation. Please consult a certified dermatologist for proper diagnosis and treatment.";

const diseaseLibrary = {
  Acne: {
    severity: "Mild to Moderate",
    severityPercent: 38,
    symptoms: "Pimples, blackheads, whiteheads, inflamed bumps, oily skin, and localized tenderness.",
    precautions: "Avoid aggressive scrubbing, reduce pore-clogging products, keep the affected area clean, and avoid squeezing lesions.",
    treatment: "General care may include gentle cleansing, non-comedogenic products, and dermatologist review for persistent or scarring acne.",
    notice: "Consult a certified dermatologist if lesions are painful, cystic, recurrent, or leaving scars."
  },
  Candidiasis: {
    severity: "Moderate",
    severityPercent: 52,
    symptoms: "Redness, irritation, itching, moist skin folds, and fungal overgrowth in warm areas.",
    precautions: "Keep the area dry, reduce friction, maintain hygiene, and avoid prolonged moisture exposure.",
    treatment: "General treatment may include antifungal care and professional review if symptoms persist or worsen.",
    notice: "Consult a certified dermatologist if the rash spreads, becomes painful, or keeps recurring."
  },
  Eczema: {
    severity: "Moderate",
    severityPercent: 56,
    symptoms: "Dryness, redness, itching, irritation, rough patches, and recurring skin barrier flare-ups.",
    precautions: "Use regular moisturizer, avoid irritants, reduce scratching, and limit exposure to harsh soaps or very hot water.",
    treatment: "Supportive care may include barrier repair, trigger control, and clinically prescribed topical treatment when needed.",
    notice: "Consult a certified dermatologist if the skin is cracked, infected, or itching is severe and persistent."
  },
  Psoriasis: {
    severity: "Moderate to High",
    severityPercent: 74,
    symptoms: "Scaly plaques, thicker skin, redness, itching, flaking, and chronic inflammatory recurrence.",
    precautions: "Keep the skin moisturized, avoid trauma to affected areas, and monitor for worsening or widespread plaques.",
    treatment: "Clinical management may involve topical medication, phototherapy, or dermatologist-guided therapy depending on severity.",
    notice: "Consult a certified dermatologist for confirmation and long-term management of psoriasis symptoms."
  },
  Rosacea: {
    severity: "Moderate",
    severityPercent: 48,
    symptoms: "Facial redness, flushing, sensitivity, visible irritation, and inflammation in central facial areas.",
    precautions: "Avoid heat triggers, harsh skincare products, excessive sun exposure, and monitor worsening redness.",
    treatment: "Supportive care may include trigger reduction and dermatologist-guided topical or oral treatment when needed.",
    notice: "Consult a certified dermatologist if facial redness becomes persistent, painful, or progressively worse."
  },
  Tinea: {
    severity: "Mild to Moderate",
    severityPercent: 44,
    symptoms: "Ring-shaped rash, itching, scaling edges, redness, and outward lesion spread.",
    precautions: "Keep the area dry, avoid sharing towels or clothing, and maintain good hygiene to reduce spread.",
    treatment: "General treatment may include topical antifungal care and professional review if lesions spread or persist.",
    notice: "Consult a certified dermatologist if the infection is widespread, persistent, or affecting sensitive areas."
  },
  Vitiligo: {
    severity: "Variable",
    severityPercent: 34,
    symptoms: "Clearly defined lighter skin patches, pigment loss, and contrast changes in affected regions.",
    precautions: "Protect depigmented skin from sun exposure and monitor the spread or change in affected areas.",
    treatment: "Management may include dermatologist-guided therapies focused on pigmentation support and skin protection.",
    notice: "Consult a certified dermatologist for confirmation and discussion of long-term treatment options."
  },
  Warts: {
    severity: "Mild to Moderate",
    severityPercent: 42,
    symptoms: "Rough, raised, localized skin growths that may vary in size, texture, and sensitivity.",
    precautions: "Avoid picking lesions, maintain hygiene, and reduce direct spread through skin contact.",
    treatment: "Treatment may include topical care or dermatologist-guided removal methods depending on location and severity.",
    notice: "Consult a certified dermatologist if lesions are painful, spreading, or occurring in sensitive areas."
  }
};

if (imageInput) {
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    updatePreview(file);
    markProgress("ready");
  });
}

if (uploadZone && imageInput) {
  ["dragenter", "dragover"].forEach((eventName) => {
    uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      uploadZone.classList.remove("dragover");
    });
  });

  uploadZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer.files[0];
    if (!file) {
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(file);
    imageInput.files = transfer.files;
    updatePreview(file);
    markProgress("ready");
  });
}

if (downloadReportBtn) {
  downloadReportBtn.addEventListener("click", downloadReport);
}

if (zoomSlider && preview) {
  zoomSlider.addEventListener("input", () => {
    currentZoom = Number(zoomSlider.value) / 100;
    preview.style.transform = `scale(${currentZoom})`;
    if (zoomValue) {
      zoomValue.textContent = `${zoomSlider.value}%`;
    }
  });
}

function updatePreview(file) {
  if (!preview) {
    return;
  }

  if (!file) {
    preview.src = "";
    preview.style.display = "none";
    if (uploadPreview) {
      uploadPreview.src = "";
      uploadPreview.classList.add("hidden");
    }
    if (previewPlaceholder) {
      previewPlaceholder.classList.remove("hidden");
    }
    if (scanOverlay) {
      scanOverlay.classList.add("hidden");
      scanOverlay.classList.remove("scanning");
    }
    return;
  }

  const imageUrl = URL.createObjectURL(file);
  preview.src = imageUrl;
  preview.style.display = "block";
  preview.style.transform = `scale(${currentZoom})`;
  if (uploadPreview) {
    uploadPreview.src = imageUrl;
    uploadPreview.classList.remove("hidden");
  }
  if (previewPlaceholder) {
    previewPlaceholder.classList.add("hidden");
  }
  if (scanOverlay) {
    scanOverlay.classList.remove("hidden");
  }
}

async function analyze() {
  if (!imageInput || !imageInput.files[0]) {
    renderError("Please upload a clear skin image before starting AI analysis.");
    return;
  }

  startScanAnimation();
  const formData = new FormData();
  const uploadFile = await buildZoomedImageFile(imageInput.files[0]);
  formData.append("skin_image", uploadFile);

  toggleLoading(true);
  markProgress("analyzing");

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || "The AI analysis could not be completed.");
    }

    renderResult(data.disease, Number(data.confidence));
    markProgress("completed");
  } catch (error) {
    renderError(error.message || "Something went wrong while analyzing the image.");
    markProgress("error");
  } finally {
    toggleLoading(false);
    stopScanAnimation();
  }
}

function renderResult(disease, confidence) {
  const info = diseaseLibrary[disease] || {
    severity: "Needs clinical review",
    severityPercent: 50,
    symptoms: "Visible skin changes may require direct professional examination for accurate identification.",
    precautions: "Avoid irritation, monitor symptoms carefully, and seek professional clinical evaluation.",
    treatment: "Consult a certified dermatologist for diagnosis and treatment guidance.",
    notice: "Consult a certified dermatologist for proper diagnosis and treatment."
  };

  const confidencePercent = `${(confidence * 100).toFixed(2)}%`;

  if (result) {
    result.innerHTML = `
      <article class="result-card glass-subcard">
        <span>Disease prediction</span>
        <strong>${disease}</strong>
        <p>Primary disease class selected by the AI model from the uploaded image.</p>
      </article>
      <article class="result-card glass-subcard">
        <span>Confidence score</span>
        <strong>${confidencePercent}</strong>
        <p>The score reflects how strongly the model favored the detected class.</p>
      </article>
      <article class="result-card glass-subcard">
        <span>Severity meter</span>
        <strong>${info.severity}</strong>
        <div class="severity-meter">
          <div class="severity-fill" style="width: ${info.severityPercent}%"></div>
        </div>
        <p>This is a screening support indicator, not a clinical severity measurement.</p>
      </article>
      <article class="result-card glass-subcard">
        <span>Dermatologist consultation recommendation</span>
        <strong>Professional review recommended</strong>
        <p>${info.notice}</p>
      </article>
      <article class="result-card glass-subcard full">
        <span>Symptoms</span>
        <p>${info.symptoms}</p>
      </article>
      <article class="result-card glass-subcard full">
        <span>Precautions</span>
        <p>${info.precautions}</p>
      </article>
      <article class="result-card glass-subcard full">
        <span>Treatment suggestions</span>
        <p>${info.treatment}</p>
      </article>
      <article class="result-card glass-subcard full disclaimer-card">
        <span>Medical disclaimer</span>
        <p>${medicalDisclaimer}</p>
      </article>
    `;
  }

  latestReport = {
    disease,
    confidence: confidencePercent,
    severity: info.severity,
    severityPercent: info.severityPercent,
    symptoms: info.symptoms,
    precautions: info.precautions,
    treatment: info.treatment,
    notice: info.notice,
    disclaimer: medicalDisclaimer
  };

  if (reportDisease) {
    reportDisease.textContent = `${disease} detected`;
  }

  if (reportMeta) {
    reportMeta.textContent = `Confidence ${confidencePercent} | Severity ${info.severity}`;
  }
}

function renderError(message) {
  if (result) {
    result.innerHTML = `
      <article class="result-card glass-subcard full">
        <span>Analysis status</span>
        <strong>Unable to complete screening</strong>
        <p>${message}</p>
      </article>
      <article class="result-card glass-subcard full disclaimer-card">
        <span>Medical disclaimer</span>
        <p>${medicalDisclaimer}</p>
      </article>
    `;
  }

  latestReport = null;

  if (reportDisease) {
    reportDisease.textContent = "No analysis completed";
  }

  if (reportMeta) {
    reportMeta.textContent = message;
  }

  stopScanAnimation();
}

function toggleLoading(isLoading) {
  if (!loader) {
    return;
  }

  loader.style.display = isLoading ? "block" : "none";
}

function startScanAnimation() {
  if (scanOverlay) {
    scanOverlay.classList.add("scanning");
    scanOverlay.classList.remove("hidden");
  }
}

function stopScanAnimation() {
  if (scanOverlay) {
    scanOverlay.classList.remove("scanning");
  }
}

function markProgress(stage) {
  if (!progressList) {
    return;
  }

  const items = progressList.querySelectorAll(".progress-item");
  items.forEach((item) => item.classList.remove("active", "completed"));

  if (stage === "ready" || stage === "analyzing") {
    items[0]?.classList.add("completed");
    items[1]?.classList.add("active");
  } else if (stage === "completed") {
    items.forEach((item) => item.classList.add("completed"));
  } else if (stage === "error") {
    items[0]?.classList.add("completed");
    items[2]?.classList.add("active");
  } else {
    items[0]?.classList.add("active");
  }
}

function downloadReport() {
  if (!latestReport) {
    renderError("Run a successful analysis before downloading the medical report.");
    return;
  }

  const reportWindow = window.open("", "_blank", "width=960,height=900");
  if (!reportWindow) {
    renderError("Popup blocked. Please allow popups to download the structured medical report.");
    return;
  }

  const reportHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DermaSphere AI Report</title>
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f4f8fc;
          color: #17324a;
        }
        .page {
          max-width: 900px;
          margin: 32px auto;
          background: #ffffff;
          border: 1px solid #d9e5ef;
          border-radius: 24px;
          box-shadow: 0 18px 40px rgba(35, 74, 117, 0.08);
          overflow: hidden;
        }
        .header {
          padding: 28px 32px;
          background: linear-gradient(135deg, #edf7ff, #eefaf7);
          border-bottom: 1px solid #d9e5ef;
        }
        .header h1 {
          margin: 0 0 8px;
          font-size: 28px;
        }
        .header p {
          margin: 0;
          color: #607f95;
          line-height: 1.6;
        }
        .section {
          padding: 28px 32px;
          border-bottom: 1px solid #edf2f7;
        }
        .section:last-child {
          border-bottom: none;
        }
        .section h2 {
          margin: 0 0 16px;
          font-size: 18px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .card {
          padding: 18px;
          border: 1px solid #d9e5ef;
          border-radius: 18px;
          background: #f9fcff;
        }
        .card span {
          display: block;
          font-size: 12px;
          color: #6b8498;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .card strong {
          display: block;
          font-size: 18px;
          margin-bottom: 6px;
        }
        .full {
          grid-column: 1 / -1;
        }
        .meter {
          height: 10px;
          background: #e8eef6;
          border-radius: 999px;
          overflow: hidden;
          margin-top: 10px;
        }
        .meter-fill {
          height: 100%;
          width: ${latestReport.severityPercent}%;
          background: linear-gradient(90deg, #37b7aa, #4d7cff);
          border-radius: 999px;
        }
        .note {
          color: #607f95;
          line-height: 1.7;
          margin: 0;
        }
        .disclaimer {
          background: #f7fbff;
        }
        .footer {
          padding: 18px 32px 28px;
          color: #7b92a4;
          font-size: 13px;
        }
        .actions {
          padding: 0 32px 28px;
        }
        .print-btn {
          border: none;
          border-radius: 999px;
          padding: 12px 18px;
          background: linear-gradient(135deg, #3e7bd6, #2fb7aa);
          color: white;
          font-weight: 700;
          cursor: pointer;
        }
        @media print {
          body {
            background: white;
          }
          .page {
            margin: 0;
            box-shadow: none;
            border: none;
            border-radius: 0;
          }
          .actions {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <h1>DermaSphere AI Skin Screening Report</h1>
          <p>Structured preliminary AI-generated skin condition report for review and presentation.</p>
        </div>

        <div class="section">
          <h2>Prediction Summary</h2>
          <div class="grid">
            <div class="card">
              <span>Disease Prediction</span>
              <strong>${latestReport.disease}</strong>
              <p class="note">Primary disease class selected by the AI model.</p>
            </div>
            <div class="card">
              <span>Confidence Score</span>
              <strong>${latestReport.confidence}</strong>
              <p class="note">Model confidence based on uploaded image analysis.</p>
            </div>
            <div class="card full">
              <span>Severity Level</span>
              <strong>${latestReport.severity}</strong>
              <div class="meter"><div class="meter-fill"></div></div>
              <p class="note">Visual severity meter shown as a screening support indicator only.</p>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Clinical Guidance</h2>
          <div class="grid">
            <div class="card full">
              <span>Symptoms</span>
              <p class="note">${latestReport.symptoms}</p>
            </div>
            <div class="card full">
              <span>Precautions</span>
              <p class="note">${latestReport.precautions}</p>
            </div>
            <div class="card full">
              <span>Treatment Suggestions</span>
              <p class="note">${latestReport.treatment}</p>
            </div>
            <div class="card full">
              <span>Dermatologist Consultation Recommendation</span>
              <p class="note">${latestReport.notice}</p>
            </div>
          </div>
        </div>

        <div class="section disclaimer">
          <h2>Medical Disclaimer</h2>
          <p class="note">${latestReport.disclaimer}</p>
        </div>

        <div class="actions">
          <button class="print-btn" onclick="window.print()">Download / Print Report</button>
        </div>

        <div class="footer">
          Generated by DermaSphere AI. This document is intended for preliminary screening support only.
        </div>
      </div>
    </body>
    </html>
  `;

  reportWindow.document.open();
  reportWindow.document.write(reportHtml);
  reportWindow.document.close();
}

function buildZoomedImageFile(file) {
  return new Promise((resolve) => {
    if (!file || currentZoom <= 1) {
      resolve(file);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");

      const scale = 1 / currentZoom;
      const sw = img.width * scale;
      const sh = img.height * scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(file);
          return;
        }
        const processedFile = new File([blob], file.name, { type: "image/jpeg" });
        resolve(processedFile);
      }, "image/jpeg", 0.95);
    };
    img.src = URL.createObjectURL(file);
  });
}
