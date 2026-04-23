import strawberry
from typing import List, Optional
from app.firebase_conf import db
from .types import Partida, Puntuacio

@strawberry.type
class PartidaQuery:
    @strawberry.field
    def llistar_partides(self, estat: Optional[str] = None, limit: int = 10, offset: int = 0) -> List[Partida]:
        query = db.collection("partides")
        if estat:
            query = query.where("estat", "==", estat)
        
        docs = query.offset(offset).limit(limit).stream()
        return [Partida(id=doc.id, **doc.to_dict()) for doc in docs]

    @strawberry.field
    def taula_classificacio(self, id_partida: str) -> List[Puntuacio]:
        docs = db.collection("partides").document(id_partida).collection("puntuacions").stream()
        return [Puntuacio(id=doc.id, **doc.to_dict()) for doc in docs]
