from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from io import BytesIO
from PIL import Image
# pyrefly: ignore [missing-import]
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import os

app = FastAPI()

# We use microsoft/trocr-base-printed explicitly to avoid pipeline errors
MODEL_NAME = "microsoft/trocr-base-printed"
print(f"Loading explicit OCR model {MODEL_NAME}...")

try:
    processor = TrOCRProcessor.from_pretrained(MODEL_NAME)
    model = VisionEncoderDecoderModel.from_pretrained(MODEL_NAME)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    processor = None
    model = None

class OcrRequest(BaseModel):
    image_url: str

@app.post("/api/ocr")
async def extract_text(req: OcrRequest):
    if processor is None or model is None:
        raise HTTPException(status_code=500, detail="OCR Model failed to load at startup.")
        
    try:
        # Download the image from the provided URL
        print(f"Downloading image from: {req.image_url}")
        response = requests.get(req.image_url)
        response.raise_for_status()
        
        content_type = response.headers.get('Content-Type', '')
        print(f"Downloaded {len(response.content)} bytes. Content-Type: {content_type}")
        
        if response.content.startswith(b'<?xml') or b'<Error>' in response.content[:100]:
            print(f"S3 XML Error: {response.text}")
            raise Exception("Downloaded content is an XML error instead of an image.")
            
        try:
            # If the file is a PDF, render its first page as an image
            if response.content.startswith(b'%PDF') or 'pdf' in content_type:
                import fitz  # PyMuPDF
                pdf_document = fitz.open(stream=response.content, filetype="pdf")
                if len(pdf_document) == 0:
                    raise Exception("PDF document has no pages.")
                
                print("Converting first page of PDF to image...")
                page = pdf_document.load_page(0)
                pix = page.get_pixmap()
                
                # Depending on the PDF color space, it might be RGB or RGBA. 
                # get_pixmap usually returns RGB (3 bytes per pixel) or RGBA (4).
                mode = "RGBA" if pix.alpha else "RGB"
                image = Image.frombytes(mode, [pix.width, pix.height], pix.samples).convert("RGB")
            else:
                image = Image.open(BytesIO(response.content)).convert("RGB")
                
        except Exception as img_e:
            print(f"Failed to process file. First 30 bytes: {response.content[:30]}")
            raise Exception(f"Failed to read file. If it's a PDF, ensure PyMuPDF is installed. Error: {img_e}")
        
        # Run inference using TrOCR
        pixel_values = processor(image, return_tensors="pt").pixel_values
        generated_ids = model.generate(pixel_values)
        extracted = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            
        return {"extracted_text": extracted.strip()}
    except Exception as e:
        print(f"OCR Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
