from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import numpy as np
import cv2
from tensorflow.keras.models import load_model

app = Flask(__name__)
CORS(app)

MODEL_PATH = "skin_disease_model.h5"
LABELS_PATH = "labels.npy"

model = load_model(MODEL_PATH)
labels = np.load(LABELS_PATH)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/faq")
def faq():
    return render_template("faq.html")

@app.route("/diseases")
def diseases():
    return render_template("diseases.html")

@app.route("/api/analyze", methods=["POST"])
def analyze():

    if "skin_image" not in request.files:
        return jsonify({"error":"No image uploaded"}),400

    file = request.files["skin_image"]

    img = np.frombuffer(file.read(), np.uint8)
    img = cv2.imdecode(img, cv2.IMREAD_COLOR)

    img = cv2.resize(img,(64,64))
    img = img/255.0
    img = np.expand_dims(img,axis=0)

    prediction = model.predict(img)

    index = np.argmax(prediction)
    disease = labels[index]
    confidence = float(np.max(prediction))

    return jsonify({
        "disease":disease,
        "confidence":confidence
    })


if __name__ == "__main__":
    app.run(debug=True)