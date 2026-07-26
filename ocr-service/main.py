from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from io import BytesIO
from PIL import Image
import pytesseract
import os

app = FastAPI()

# Configure Tesseract path for Windows
# Default install location. Update if yours differs.
tesseract_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
if os.path.exists(tesseract_path):
    pytesseract.pytesseract.tesseract_cmd = tesseract_path
    print(f"Tesseract found at: {tesseract_path}")
else:
    print(f"WARNING: Tesseract not found at {tesseract_path}.")
    print("Please install from: https://github.com/UB-Mannheim/tesseract/wiki")
    print("Or set TESSERACT_CMD environment variable to your tesseract.exe path.")
    env_path = os.getenv("TESSERACT_CMD")
    if env_path and os.path.exists(env_path):
        pytesseract.pytesseract.tesseract_cmd = env_path
        print(f"Using TESSERACT_CMD: {env_path}")

print("OCR Service ready (Tesseract)!")


class OcrRequest(BaseModel):
    image_url: str


@app.post("/api/ocr")
async def extract_text(req: OcrRequest):
    try:
        # 1. Download the file
        print(f"Downloading from: {req.image_url[:120]}...")
        response = requests.get(req.image_url)
        response.raise_for_status()

        content_type = response.headers.get('Content-Type', '')
        print(f"Downloaded {len(response.content)} bytes. Content-Type: {content_type}")

        if response.content.startswith(b'<?xml') or b'<Error>' in response.content[:100]:
            raise Exception("S3 returned an XML error instead of the file.")

        # 2. Convert to PIL Image(s)
        images = []
        try:
            if response.content.startswith(b'%PDF') or 'pdf' in content_type.lower():
                import fitz  # PyMuPDF
                pdf_document = fitz.open(stream=response.content, filetype="pdf")
                if len(pdf_document) == 0:
                    raise Exception("PDF has no pages.")

                print(f"PDF has {len(pdf_document)} page(s). Rendering all pages at 300 DPI...")
                for page_num in range(len(pdf_document)):
                    page = pdf_document.load_page(page_num)
                    # 300 DPI = 300/72 ≈ 4.17x zoom for sharp OCR
                    pix = page.get_pixmap(matrix=fitz.Matrix(300/72, 300/72))
                    mode = "RGBA" if pix.alpha else "RGB"
                    img = Image.frombytes(mode, [pix.width, pix.height], pix.samples).convert("RGB")
                    images.append(img)
            else:
                images.append(Image.open(BytesIO(response.content)).convert("RGB"))
        except Exception as img_e:
            raise Exception(f"Cannot read file as image or PDF: {img_e}")

        # 3. Run Tesseract OCR on each page
        all_text = []
        for i, image in enumerate(images):
            print(f"  OCR page {i+1}/{len(images)} ({image.size[0]}x{image.size[1]})...")
            # Use --psm 6 for uniform block of text, or --psm 3 for fully automatic
            text = pytesseract.image_to_string(image, lang='eng', config='--psm 3')
            if text.strip():
                if len(images) > 1:
                    all_text.append(f"--- Page {i+1} ---\n{text.strip()}")
                else:
                    all_text.append(text.strip())

        extracted = "\n\n".join(all_text)
        print(f"Extracted {len(extracted)} characters of text.")
        return {"extracted_text": extracted if extracted else "(No text detected)"}

    except Exception as e:
        print(f"OCR Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
