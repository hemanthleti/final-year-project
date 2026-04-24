import os
import random
import cv2
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense
from tensorflow.keras.utils import to_categorical

DATASET_DIR = "dataset"
IMAGE_SIZE = (64, 64)
TARGET_IMAGES_PER_CLASS = 50
SEED = 42

random.seed(SEED)
np.random.seed(SEED)


def load_dataset(dataset_dir):
    class_images = {}

    for folder in sorted(os.listdir(dataset_dir)):
        folder_path = os.path.join(dataset_dir, folder)
        if not os.path.isdir(folder_path):
            continue

        images = []
        for img_name in sorted(os.listdir(folder_path)):
            img_path = os.path.join(folder_path, img_name)
            img = cv2.imread(img_path)
            if img is None:
                continue

            img = cv2.resize(img, IMAGE_SIZE)
            images.append(img)

        if images:
            class_images[folder] = images

    return class_images


def augment_image(image):
    augmented = image.copy()

    if random.random() < 0.5:
        augmented = cv2.flip(augmented, 1)

    angle = random.uniform(-18, 18)
    scale = random.uniform(0.92, 1.08)
    center = (IMAGE_SIZE[0] // 2, IMAGE_SIZE[1] // 2)
    matrix = cv2.getRotationMatrix2D(center, angle, scale)
    matrix[0, 2] += random.uniform(-4, 4)
    matrix[1, 2] += random.uniform(-4, 4)
    augmented = cv2.warpAffine(
        augmented,
        matrix,
        IMAGE_SIZE,
        borderMode=cv2.BORDER_REFLECT_101,
    )

    brightness = random.uniform(0.85, 1.15)
    contrast = random.uniform(0.9, 1.1)
    augmented = cv2.convertScaleAbs(augmented, alpha=contrast, beta=(brightness - 1.0) * 30)

    if random.random() < 0.35:
        noise = np.random.normal(0, 6, augmented.shape).astype(np.int16)
        augmented = np.clip(augmented.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    return augmented


def build_balanced_dataset(class_images, target_per_class):
    images = []
    labels = []

    for label, base_images in class_images.items():
        expanded_images = list(base_images)

        while len(expanded_images) < target_per_class:
            source_img = random.choice(base_images)
            expanded_images.append(augment_image(source_img))

        expanded_images = expanded_images[:target_per_class]

        for img in expanded_images:
            images.append(img)
            labels.append(label)

    return np.array(images, dtype=np.float32) / 255.0, np.array(labels)


class_images = load_dataset(DATASET_DIR)

if not class_images:
    raise ValueError("No valid dataset images found.")

images, labels = build_balanced_dataset(class_images, TARGET_IMAGES_PER_CLASS)

le = LabelEncoder()
labels_encoded = le.fit_transform(labels)
labels_cat = to_categorical(labels_encoded)

X_train, X_test, y_train, y_test = train_test_split(
    images,
    labels_cat,
    test_size=0.2,
    random_state=SEED,
    stratify=labels_encoded,
)

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

model.fit(X_train, y_train, epochs=10, validation_data=(X_test, y_test))

model.save("skin_disease_model.h5")
np.save("labels.npy", le.classes_)

for label in sorted(class_images):
    print(f"{label}: {len(class_images[label])} original images -> {TARGET_IMAGES_PER_CLASS} training images with augmentation")

print("Model training complete and saved.")
