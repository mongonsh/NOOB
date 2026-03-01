import re
from pathlib import Path
from mistralai import Mistral
from utils.config import MISTRAL_API_KEY, MISTRAL_MODEL_OCR

client = Mistral(api_key=MISTRAL_API_KEY)


def extract_text_with_ocr(pdf_path: str) -> tuple[str, int, list[str]]:
    """
    Extract text AND page images from PDF using Mistral OCR.
    Returns (full_text, page_count, page_images_base64).

    page_images_base64 — up to 6 base64-encoded JPEG images from the
    document pages, used by the vision model to understand visual content.
    """
    pdf_path = Path(pdf_path)

    print(f"[ocr] Uploading '{pdf_path.name}' to Mistral Files API…")
    with open(pdf_path, "rb") as f:
        uploaded = client.files.upload(
            file={"file_name": pdf_path.name, "content": f.read()},
            purpose="ocr",
        )
    print(f"[ocr] File uploaded → id={uploaded.id}")

    signed = client.files.get_signed_url(file_id=uploaded.id)
    print(f"[ocr] Signed URL obtained. Running OCR…")

    result = client.ocr.process(
        model=MISTRAL_MODEL_OCR,
        document={"type": "document_url", "document_url": signed.url},
        include_image_base64=True,   # ← extract embedded images for vision
    )

    pages = result.pages
    full_text = "\n\n".join(page.markdown for page in pages)
    page_count = len(pages)
    print(f"[ocr] Extracted {page_count} pages, {len(full_text):,} chars")

    # Collect up to 6 images spread across the document
    page_images: list[str] = []
    step = max(1, page_count // 6)
    for page in pages[::step]:
        if len(page_images) >= 6:
            break
        imgs = getattr(page, "images", None) or []
        for img in imgs:
            b64 = getattr(img, "image_base64", None)
            if b64 and len(b64) > 100:          # skip tiny/empty images
                page_images.append(b64)
                if len(page_images) >= 6:
                    break

    print(f"[ocr] Collected {len(page_images)} page images for vision analysis")

    try:
        client.files.delete(file_id=uploaded.id)
    except Exception:
        pass

    return full_text, page_count, page_images


def clean_text(text: str) -> str:
    """Light cleanup — OCR markdown is already well-structured."""
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def chunk_text(text: str, max_chars: int = 40000) -> list[str]:
    """Split text into chunks for Mistral Large context window."""
    chunks = []
    while text:
        chunk = text[:max_chars]
        last_para = chunk.rfind("\n\n")
        if last_para > max_chars // 2:
            chunk = chunk[:last_para]
        chunks.append(chunk.strip())
        text = text[len(chunk):].strip()
    return chunks


def process_pdf(pdf_path: str) -> dict:
    """Full pipeline: OCR extract (text + images) → clean → chunk."""
    raw_text, page_count, page_images = extract_text_with_ocr(pdf_path)
    cleaned = clean_text(raw_text)
    chunks = chunk_text(cleaned)
    return {
        "raw_text": cleaned,
        "page_count": page_count,
        "chunks": chunks,
        "chunk_count": len(chunks),
        "page_images": page_images,     # base64 images for vision model
    }
