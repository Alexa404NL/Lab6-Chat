const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

let _recorder = null;
let _stream = null;
let _chunks = [];

export const startRecording = async () => {
  _chunks = [];
  _stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  _recorder = new MediaRecorder(_stream);
  _recorder.ondataavailable = (e) => _chunks.push(e.data);
  _recorder.start();
};

export const stopRecording = () =>
  new Promise((resolve, reject) => {
    if (!_recorder) {
      reject(new Error('No active recording.'));
      return;
    }
    _recorder.onstop = () => {
      _stream.getTracks().forEach((t) => t.stop());
      resolve(new Blob(_chunks, { type: 'audio/webm' }));
      _recorder = null;
      _stream = null;
    };
    _recorder.stop();
  });

export const transcribeAudio = async (blob) => {
  const form = new FormData();
  form.append('audio', blob, 'recording.webm');
  const res = await fetch(`${BACKEND}/transcribe`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
  const { text } = await res.json();
  return text;
};

export const speakText = async (text) => {
  const res = await fetch(`${BACKEND}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  return audio.play();
};
