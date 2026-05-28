from database import db
from datetime import datetime, timezone


def seed():
    print("--- Poblando base de datos... ---\n")

    # --- JUGADORS ---
    jugadors_data = [
        {
            "nickname": "StarFighter42",
            "corporacio": "AstroDevs",
            "nivell": 5,
            "credits": 2500,
            "banejat": False,
            "inventari": [
                {"nom_item": "Pistola Laser", "raresa": "Comu", "preu": 0, "vida": 0, "velocitat": 0, "tipus_cano": "normal"},
                {"nom_item": "Escut d'Energia", "raresa": " Epic", "preu": 500, "vida": 50, "velocitat": 0, "tipus_cano": "normal"},
                {"nom_item": "Propulsor Rapid", "raresa": "Rar", "preu": 300, "vida": 0, "velocitat": 3, "tipus_cano": "normal"}
            ]
        },
        {
            "nickname": "NexusGuardian",
            "corporacio": "AstroDevs",
            "nivell": 3,
            "credits": 1200,
            "banejat": False,
            "inventari": [
                {"nom_item": "Cano Triple", "raresa": "Llegendari", "preu": 1000, "vida": 0, "velocitat": 0, "tipus_cano": "triple"},
                {"nom_item": "Escut Basic", "raresa": "Comu", "preu": 100, "vida": 25, "velocitat": 0, "tipus_cano": "normal"}
            ]
        },
        {
            "nickname": "BitCrusher",
            "corporacio": "CodeWizards",
            "nivell": 2,
            "credits": 600,
            "banejat": False,
            "inventari": []
        },
        {
            "nickname": "HackThePlanet",
            "corporacio": "CodeWizards",
            "nivell": 1,
            "credits": 0,
            "banejat": True,
            "inventari": []
        }
    ]

    jugador_ids = []
    for jdata in jugadors_data:
        inventari = jdata.pop("inventari")
        doc_ref = db.collection("jugadors").document()
        doc_ref.set(jdata)
        jugador_ids.append(doc_ref.id)

        for item in inventari:
            doc_ref.collection("inventari").add(item)

        print(f"  [+] Jugador: {jdata['nickname']} (ID: {doc_ref.id})")
        if inventari:
            print(f"     -> {len(inventari)} items al inventari")

    print()

    # --- PARTIDES ---
    partides_data = [
        {"mapa": "Base Lunar", "estat": "Finalitzada", "data_creacio": "2026-05-20T18:30:00"},
        {"mapa": "Estacio Orbital", "estat": "Finalitzada", "data_creacio": "2026-05-22T20:00:00"},
        {"mapa": "Camp d'Asteroides", "estat": "En curs", "data_creacio": datetime.now(timezone.utc).isoformat()}
    ]

    partida_ids = []
    for pdata in partides_data:
        _, doc_ref = db.collection("partides").add(pdata)
        partida_ids.append(doc_ref.id)
        print(f"  [+] Partida: {pdata['mapa']} (ID: {doc_ref.id})")

    print()

    # --- PUNTUACIONS ---
    puntuacions_data = [
        {"partida_idx": 0, "puntuacions": [
            {"jugador_id": jugador_ids[0], "punts": 8500, "baixes": 42, "ganyota": "Primer entrega!"},
            {"jugador_id": jugador_ids[1], "punts": 6200, "baixes": 31, "ganyota": "La proxima sera meua"},
            {"jugador_id": jugador_ids[2], "punts": 3400, "baixes": 18, "ganyota": None}
        ]},
        {"partida_idx": 1, "puntuacions": [
            {"jugador_id": jugador_ids[1], "punts": 12000, "baixes": 55, "ganyota": "Nova marca personal!"},
            {"jugador_id": jugador_ids[0], "punts": 9800, "baixes": 47, "ganyota": "Gairebe..."},
            {"jugador_id": jugador_ids[2], "punts": 5100, "baixes": 23, "ganyota": "Millorare"}
        ]}
    ]

    for pd in puntuacions_data:
        partida_id = partida_ids[pd["partida_idx"]]
        for punts in pd["puntuacions"]:
            punts["partida_id"] = partida_id
            db.collection("partides").document(partida_id).collection("puntuacions").add(punts)

        print(f"  [+] {len(pd['puntuacions'])} puntuacions per partida {partida_id}")

    print()
    print("=== Base de dades poblada! ===")


if __name__ == "__main__":
    seed()
