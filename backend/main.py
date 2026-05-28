import os
import strawberry
from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from strawberry.fastapi import GraphQLRouter
from typing import Optional, Dict, Any
from domain.jugadors.queries import JugadorQuery
from domain.jugadors.mutations import JugadorMutation
from domain.partides.queries import PartidaQuery
from domain.partides.mutations import PartidaMutation
from domain.partides.subscriptions import PartidaSubscription
from infrastructure.auth import obtenir_usuari_actual
from loaders.jugador_loader import create_jugador_loader


@strawberry.type
class Query(JugadorQuery, PartidaQuery):
    pass


@strawberry.type
class Mutation(JugadorMutation, PartidaMutation):
    pass


@strawberry.type
class Subscription(PartidaSubscription):
    pass


schema = strawberry.Schema(query=Query, mutation=Mutation, subscription=Subscription)


async def get_context(usuari: Optional[Dict[str, Any]] = Depends(obtenir_usuari_actual)):
    return {
        "usuari": usuari,
        "jugador_loader": create_jugador_loader()
    }


app = FastAPI(title="Operation Nexus")

graphql_app = GraphQLRouter(schema, context_getter=get_context)
app.include_router(graphql_app, prefix="/graphql")

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
