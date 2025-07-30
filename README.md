# SEAL-Sim

This is a complete working example of a SEAL (Safe, Evolving, Adaptive Learning) AI dashboard.

## Components

- **Backend**: FastAPI app that runs a `phi-2` language model using PEFT for efficient LoRA adaptation.
- **Frontend**: React + Tailwind dashboard for interaction and feedback submission.
- **Adaptation Loop**: Feedback is collected and triggers fine-tuning after `N` submissions.
- **Adapters**: Saved in `adapters/`, can be reloaded into the model.

## To Run

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open browser to `http://localhost:5173`.

### Feedback Loop
- Generate with prompt
- Submit corrections
- After threshold, fine-tuning triggers
- New LoRA adapter is saved and loaded

---

Created as a minimal but expandable research tool.
