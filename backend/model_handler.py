# model_handler.py
# Loads and manages the base model and optional LoRA adapter

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import PeftModel
import os

class ModelHandler:
    def __init__(self, base_model_name: str = "microsoft/phi-2"):
        self.base_model_name = base_model_name
        self.model = None
        self.tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.status = "unloaded"
        self.current_adapter = "None"

    def load_model(self, adapter_path: str = None):
        self.status = "loading"
        print(f"Loading base model: {self.base_model_name} on device: {self.device}")

        quant_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
        )

        self.tokenizer = AutoTokenizer.from_pretrained(self.base_model_name, trust_remote_code=True)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token

        self.model = AutoModelForCausalLM.from_pretrained(
            self.base_model_name,
            quantization_config=quant_config,
            device_map="auto",
            trust_remote_code=True
        )

        if adapter_path and os.path.isdir(adapter_path):
            print(f"Loading adapter from: {adapter_path}")
            self.model = PeftModel.from_pretrained(self.model, adapter_path)
            self.current_adapter = adapter_path
        else:
            print("No adapter provided. Using base model only.")
            self.current_adapter = "None"

        self.status = "ready"

    def generate(self, prompt: str, max_length: int = 100) -> str:
        if not self.is_ready():
            return "Model not ready."

        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.device)
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                temperature=0.7,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id
            )
        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)

    def is_ready(self):
        return self.status == "ready"

    def get_status(self):
        return {
            "status": self.status,
            "base_model": self.base_model_name,
            "current_adapter": self.current_adapter,
            "device": self.device
        }
