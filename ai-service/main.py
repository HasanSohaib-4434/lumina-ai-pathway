import io
import os
from typing import Any

import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel, Field
from pypdf import PdfReader

load_dotenv()

EMBED_MODEL = "gemini-embedding-001"
CHUNK_SIZE = 1200
CHUNK_OVERLAP = 150


def get_client():
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise HTTPException(status_code=500, detail="Missing GEMINI_API_KEY")
    return genai.Client(api_key=key)


def extract_text_from_pdf(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    parts: list[str] = []
    for page in reader.pages:
        t = page.extract_text() or ""
        parts.append(t)
    return "\n".join(parts).strip()


def chunk_text(text: str) -> list[str]:
    if not text:
        return []
    chunks: list[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + CHUNK_SIZE, n)
        piece = text[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= n:
            break
        start = end - CHUNK_OVERLAP
        if start < 0:
            start = 0
    return chunks


def embedding_values(resp: Any) -> list[float]:
    if hasattr(resp, "embeddings") and resp.embeddings:
        emb = resp.embeddings[0]
        if hasattr(emb, "values"):
            return list(emb.values)
    if hasattr(resp, "embedding") and resp.embedding is not None:
        e = resp.embedding
        if hasattr(e, "values"):
            return list(e.values)
    d = resp.model_dump() if hasattr(resp, "model_dump") else {}
    embs = d.get("embeddings")
    if embs and isinstance(embs, list):
        first = embs[0]
        if isinstance(first, dict) and "values" in first:
            return list(first["values"])
    raise HTTPException(status_code=502, detail="Unexpected embedding response")


def embed_batch(client, texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    resp = client.models.embed_content(model=EMBED_MODEL, contents=texts)
    out: list[list[float]] = []
    if hasattr(resp, "embeddings") and resp.embeddings:
        for emb in resp.embeddings:
            if hasattr(emb, "values"):
                out.append(list(emb.values))
        if len(out) == len(texts):
            return out
    d = resp.model_dump() if hasattr(resp, "model_dump") else {}
    embs = d.get("embeddings") or []
    for item in embs:
        if isinstance(item, dict) and "values" in item:
            out.append(list(item["values"]))
    if len(out) == len(texts):
        return out
    out = []
    for t in texts:
        one = client.models.embed_content(model=EMBED_MODEL, contents=t)
        out.append(embedding_values(one))
    if len(out) != len(texts):
        raise HTTPException(status_code=502, detail="Embedding count mismatch")
    return out


def cosine_top_k(
    query_vec: np.ndarray,
    matrix: np.ndarray,
    top_k: int,
) -> list[tuple[int, float]]:
    qn = np.linalg.norm(query_vec)
    if qn == 0:
        return []
    norms = np.linalg.norm(matrix, axis=1)
    dots = matrix @ query_vec
    denom = norms * qn
    denom = np.where(denom == 0, 1e-12, denom)
    sims = dots / denom
    k = min(top_k, len(sims))
    idx = np.argpartition(-sims, k - 1)[:k]
    idx = idx[np.argsort(-sims[idx])]
    return [(int(i), float(sims[i])) for i in idx]


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchBody(BaseModel):
    query: str = Field(min_length=1)
    chunks: list[str] = Field(default_factory=list)
    embeddings: list[list[float]] = Field(default_factory=list)
    top_k: int = Field(default=5, ge=1, le=50)


@app.post("/process-pdf")
async def process_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF file required")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    text = extract_text_from_pdf(data)
    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="No extractable text")
    client = get_client()
    vectors = embed_batch(client, chunks)
    return {"chunks": chunks, "embeddings": vectors, "filename": file.filename}


@app.post("/search")
async def search(body: SearchBody):
    if not body.chunks or not body.embeddings:
        raise HTTPException(status_code=400, detail="chunks and embeddings required")
    if len(body.chunks) != len(body.embeddings):
        raise HTTPException(status_code=400, detail="chunks and embeddings length mismatch")
    client = get_client()
    q_resp = client.models.embed_content(model=EMBED_MODEL, contents=body.query.strip())
    q_vec = np.array(embedding_values(q_resp), dtype=np.float64)
    mat = np.array(body.embeddings, dtype=np.float64)
    if mat.ndim != 2 or mat.shape[0] != len(body.chunks):
        raise HTTPException(status_code=400, detail="Invalid embeddings shape")
    if q_vec.shape[0] != mat.shape[1]:
        raise HTTPException(status_code=400, detail="Embedding dimension mismatch")
    ranked = cosine_top_k(q_vec, mat, body.top_k)
    matches = [
        {"index": i, "score": round(s, 6), "text": body.chunks[i]}
        for i, s in ranked
    ]
    return {"matches": matches}


@app.get("/health")
async def health():
    return {"ok": True}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000)
