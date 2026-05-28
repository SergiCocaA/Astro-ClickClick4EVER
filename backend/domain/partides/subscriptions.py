import asyncio
from typing import List, AsyncGenerator
import strawberry
from infrastructure.firestore_db import db
from .types import Puntuacio


@strawberry.type
class PartidaSubscription:
    @strawberry.subscription
    async def ranking_actualitzat(self, limit: int = 10) -> AsyncGenerator[List[Puntuacio], None]:
        last_ids = set()
        while True:
            docs = db.collection_group("puntuacions").stream()
            puntuacions = []
            for doc in docs:
                d = doc.to_dict()
                puntuacions.append(Puntuacio(
                    id=doc.id,
                    jugador_id=d.get("jugador_id", ""),
                    punts=d.get("punts", 0),
                    baixes=d.get("baixes", 0),
                    partida_id=d.get("partida_id", ""),
                    ganyota=d.get("ganyota"),
                ))
            puntuacions.sort(key=lambda p: p.punts, reverse=True)
            top = puntuacions[:limit]
            current_ids = {p.id for p in top}
            if current_ids != last_ids:
                last_ids = current_ids
                yield top
            await asyncio.sleep(3)
