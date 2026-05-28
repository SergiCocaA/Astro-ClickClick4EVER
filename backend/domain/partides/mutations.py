from typing import Annotated, Union, Optional
import strawberry
from datetime import datetime, timezone
from infrastructure.firestore_db import db
from .types import Partida, CrearPartidaInput, ErrorPartidaNoTrobada


FinalitzarResponse = Annotated[
    Union[Partida, ErrorPartidaNoTrobada],
    strawberry.union("FinalitzarResponse")
]


@strawberry.type
class PartidaMutation:
    @strawberry.mutation
    def crear_partida(self, input: CrearPartidaInput) -> Partida:
        data = {
            "mapa": input.mapa,
            "estat": "En curs",
            "data_creacio": datetime.now(timezone.utc).isoformat()
        }
        _, doc_ref = db.collection("partides").add(data)
        return Partida(id=doc_ref.id, **data)

    @strawberry.mutation
    def finalitzar_partida(self, partida_id: str) -> FinalitzarResponse:
        doc_ref = db.collection("partides").document(partida_id)
        doc = doc_ref.get()
        if not doc.exists:
            return ErrorPartidaNoTrobada()

        data = doc.to_dict()
        data["estat"] = "Finalitzada"
        doc_ref.update({"estat": "Finalitzada"})
        return Partida(id=partida_id, **data)

    @strawberry.mutation
    def registrar_puntuacio(self, partida_id: str, jugador_id: str, punts: int, baixes: int, ganyota: Optional[str] = None, boss_killed: bool = False) -> str:
        doc_ref = db.collection("partides").document(partida_id).collection("puntuacions").add({
            "jugador_id": jugador_id,
            "punts": punts,
            "baixes": baixes,
            "partida_id": partida_id,
            "ganyota": ganyota,
            "boss_killed": boss_killed
        })

        doc = db.collection("jugadors").document(jugador_id).get()
        if doc.exists:
            d = doc.to_dict()
            credits_punts = (punts // 1000) * 50
            credits_boss = 100 if boss_killed else 0
            total_nous_credits = credits_punts + credits_boss
            
            db.collection("jugadors").document(jugador_id).update({
                "credits": d.get("credits", 0) + total_nous_credits,
                "punts_totals": d.get("punts_totals", 0) + punts
            })

        return doc_ref[1].id
