import strawberry
from typing import Optional
from app.firebase_conf import db
from .types import Jugador

@strawberry.type
class JugadorQuery:
    @strawberry.field
    def perfil_jugador(self, id: str) -> Optional[Jugador]:
        doc = db.collection("jugadors").document(id).get()
        if doc.exists:
            return Jugador(id=doc.id, **doc.to_dict())
        return None
