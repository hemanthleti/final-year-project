import os
import cv2
import numpy as np
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense
from tensorflow.keras.utils import to_categorical

DATASET_DIR = "dataset"
TRAIN_DIR = os.path.join(DATASET_DIR, "train")
TEST_DIR = os.path.join(DATASET_DIR, "test")
IMAGE_SIZE = (64, 64)


def load_split(split_dir):
    images = []
    labels = []
    counts = {}

    if not os.path.isdir(split_dir):
        raise ValueError(f"Missing dataset split directory: {split_dir}")

    for disease in sorted(os.listdir(split_dir)):
        disease_dir = os.path.join(split_dir, disease)
        if not os.path.isdir(disease_dir):
            continue

        counts[disease] = 0
        for image_name in sorted(os.listdir(disease_dir)):
            image_path = os.path.join(disease_dir, image_name)
            img = cv2.imread(image_path)
            if img is None:
                continue

            img = cv2.resize(img, IMAGE_SIZE)
            images.append(img)
            labels.append(disease)
            counts[disease] += 1

    if not images:
        raise ValueError(f"No valid images found in {split_dir}")

    return np.array(images, dtype=np.float32) / 255.0, np.array(labels), counts


X_train, y_train_labels, train_counts = load_split(TRAIN_DIR)
X_test, y_test_labels, test_counts = load_split(TEST_DIR)

all_classes = sorted(set(y_train_labels) | set(y_test_labels))
if not all_classes:
    raise ValueError("No disease classes found in dataset.")

le = LabelEncoder()
le.fit(all_classes)

y_train = to_categorical(le.transform(y_train_labels), num_classes=len(le.classes_))
y_test = to_categorical(le.transform(y_test_labels), num_classes=len(le.classes_))

model = Sequential([
    Conv2D(32, (3, 3), activation="relu", input_shape=(64, 64, 3)),
    MaxPooling2D((2, 2)),
    Conv2D(64, (3, 3), activation="relu"),
    MaxPooling2D((2, 2)),
    Flatten(),
    Dense(128, activation="relu"),
    Dense(len(le.classes_), activation="softmax"),
])

model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

model.fit(
    X_train,
    y_train,
    epochs=10,
    validation_data=(X_test, y_test),
)

model.save("skin_disease_model.h5")
np.save("labels.npy", le.classes_)

print("Training split counts:")
for disease in le.classes_:
    print(f"  {disease}: {train_counts.get(disease, 0)} train / {test_counts.get(disease, 0)} test")

print("Model training complete and saved.")
