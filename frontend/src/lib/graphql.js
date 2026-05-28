let _token = null;

let _jugador = null;

export function setToken(token) {
  _token = token;
}

export function getToken() {
  return _token;
}

export function getJugador() {
  return _jugador;
}

export function setJugador(j) {
  _jugador = j;
}

async function graphql(query, variables = {}) {
  const headers = { "Content-Type": "application/json" };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  const res = await fetch("/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

export async function registre(email, password, nickname) {
  const data = await graphql(
    `mutation($input: RegistreInput!) {
      registre(input: $input) {
        ... on AuthOk { jugador { id nickname nivell credits puntsTotals videsExtra escut } token }
        ... on ErrorAuth { mensaje }
      }
    }`,
    { input: { email, password, nickname } }
  );
  const res = data.registre;
  if (res.token) {
    setToken(res.token);
    setJugador(res.jugador);
  }
  return res;
}

export async function iniciSessio(email, password) {
  const data = await graphql(
    `mutation($email: String!, $password: String!) {
      iniciSessio(email: $email, password: $password) {
        ... on AuthOk { jugador { id nickname nivell credits puntsTotals videsExtra escut } token }
        ... on ErrorAuth { mensaje }
      }
    }`,
    { email, password }
  );
  const res = data.iniciSessio;
  if (res.token) {
    setToken(res.token);
    setJugador(res.jugador);
  }
  return res;
}

export async function registrarJugador(nickname, idToken) {
  if (idToken) setToken(idToken);
  const data = await graphql(
    `mutation($input: RegistrarJugadorInput!) {
      registrarJugador(input: $input) { id nickname nivell credits puntsTotals videsExtra escut }
    }`,
    { input: { nickname } }
  );
  return data.registrarJugador;
}

export async function crearPartida(mapa) {
  const data = await graphql(
    `mutation($input: CrearPartidaInput!) {
      crearPartida(input: $input) { id mapa estat }
    }`,
    { input: { mapa } }
  );
  return data.crearPartida;
}

export async function registrarPuntuacio(partidaId, jugadorId, punts, baixes, ganyota, bossKilled = false) {
  const data = await graphql(
    `mutation($partidaId: String!, $jugadorId: String!, $punts: Int!, $baixes: Int!, $ganyota: String, $bossKilled: Boolean) {
      registrarPuntuacio(partidaId: $partidaId, jugadorId: $jugadorId, punts: $punts, baixes: $baixes, ganyota: $ganyota, bossKilled: $bossKilled)
    }`,
    { partidaId, jugadorId, punts, baixes, ganyota, bossKilled }
  );
  return data.registrarPuntuacio;
}

export async function finalitzarPartida(partidaId) {
  const data = await graphql(
    `mutation($partidaId: String!) {
      finalitzarPartida(partidaId: $partidaId) { ... on Partida { id estat } }
    }`,
    { partidaId }
  );
  return data.finalitzarPartida;
}

export async function obtenirClassificacio(limit = 10) {
  const data = await graphql(
    `query($limit: Int!) {
      taulaClassificacio(limit: $limit) {
        jugadorId punts baixes ganyota
        jugador { nickname }
      }
    }`,
    { limit }
  );
  return data.taulaClassificacio;
}

export async function obtenirJugador(id) {
  const data = await graphql(
    `query($id: String!) {
      perfilJugador(id: $id) { id nickname nivell credits puntsTotals videsExtra escut }
    }`,
    { id }
  );
  return data.perfilJugador;
}

export async function comprarMillora(jugadorId, tipus) {
  const data = await graphql(
    `mutation($jugadorId: String!, $tipus: String!) {
      comprarMillora(jugadorId: $jugadorId, tipus: $tipus) {
        ... on Jugador { id nickname credits puntsTotals videsExtra escut }
        ... on ErrorCreditsInsuficients { mensaje }
        ... on ErrorLimitMillora { mensaje }
        ... on ErrorJugadorNoTrobat { mensaje }
      }
    }`,
    { jugadorId, tipus }
  );
  return data.comprarMillora;
}

export async function consumirMillores(jugadorId, videsGastades = 0, escutGastat = false) {
  const data = await graphql(
    `mutation($jugadorId: String!, $videsGastades: Int!, $escutGastat: Boolean!) {
      consumirMillores(jugadorId: $jugadorId, videsGastades: $videsGastades, escutGastat: $escutGastat) {
        id nickname credits puntsTotals videsExtra escut
      }
    }`,
    { jugadorId, videsGastades, escutGastat }
  );
  return data.consumirMillores;
}
