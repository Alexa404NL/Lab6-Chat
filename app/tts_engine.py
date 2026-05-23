import tempfile
import edge_tts

VOICE = "en-US-JennyNeural"


async def text_to_speech(text: str) -> str:
    tmp = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False)
    tmp.close()
    await edge_tts.Communicate(text, voice=VOICE).save(tmp.name)
    return tmp.name
