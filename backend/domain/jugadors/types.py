import strawberry
from typing import List, Annotated, Optional, Union
from infrastructure.firestore_db import db


@strawberry.type
class Item:
    id: str
    nom_item: str
    raresa: str
    preu: int
    vida: int
    velocitat: int
    tipus_cano: str


@strawberry.type
class Stats:
    vida: int
    velocitat: int
    tipus_cano: str


@strawberry.type
class ErrorJugadorBanejat:
    mensaje: str = "El jugador está banejado por trampas."


@strawberry.type
class ErrorAccesoDenegado:
    mensaje: str = "No tienes permisos para realizar esta acción."


@strawberry.type
class ErrorCreditsInsuficients:
    mensaje: str = "No tens crèdits suficients."


@strawberry.type
class ErrorLimitMillora:
    mensaje: str = "Ja tens el màxim de millores."


@strawberry.type
class ErrorJugadorNoTrobat:
    mensaje: str = "El jugador no existeix."


@strawberry.type
class Jugador:
    id: str
    nickname: str
    corporacio: Optional[str]
    nivell: int
    credits: int
    punts_totals: int = 0
    banejat: bool
    vides_extra: int = 0
    escut: bool = False

    @strawberry.field
    def inventari(self) -> List[Item]:
        docs = db.collection("jugadors").document(self.id).collection("inventari").stream()
        items = []
        for doc in docs:
            d = doc.to_dict()
            items.append(Item(
                id=doc.id,
                nom_item=d.get("nom_item", d.get("nom", "")),
                raresa=d.get("raresa", d.get("raritat", "")),
                preu=d.get("preu", 0),
                vida=d.get("vida", 0),
                velocitat=d.get("velocitat", 0),
                tipus_cano=d.get("tipus_cano", "normal")
            ))
        return items

    @strawberry.field
    def stats(self) -> Stats:
        docs = db.collection("jugadors").document(self.id).collection("inventari").stream()
        total_vida = 100
        total_velocitat = 5
        tipus_cano = "normal"
        for doc in docs:
            d = doc.to_dict()
            total_vida += d.get("vida", 0)
            total_velocitat += d.get("velocitat", 0)
            tc = d.get("tipus_cano")
            if tc and tc != "normal":
                tipus_cano = tc
        return Stats(vida=total_vida, velocitat=total_velocitat, tipus_cano=tipus_cano)

    @strawberry.field
    async def partides(self) -> List[Annotated["Partida", strawberry.lazy("domain.partides.types")]]:
        from domain.partides.types import Partida
        puntuacions = db.collection_group("puntuacions").where("jugador_id", "==", self.id).stream()
        partida_ids = {doc.to_dict()["partida_id"] for doc in puntuacions}
        result = []
        for pid in partida_ids:
            doc = db.collection("partides").document(pid).get()
            if doc.exists:
                result.append(Partida(id=doc.id, **doc.to_dict()))
        return result


@strawberry.input
class RegistrarJugadorInput:
    nickname: str
    corporacio: Optional[str] = None


@strawberry.type
class AuthOk:
    jugador: Jugador
    token: str


@strawberry.type
class ErrorAuth:
    mensaje: str


AuthResponse = Annotated[
    Union[AuthOk, ErrorAuth],
    strawberry.union("AuthResponse")
]


def netejar_dades_jugador(doc_or_dict):
    """Remove internal fields that are not part of the Jugador type."""
    if hasattr(doc_or_dict, "to_dict"):
        d = doc_or_dict.to_dict()
    else:
        d = doc_or_dict
    return {k: v for k, v in d.items() if k not in ("email", "token", "password_hash")}


@strawberry.input
class RegistreInput:
    email: str
    password: str
    nickname: str
