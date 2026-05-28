import uuid
import hashlib
from typing import Annotated, Union
import strawberry
from strawberry.types import Info
from infrastructure.firestore_db import db
from .types import Jugador, RegistrarJugadorInput, RegistreInput, AuthOk, ErrorAuth, AuthResponse, ErrorAccesoDenegado, ErrorCreditsInsuficients, ErrorLimitMillora, ErrorJugadorNoTrobat, ErrorJugadorBanejat, netejar_dades_jugador


NivellResponse = Annotated[
    Union[Jugador, ErrorAccesoDenegado],
    strawberry.union("NivellResponse")
]

MilloraResponse = Annotated[
    Union[Jugador, ErrorCreditsInsuficients, ErrorLimitMillora, ErrorJugadorNoTrobat, ErrorJugadorBanejat],
    strawberry.union("MilloraResponse")
]

@strawberry.type
class ItemCompraSuccess:
    item_id: str

@strawberry.type
class ItemAtorgaSuccess:
    item_id: str

ItemCompraResponse = Annotated[
    Union[ItemCompraSuccess, ErrorJugadorNoTrobat, ErrorCreditsInsuficients, ErrorJugadorBanejat],
    strawberry.union("ItemCompraResponse")
]

ItemAtorgaResponse = Annotated[
    Union[ItemAtorgaSuccess, ErrorJugadorNoTrobat, ErrorJugadorBanejat],
    strawberry.union("ItemAtorgaResponse")
]


def _comprovar_banejat(jugador_id: str):
    doc = db.collection("jugadors").document(jugador_id).get()
    if not doc.exists:
        return ErrorJugadorNoTrobat(), None, None
    d = doc.to_dict()
    if d.get("banejat"):
        return ErrorJugadorBanejat(), None, None
    return None, doc, d


@strawberry.input
class ComprarItemInput:
    nom_item: str
    raresa: str
    preu: int
    vida: int
    velocitat: int
    tipus_cano: str = "normal"


