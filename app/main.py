from fastapi import FastAPI, Depends
from strawberry.fastapi import GraphQLRouter, BaseContext
from typing import Optional, Dict, Any
from app.schema import schema
from app.auth import obtener_usuario_actual

class Contexto(BaseContext):
    def __init__(self, usuario: Optional[Dict[str, Any]]):
        self.usuario = usuario

async def get_context(usuario: Optional[Dict[str, Any]] = Depends(obtener_usuario_actual)):
    return {
        "usuario": usuario
    }

app = FastAPI(title="AstroHunters Backend")

graphql_app = GraphQLRouter(schema, context_getter=get_context)
app.include_router(graphql_app, prefix="/graphql")

@app.get("/")
def read_root():
    return {"status": "AstroHunters API Online"}
