from __future__ import annotations

import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from ..config import get_settings
from ..deps import get_current_user

router = APIRouter(prefix='/media', tags=['media'])

settings = get_settings()
# Alinea con main.py para que los archivos queden en /app/media
BASE_DIR = Path(__file__).resolve().parents[2]
MEDIA_ROOT = (BASE_DIR / settings.media_root).resolve()
CAMERA_UPLOAD_DIR = MEDIA_ROOT / 'cameras'
CAMERA_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}


@router.post('/upload')
async def upload_media(
    files: List[UploadFile] = File(...),
    user=Depends(get_current_user),
):
    _ = user
    if not files:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='No se enviaron archivos')

    saved_files: list[dict[str, str]] = []

    for file in files:
        original_name = Path(file.filename or '')
        suffix = original_name.suffix.lower()
        if suffix not in ALLOWED_IMAGE_EXTENSIONS:
            continue

        unique_name = f'{uuid.uuid4().hex}{suffix}'
        target_path = CAMERA_UPLOAD_DIR / unique_name

        contents = await file.read()
        target_path.write_bytes(contents)

        saved_files.append(
            {
                'filename': file.filename,
                'path': f'/uploads/cameras/{unique_name}',
            },
        )

    if not saved_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Ningún archivo tiene un formato de imagen soportado',
        )

    return {'files': saved_files}
