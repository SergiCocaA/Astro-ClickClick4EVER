import strawberry
from typing import List, Optional
from infrastructure.firestore_db import db
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
    def ranking(self, partida_id: str, limit: int = 10) -> List[Puntuacio]:
        docs = db.collection("partides").document(partida_id).collection("puntuacions") \
            .order_by("punts", direction="DESCENDING").limit(limit).stream()
        result = []
        for doc in docs:
            d = doc.to_dict()
            result.append(Puntuacio(
                id=doc.id,
                jugador_id=d.get("jugador_id", ""),
                punts=d.get("punts", 0),
                baixes=d.get("baixes", 0),
                partida_id=d.get("partida_id", ""),
                ganyota=d.get("ganyota")
            ))
        return result

    @strawberry.field
    def taula_classificacio(self, limit: int = 10) -> List[Puntuacio]:
        docs = db.collection_group("puntuacions").order_by("punts", direction="DESCENDING").limit(limit).stream()
        result = []
        for doc in docs:
            d = doc.to_dict()
            result.append(Puntuacio(
                id=doc.id,
                jugador_id=d.get("jugador_id", ""),
                punts=d.get("punts", 0),
                baixes=d.get("baixes", 0),
                partida_id=d.get("partida_id", ""),
                ganyota=d.get("ganyota")
            ))
        return result
