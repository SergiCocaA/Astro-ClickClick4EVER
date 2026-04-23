import strawberry
from typing import List, Optional
from app.firebase_conf import db

@strawberry.type
class Item:
    id: str
    nom_item: str
    raresa: str

@strawberry.type
class Jugador:
    id: str
    nickname: str
    nivell: int
    banejat: bool

    @strawberry.field
    def inventari(self) -> List[Item]:
        # Carga la subcolección de inventario
        docs = db.collection("jugadors").document(self.id).collection("inventari").stream()
        return [Item(id=doc.id, **doc.to_dict()) for doc in docs]

@strawberry.type
class ErrorJugadorBanejat:
    mensaje: str = "El jugador está banejado por trampas."

@strawberry.type
class ErrorAccesoDenegado:
    mensaje: str = "No tienes permisos para realizar esta acción."

@strawberry.input
class RegistrarJugadorInput:
    nickname: str
