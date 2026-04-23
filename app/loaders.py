from strawberry.dataloader import DataLoader
from app.firebase_conf import db

async def load_jugadors(keys: list[str]):
    # Obtiene múltiples jugadores en una sola petición (Batch)
    referencias = [db.collection("jugadors").document(k) for k in keys]
    docs = db.get_all(referencias)
    return [doc.to_dict() if doc.exists else None for doc in docs]

jugador_loader = DataLoader(load_fn=load_jugadors)
