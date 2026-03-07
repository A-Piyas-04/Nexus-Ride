from fastapi import HTTPException, UploadFile, status
from PIL import Image
import io

MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]

def validate_image(file: UploadFile) -> bytes:
    """
    Validates the uploaded image file.
    Checks for file size, MIME type, and image integrity.
    Returns the file content as bytes.
    """
    # Check file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 2MB limit."
        )
        
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_MIME_TYPES)}"
        )
        
    contents = file.file.read()
    
    # Verify image integrity
    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file."
        )
    finally:
        # Reset file pointer if needed, though we return contents
        file.file.seek(0)
        
    return contents
