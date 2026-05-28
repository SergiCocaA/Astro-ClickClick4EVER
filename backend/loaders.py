from strawberry.dataloader import DataLoader
from .database import db


async def load_jugadors(keys: list[str]):
    refs = [db.collection("jugadors").document(k) for k in keys]
    docs = db.get_all(refs)
    return [doc.to_dict() if doc.exists else None for doc in docs]


jugador_loader = DataLoader(load_fn=load_jugadors)
