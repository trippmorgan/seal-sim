# seal_policy.py
# Defines logic to decide when to trigger adaptation based on feedback

class SEALPolicy:
    def __init__(self, feedback_threshold: int = 5):
        self.feedback_threshold = feedback_threshold
        self.feedback_count = 0

    def should_adapt(self) -> bool:
        self.feedback_count += 1
        return self.feedback_count >= self.feedback_threshold

    def reset(self):
        self.feedback_count = 0

    def get_status(self):
        return {
            "feedback_count": self.feedback_count,
            "feedback_threshold": self.feedback_threshold
        }
