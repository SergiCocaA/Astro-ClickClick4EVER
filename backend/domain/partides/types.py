import strawberry
from typing import List, Optional, Annotated
from strawberry.types import Info
from infrastructure.firestore_db import db


@strawberry.type
class ErrorPartidaNoTrobada:
    mensaje: str = "La partida especificada no existe."


@strawberry.type
class Puntuacio:
    id: str
    jugador_id: str
    punts: int
    baixes: int
    partida_id: str
    ganyota: Optional[str]

    @strawberry.field
    async def jugador(self, info: Info) -> Optional[Annotated["Jugador", strawberry.lazy("domain.jugadors.types")]]:
        from domain.jugadors.types import Jugador, netejar_dades_jugador
        jugador_loader = info.context.get("jugador_loader")
        if jugador_loader:
            datos_jugador = await jugador_loader.load(self.jugador_id)
            if datos_jugador:
                return Jugador(id=self.jugador_id, **netejar_dades_jugador(datos_jugador))
        else:
            doc = db.collection("jugadors").document(self.jugador_id).get()
            if doc.exists:
                return Jugador(id=self.jugador_id, **netejar_dades_jugador(doc))
        return None


@strawberry.type
class Partida:
    id: str
    mapa: str
    estat: str
    data_creacio: str

    @strawberry.field
    def puntuacions(self) -> List[Puntuacio]:
        docs = db.collection("partides").document(self.id).collection("puntuacions").stream()
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


@strawberry.input
class CrearPartidaInput:
    mapa: str
