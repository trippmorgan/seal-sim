# fine_tuner.py
# Triggers LoRA-based fine-tuning using feedback.jsonl

import torch
from datasets import load_dataset
from transformers import (
    TrainingArguments, Trainer,
    DataCollatorForLanguageModeling,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from model_handler import ModelHandler
import os

def format_prompt(example):
    return {"text": f"Prompt: {example['prompt']}\nCorrected Completion: {example['corrected_completion']}"}

def trigger_fine_tuning(data_file="data/feedback.jsonl", base_model_name="microsoft/phi-2"):
    temp_handler = ModelHandler(base_model_name)
    temp_handler.load_model()
    model = prepare_model_for_kbit_training(temp_handler.model)
    tokenizer = temp_handler.tokenizer

    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )
    model = get_peft_model(model, lora_config)

    if not os.path.exists(data_file) or os.path.getsize(data_file) == 0:
        print("No feedback data available. Skipping fine-tuning.")
        return None

    dataset = load_dataset("json", data_files=data_file, split="train")
    dataset = dataset.map(format_prompt)

    adapter_dir = f"./adapters/adapter_{len(os.listdir('./adapters')) + 1}"
    args = TrainingArguments(
        output_dir=adapter_dir,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        num_train_epochs=1,
        logging_steps=1,
        fp16=True,
    )

    trainer = Trainer(
        model=model,
        args=args,
        train_dataset=dataset,
        data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
    )

    print("Starting training...")
    trainer.train()
    final_path = os.path.join(adapter_dir, "final")
    model.save_pretrained(final_path)
    tokenizer.save_pretrained(final_path)
    print(f"Adapter saved to {final_path}")
    return final_path
