from pydantic import BaseModel

class MLFeatures(BaseModel):
    job_count: int
    step_count: int

    # Security-relevant features
    uses_write_all_permissions: bool
    plaintext_secrets_count: int
    uses_unpinned_actions_count: int
    has_security_steps: bool
    uses_self_hosted_runner: bool
