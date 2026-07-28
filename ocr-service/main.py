from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from io import BytesIO
from PIL import Image
import pytesseract
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

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

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("Gemini API configured successfully.")
else:
    print("WARNING: GEMINI_API_KEY not set. Structured OCR endpoint will return raw text only.")

print("OCR Service ready (Tesseract + Gemini)!")


class OcrRequest(BaseModel):
    image_url: str


def download_and_ocr(image_url: str) -> str:
    """Download a file from URL and run Tesseract OCR. Returns extracted text."""
    print(f"Downloading from: {image_url[:120]}...")
    response = requests.get(image_url)
    response.raise_for_status()

    content_type = response.headers.get('Content-Type', '')
    print(f"Downloaded {len(response.content)} bytes. Content-Type: {content_type}")

    if response.content.startswith(b'<?xml') or b'<Error>' in response.content[:100]:
        raise Exception("S3 returned an XML error instead of the file.")

    # Convert to PIL Image(s)
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

    # Run Tesseract OCR on each page
    all_text = []
    for i, image in enumerate(images):
        print(f"  OCR page {i+1}/{len(images)} ({image.size[0]}x{image.size[1]})...")
        # Use --psm 3 for fully automatic page segmentation
        text = pytesseract.image_to_string(image, lang='eng', config='--psm 3')
        if text.strip():
            if len(images) > 1:
                all_text.append(f"--- Page {i+1} ---\n{text.strip()}")
            else:
                all_text.append(text.strip())

    extracted = "\n\n".join(all_text)
    print(f"Extracted {len(extracted)} characters of text.")
    return extracted


STRUCTURED_PROMPT = """You are a medical document parser. Analyze the following OCR-extracted text from a medical prescription or report and extract structured information.

Return ONLY a valid JSON object with the following schema (use null for fields you cannot determine):

{
  "doctor": {
    "name": "Doctor's full name with title (e.g., Dr. John Smith)",
    "qualifications": "Degrees/qualifications (e.g., MBBS, MD)",
    "hospital": "Hospital or clinic name",
    "contact": "Phone number or email if present"
  },
  "patient": {
    "name": "Patient's full name",
    "age": "Patient's age or DOB",
    "gender": "Patient's gender"
  },
  "prescription_date": "Date of the prescription (YYYY-MM-DD if possible, otherwise as written)",
  "diagnosis": "Diagnosis or chief complaint",
  "medications": [
    {
      "name": "Medicine name (e.g., Paracetamol)",
      "dosage": "Dosage (e.g., 500mg)",
      "frequency": "How often (e.g., 1-0-1, twice daily, BD)",
      "duration": "For how long (e.g., 5 days, 1 week)",
      "instructions": "Special instructions (e.g., after food, before bed)"
    }
  ],
  "lab_tests": ["List of lab tests ordered, if any"],
  "follow_up": "Follow-up date or instructions",
  "notes": "Any other important notes, advice, or remarks"
}

Important rules:
- Extract ONLY information that is clearly present in the text. Do not fabricate data.
- If a field cannot be determined from the text, set it to null.
- For medications, try to split combined entries (e.g., "Tab Paracetamol 500mg 1-0-1 x 5 days after food") into separate fields.
- Common frequency formats: "1-0-1" means morning-afternoon-night, "BD" means twice daily, "TDS" means thrice daily, "OD" means once daily, "SOS" means as needed.
- Return ONLY the JSON. No markdown, no explanation, no code fences.

OCR Text:
\"\"\"
{ocr_text}
\"\"\"
"""


def parse_with_gemini(raw_text: str) -> dict | None:
    """Use Gemini to parse raw OCR text into structured prescription data."""
    if not GEMINI_API_KEY:
        print("Gemini API key not configured. Skipping structured parsing.")
        return None

    try:
        model = genai.GenerativeModel("gemini-2.0-flash")
        prompt = STRUCTURED_PROMPT.replace("{ocr_text}", raw_text)

        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                max_output_tokens=2048,
            ),
        )

        response_text = response.text.strip()

        # Clean up response — remove markdown fences if present
        if response_text.startswith("```"):
            # Remove ```json or ``` prefix and trailing ```
            lines = response_text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            response_text = "\n".join(lines)

        parsed = json.loads(response_text)
        print(f"Gemini structured parsing successful. Keys: {list(parsed.keys())}")
        return parsed

    except json.JSONDecodeError as e:
        print(f"Gemini returned invalid JSON: {e}")
        print(f"Raw response: {response_text[:500]}")
        return None
    except Exception as e:
        print(f"Gemini parsing error: {e}")
        return None


@app.post("/api/ocr")
async def extract_text(req: OcrRequest):
    try:
        extracted = download_and_ocr(req.image_url)
        return {"extracted_text": extracted if extracted else "(No text detected)"}

    except Exception as e:
        print(f"OCR Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ocr/structured")
async def extract_structured_text(req: OcrRequest):
    try:
        # Step 1: OCR extraction
        raw_text = download_and_ocr(req.image_url)

        if not raw_text or raw_text == "(No text detected)":
            return {
                "raw_text": raw_text or "(No text detected)",
                "structured_data": None
            }

        # Step 2: Parse with Gemini
        structured_data = parse_with_gemini(raw_text)

        return {
            "raw_text": raw_text,
            "structured_data": structured_data
        }

    except Exception as e:
        print(f"Structured OCR Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
