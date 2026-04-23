import strawberry
from app.jugadors.queries import JugadorQuery
from app.jugadors.mutations import JugadorMutation
from app.partides.queries import PartidaQuery
from app.partides.mutations import PartidaMutation

@strawberry.type
class Query(JugadorQuery, PartidaQuery):
    pass

@strawberry.type
class Mutation(JugadorMutation, PartidaMutation):
    pass

schema = strawberry.Schema(query=Query, mutation=Mutation)
