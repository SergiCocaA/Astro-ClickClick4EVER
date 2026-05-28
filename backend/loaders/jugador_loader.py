from strawberry.dataloader import DataLoader
from infrastructure.firestore_db import db


async def batch_load_jugadors(keys: list[str]):
    refs = [db.collection("jugadors").document(k) for k in keys]
    docs = db.get_all(refs)
    result = {}
    for doc in docs:
        result[doc.id] = doc.to_dict() if doc.exists else None
    return [result.get(k) for k in keys]


def create_jugador_loader():
    return DataLoader(load_fn=batch_load_jugadors)
