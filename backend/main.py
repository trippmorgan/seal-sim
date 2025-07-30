# main.py
# FastAPI server for SEAL-Sim - handles prompt generation, feedback, and triggering fine-tuning

import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os

from model_handler import ModelHandler
from seal_policy import SEALPolicy
from fine_tuner import trigger_fine_tuning

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_handler = ModelHandler()
seal_policy = SEALPolicy(feedback_threshold=3)
ADAPTATION_LOG = []
FEEDBACK_POOL = []

class GenerateRequest(BaseModel):
    prompt: str

class FeedbackRequest(BaseModel):
    prompt: str
    original_completion: str
    corrected_completion: str

@app.on_event("startup")
async def startup_event():
    print("Loading AI model...")
    model_handler.load_model()
    print("AI model loaded successfully.")

@app.get("/api/status")
def get_status():
    return {
        "model_status": model_handler.get_status(),
        "seal_policy": seal_policy.get_status(),
        "adaptation_log": ADAPTATION_LOG,
        "feedback_pool_size": len(FEEDBACK_POOL)
    }

@app.post("/api/generate")
async def generate(request: GenerateRequest):
    if not model_handler.is_ready():
        raise HTTPException(status_code=503, detail="Model is not ready.")

    completion = model_handler.generate(request.prompt)
    return {"completion": completion}

@app.post("/api/submit_feedback")
async def submit_feedback(request: FeedbackRequest):
    feedback_item = {
        "prompt": request.prompt,
        "original_completion": request.original_completion,
        "corrected_completion": request.corrected_completion
    }
    FEEDBACK_POOL.append(feedback_item)

    with open("data/feedback.jsonl", "a") as f:
        f.write(json.dumps(feedback_item) + "\n")

    if seal_policy.should_adapt():
        print("SEAL Policy: Adaptation approved. Triggering fine-tuning.")
        seal_policy.reset()

        log_entry = {
            "blockNumber": len(ADAPTATION_LOG) + 1,
            "timestamp": f"{json.dumps(ADAPTATION_LOG)}",
            "event": "Fine-tuning process initiated.",
            "feedback_count": len(FEEDBACK_POOL),
        }
        ADAPTATION_LOG.append(log_entry)

        new_adapter_path = trigger_fine_tuning()

        if new_adapter_path and os.path.exists(new_adapter_path):
            model_handler.load_model(adapter_path=new_adapter_path)
            ADAPTATION_LOG.append({
                "blockNumber": len(ADAPTATION_LOG) + 1,
                "timestamp": f"{json.dumps(ADAPTATION_LOG)}",
                "event": f"Model updated with adapter: {new_adapter_path}",
            })
        else:
            ADAPTATION_LOG.append({
                "blockNumber": len(ADAPTATION_LOG) + 1,
                "timestamp": f"{json.dumps(ADAPTATION_LOG)}",
                "event": "Fine-tuning failed or adapter not found.",
            })

        FEEDBACK_POOL.clear()
        return {"message": "Feedback received. Adaptation triggered and completed."}

    return {"message": f"Feedback received. {seal_policy.feedback_count}/{seal_policy.feedback_threshold} to next adaptation."}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
