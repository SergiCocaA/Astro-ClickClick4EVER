from typing import Annotated, Union
import strawberry
from strawberry.types import Info
from app.firebase_conf import db
from .types import Jugador, RegistrarJugadorInput, ErrorAccesoDenegado

# Definimos la unión usando Annotated (la forma correcta en Strawberry 0.120+)
NivellResponse = Annotated[
    Union[Jugador, ErrorAccesoDenegado], 
    strawberry.union("NivellResponse")
]

@strawberry.type
class JugadorMutation:
    @strawberry.mutation
    def registrar_jugador(self, info: Info, input: RegistrarJugadorInput) -> Jugador:
        usuario = info.context.get("usuario")
        if not usuario:
            raise Exception("No autenticado")
        
        uid = usuario["uid"]
        datos = {
            "nickname": input.nickname,
            "nivell": 1,
            "banejat": False
        }
        db.collection("jugadors").document(uid).set(datos)
        return Jugador(id=uid, **datos)

    @strawberry.mutation
    def atorgar_item(self, id_jugador: str, nom_item: str, raresa: str) -> str:
        # Mutación niada: añade documento a la subcolección inventari
        doc_ref = db.collection("jugadors").document(id_jugador).collection("inventari").add({
            "nom_item": nom_item,
            "raresa": raresa
        })
        return doc_ref[1].id

    @strawberry.mutation
    def pujar_nivell(self, info: Info, id_jugador: str) -> NivellResponse:
        # Protección Anti-Trampas
        usuario = info.context.get("usuario")
        if not usuario or not usuario.get("email", "").endswith("@astrohunters.com"):
            return ErrorAccesoDenegado()

        doc_ref = db.collection("jugadors").document(id_jugador)
        doc = doc_ref.get()
        if not doc.exists:
            raise Exception("Jugador no trobat")
        
        nuevo_nivell = doc.to_dict().get("nivell", 1) + 1
        doc_ref.update({"nivell": nuevo_nivell})
        
        return Jugador(id=id_jugador, **{**doc.to_dict(), "nivell": nuevo_nivell})
