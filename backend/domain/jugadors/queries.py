import strawberry
from typing import Optional
from infrastructure.firestore_db import db
from .types import Jugador, netejar_dades_jugador


@strawberry.type
class JugadorQuery:
    @strawberry.field
    def perfil_jugador(self, id: str) -> Optional[Jugador]:
        doc = db.collection("jugadors").document(id).get()
        if doc.exists:
            return Jugador(id=doc.id, **netejar_dades_jugador(doc))
        return None
