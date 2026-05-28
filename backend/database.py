import firebase_admin
from firebase_admin import credentials, firestore
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
cert_path = os.path.join(base_dir, "astrohunters-d0eb1-firebase-adminsdk-fbsvc-20db6c7817.json")

if not firebase_admin._apps:
    cred = credentials.Certificate(cert_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()