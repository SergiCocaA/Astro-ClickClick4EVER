import os
import firebase_admin
from firebase_admin import credentials, firestore

# Obtiene la ruta absoluta de la carpeta raíz del proyecto
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cert_path = os.path.join(base_dir, "serviceAccountKey.json")

if not os.path.exists(cert_path):
    raise FileNotFoundError(f"FALTA EL ARCHIVO DE CREDENCIALES: {cert_path}. Descárgalo de Firebase Console.")

cred = credentials.Certificate(cert_path)

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
