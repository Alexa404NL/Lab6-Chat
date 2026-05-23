import os
import tempfile
from fastapi import FastAPI, File, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from speech_to_text import transcribe_audio
from tts_engine import text_to_speech

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    suffix = ".webm" if "webm" in (audio.content_type or "") else ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(await audio.read())
        tmp_path = tmp.name

    try:
        text = transcribe_audio(tmp_path)
    finally:
        os.unlink(tmp_path)

    return {"text": text}


class TTSRequest(BaseModel):
    text: str


@app.post("/tts")
async def tts(payload: TTSRequest, background_tasks: BackgroundTasks):
    audio_path = await text_to_speech(payload.text)
    background_tasks.add_task(os.unlink, audio_path)
    return FileResponse(audio_path, media_type="audio/mpeg")
