#!/usr/bin/env python3
"""
Download bert-base-NER model from Hugging Face
"""
from transformers import AutoTokenizer, AutoModelForTokenClassification
import os

model_name = "dslim/bert-base-NER"
save_path = "./models/bert-base-NER"

print(f"📥 Downloading {model_name}...")
print(f"💾 Saving to {save_path}...")

# Download tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_name)
tokenizer.save_pretrained(save_path)
print("✅ Tokenizer downloaded")

# Download model
model = AutoModelForTokenClassification.from_pretrained(model_name)
model.save_pretrained(save_path)
print("✅ Model downloaded")

print(f"\n🎉 Complete! Model saved to {save_path}")
print("\nModel files:")
for file in os.listdir(save_path):
    file_path = os.path.join(save_path, file)
    size = os.path.getsize(file_path) / (1024 * 1024)  # MB
    print(f"  - {file} ({size:.2f} MB)")
