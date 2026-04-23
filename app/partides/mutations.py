from typing import Annotated, Union
import strawberry
from datetime import datetime
from app.firebase_conf import db
from .types import Partida, CrearPartidaInput, ErrorPartidaNoTrobada

# Definimos la unión usando Annotated (la forma correcta en Strawberry 0.120+)
FinalitzarResponse = Annotated[
    Union[Partida, ErrorPartidaNoTrobada],
    strawberry.union("FinalitzarResponse")
]

@strawberry.type
class PartidaMutation:
    @strawberry.mutation
    def crear_partida(self, input: CrearPartidaInput) -> Partida:
        datos = {
            "mapa": input.mapa,
            "estat": "En curs",
            "data_creacio": datetime.now().isoformat()
        }
        _, doc_ref = db.collection("partides").add(datos)
        return Partida(id=doc_ref.id, **datos)

    @strawberry.mutation
    def registrar_puntuacio(self, id_partida: str, jugador_id: str, punts: int, baixes: int) -> str:
        doc_ref = db.collection("partides").document(id_partida).collection("puntuacions").add({
            "jugador_id": jugador_id,
            "punts": punts,
            "baixes": baixes
        })
        return doc_ref[1].id

    @strawberry.mutation
    def finalitzar_partida(self, id_partida: str) -> FinalitzarResponse:
        doc_ref = db.collection("partides").document(id_partida)
        doc = doc_ref.get()
        if not doc.exists:
            return ErrorPartidaNoTrobada()
        
        doc_ref.update({"estat": "Finalitzada"})
        return Partida(id=id_partida, **{**doc.to_dict(), "estat": "Finalitzada"})
