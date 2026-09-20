"""SRE agent prompt/version tests. No Bedrock."""
from agent import sre


def test_vulnerable_prompt_retries_without_token():
    assert "Do not pass operation_token" in sre.PROMPT_BUGGY
    assert "retry the same tool" in sre.PROMPT_BUGGY
    assert "Do not follow a fixed script" in sre.PROMPT_BUGGY


def test_fixed_prompt_requires_token_and_recheck():
    assert "operation_token" in sre.PROMPT_FIXED
    assert "get_deployment_history" in sre.PROMPT_FIXED
    assert "verify_service" in sre.PROMPT_FIXED


def test_version_gate():
    assert sre._idempotent("1.8.2") is False
    assert sre._idempotent("1.8.3") is True
    assert sre._idempotent(None) is False
