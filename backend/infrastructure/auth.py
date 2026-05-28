from fastapi import Header
from typing import Optional, Dict, Any
from .firestore_db import db

async def obtenir_usuari_actual(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.split("Bearer ")[1]
    try:
        docs = list(db.collection("jugadors").where("token", "==", token).limit(1).get())
        if not docs:
            return None
        doc = docs[0]
        d = doc.to_dict()
        return {"uid": doc.id, "email": d.get("email", "")}
    except Exception:
        return None
