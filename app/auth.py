from fastapi import Header
from firebase_admin import auth
from typing import Optional, Dict, Any

async def obtener_usuario_actual(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split("Bearer ")[1]
    try:
        # Verifica el token JWT contra Firebase Auth
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception:
        return None
