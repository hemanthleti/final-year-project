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

let latestReport = null;

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
  Ringworm: {
    severity: "Mild to Moderate",
    severityPercent: 44,
    symptoms: "Ring-shaped rash, itching, scaling edges, redness, and outward lesion spread.",
    precautions: "Keep the area dry, avoid sharing towels or clothing, and maintain good hygiene to reduce spread.",
    treatment: "General treatment may include topical antifungal care and professional review if lesions spread or persist.",
    notice: "Consult a certified dermatologist if the infection is widespread, persistent, or affecting sensitive areas."
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

function updatePreview(file) {
  if (!preview) {
    return;
  }

  if (!file) {
    preview.src = "";
    preview.style.display = "none";
    if (previewPlaceholder) {
      previewPlaceholder.classList.remove("hidden");
    }
    return;
  }

  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
  if (previewPlaceholder) {
    previewPlaceholder.classList.add("hidden");
  }
}

async function analyze() {
  if (!imageInput || !imageInput.files[0]) {
    renderError("Please upload a clear skin image before starting AI analysis.");
    return;
  }

  const formData = new FormData();
  formData.append("skin_image", imageInput.files[0]);

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
}

function toggleLoading(isLoading) {
  if (!loader) {
    return;
  }

  loader.style.display = isLoading ? "block" : "none";
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

  const reportText = [
    "DermaSphere AI Skin Screening Report",
    "-----------------------------------",
    `Disease prediction: ${latestReport.disease}`,
    `Confidence score: ${latestReport.confidence}`,
    `Severity: ${latestReport.severity} (${latestReport.severityPercent}%)`,
    `Symptoms: ${latestReport.symptoms}`,
    `Precautions: ${latestReport.precautions}`,
    `Treatment suggestions: ${latestReport.treatment}`,
    `Doctor consultation warning: ${latestReport.notice}`,
    "",
    `Medical disclaimer: ${latestReport.disclaimer}`
  ].join("\n");

  const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "dermasphere-ai-report.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
