import whisper

_model = None


def _get_model():
    global _model
    if _model is None:
        _model = whisper.load_model("tiny")
    return _model


def transcribe_audio(filepath: str) -> str:
    result = _get_model().transcribe(filepath)
    return result["text"].strip()
