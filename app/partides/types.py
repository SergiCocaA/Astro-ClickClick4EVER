import strawberry
from typing import List, Optional
from datetime import datetime
from app.firebase_conf import db
from app.loaders import jugador_loader

@strawberry.type
class Puntuacio:
    id: str
    jugador_id: str
    punts: int
    baixes: int

    @strawberry.field
    async def nickname(self) -> str:
        # Uso de DataLoader para evitar N+1
        datos_jugador = await jugador_loader.load(self.jugador_id)
        return datos_jugador.get("nickname", "Unknown") if datos_jugador else "Unknown"

@strawberry.type
class Partida:
    id: str
    mapa: str
    estat: str
    data_creacio: str

    @strawberry.field
    def puntuacions(self) -> List[Puntuacio]:
        docs = db.collection("partides").document(self.id).collection("puntuacions").stream()
        return [Puntuacio(id=doc.id, **doc.to_dict()) for doc in docs]

@strawberry.type
class ErrorPartidaNoTrobada:
    mensaje: str = "La partida especificada no existe."

@strawberry.input
class CrearPartidaInput:
    mapa: str