@strawberry.type
class JugadorMutation:
    @strawberry.mutation
    def registrar_jugador(self, info: Info, input: RegistrarJugadorInput) -> Jugador:
        existent = db.collection("jugadors").where("nickname", "==", input.nickname).limit(1).get()
        existent_list = list(existent)
        if existent_list:
            doc = existent_list[0]
            d = doc.to_dict()
            d.setdefault("vides_extra", 0)
            d.setdefault("escut", False)
            return Jugador(id=doc.id, **netejar_dades_jugador(d))

        usuari = info.context.get("usuari")
        uid = usuari["uid"] if usuari else str(uuid.uuid4())
        data = {
            "nickname": input.nickname,
            "corporacio": input.corporacio or "Independent",
            "nivell": 1,
            "credits": 0,
            "punts_totals": 0,
            "banejat": False,
            "vides_extra": 0,
            "escut": False
        }
        db.collection("jugadors").document(uid).set(data)
        return Jugador(id=uid, **data)

    @strawberry.mutation
    def registre(self, input: RegistreInput) -> AuthResponse:
        existent = list(db.collection("jugadors").where("email", "==", input.email).limit(1).get())
        if existent:
            return ErrorAuth(mensaje="Aquest email ja està registrat.")

        uid = str(uuid.uuid4())
        token = str(uuid.uuid4())
        password_hash = hashlib.sha256(input.password.encode()).hexdigest()
        data = {
            "email": input.email,
            "nickname": input.nickname,
            "corporacio": "Independent",
            "nivell": 1,
            "credits": 0,
            "punts_totals": 0,
            "banejat": False,
            "vides_extra": 0,
            "escut": False,
            "token": token,
            "password_hash": password_hash,
        }
        db.collection("jugadors").document(uid).set(data)
        jugador = Jugador(id=uid, **{k: v for k, v in data.items() if k not in ("email", "token", "password_hash")})
        return AuthOk(jugador=jugador, token=token)

    @strawberry.mutation
    def inici_sessio(self, email: str, password: str) -> AuthResponse:
        docs = list(db.collection("jugadors").where("email", "==", email).limit(1).get())
        if not docs:
            return ErrorAuth(mensaje="Email o contrasenya incorrectes.")

        doc = docs[0]
        d = doc.to_dict()
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        if d.get("password_hash") != password_hash:
            return ErrorAuth(mensaje="Email o contrasenya incorrectes.")

        token = str(uuid.uuid4())
        db.collection("jugadors").document(doc.id).update({"token": token})
        d["token"] = token
        jugador = Jugador(id=doc.id, **{k: v for k, v in d.items() if k not in ("email", "token", "password_hash")})
        return AuthOk(jugador=jugador, token=token)

    @strawberry.mutation
    def pujar_nivell(self, info: Info, jugador_id: str) -> NivellResponse:
        usuari = info.context.get("usuari")
        if not usuari or not usuari.get("email", "").endswith("@astrohunters.com"):
            return ErrorAccesoDenegado()

        doc_ref = db.collection("jugadors").document(jugador_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise Exception("Jugador no trobat")

        nuevo_nivell = doc.to_dict().get("nivell", 1) + 1
        doc_ref.update({"nivell": nuevo_nivell})

        d = netejar_dades_jugador(doc)
        d["nivell"] = nuevo_nivell
        return Jugador(id=jugador_id, **d)

    @strawberry.mutation
    def atorgar_item(self, jugador_id: str, input: ComprarItemInput) -> ItemAtorgaResponse:
        error, doc, d = _comprovar_banejat(jugador_id)
        if error:
            return error

        item_ref = db.collection("jugadors").document(jugador_id).collection("inventari").add({
            "nom_item": input.nom_item,
            "raresa": input.raresa,
            "preu": input.preu,
            "vida": input.vida,
            "velocitat": input.velocitat,
            "tipus_cano": input.tipus_cano
        })
        return ItemAtorgaSuccess(item_id=item_ref[1].id)

    @strawberry.mutation
    def comprar_item(self, jugador_id: str, input: ComprarItemInput) -> ItemCompraResponse:
        error, doc, d = _comprovar_banejat(jugador_id)
        if error:
            return error

        if d.get("credits", 0) < input.preu:
            return ErrorCreditsInsuficients()

        db.collection("jugadors").document(jugador_id).update({
            "credits": d["credits"] - input.preu
        })

        item_ref = db.collection("jugadors").document(jugador_id).collection("inventari").add({
            "nom_item": input.nom_item,
            "raresa": input.raresa,
            "preu": input.preu,
            "vida": input.vida,
            "velocitat": input.velocitat,
            "tipus_cano": input.tipus_cano
        })

        return ItemCompraSuccess(item_id=item_ref[1].id)

    @strawberry.mutation
    def comprar_millora(self, jugador_id: str, tipus: str) -> MilloraResponse:
        COST_VIDA = 500
        COST_ESCUT = 1000

        error, doc, d = _comprovar_banejat(jugador_id)
        if error:
            return error

        doc_ref = db.collection("jugadors").document(jugador_id)
        if tipus == "vida_extra":
            vides_actuals = d.get("vides_extra", 0)
            if vides_actuals >= 3:
                return ErrorLimitMillora(mensaje="Ja tens el màxim de vides extra (3).")
            if d.get("credits", 0) < COST_VIDA:
                return ErrorCreditsInsuficients()
            doc_ref.update({
                "vides_extra": vides_actuals + 1,
                "credits": d["credits"] - COST_VIDA
            })
        elif tipus == "escut":
            if d.get("escut", False):
                return ErrorLimitMillora(mensaje="Ja tens l'escut.")
            if d.get("credits", 0) < COST_ESCUT:
                return ErrorCreditsInsuficients()
            doc_ref.update({
                "escut": True,
                "credits": d["credits"] - COST_ESCUT
            })
        else:
            return ErrorJugadorNoTrobat()

        updated_doc = doc_ref.get()
        updated = netejar_dades_jugador(updated_doc)
        updated.setdefault("vides_extra", 0)
        updated.setdefault("escut", False)
        return Jugador(id=jugador_id, **updated)

    @strawberry.mutation
    def consumir_millores(self, jugador_id: str, vides_gastades: int = 0, escut_gastat: bool = False) -> Jugador:
        doc_ref = db.collection("jugadors").document(jugador_id)
        doc = doc_ref.get()
        if not doc.exists:
            return Jugador(id=jugador_id, nickname="", nivell=1, credits=0, punts_totals=0, vides_extra=0, escut=False)
        d = doc.to_dict()
        vides_actuals = d.get("vides_extra", 0)
        noves_vides = max(0, vides_actuals - vides_gastades)
        nou_escut = False if escut_gastat else d.get("escut", False)
        updates = {"vides_extra": noves_vides, "escut": nou_escut}
        doc_ref.update(updates)
        updated = netejar_dades_jugador(doc_ref.get())
        updated.setdefault("vides_extra", 0)
        updated.setdefault("escut", False)
        return Jugador(id=jugador_id, **updated)
