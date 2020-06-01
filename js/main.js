let allTeams = null;
let allResults = null;

let results = null;
let thisResult = null;
let reload = null;
let loading = null;
let details = null;
let closeSpan = null;

window.addEventListener('load', () => {
  results = document.querySelector('#results');
  reload = document.querySelector('#reload');
  loading = document.querySelector('#loading');
  details = document.querySelector('#details');

  reload.addEventListener('click', () => {
    results.innerHTML = "";
    reload.classList.add("hidden");
    loading.classList.remove("hidden");
    localStorage.removeItem('allTeams');
    start();
  });

  start();
});

function start() {
  if (localStorage.getItem('allTeams') != null && localStorage.getItem('allResults') != null) {
    allTeams = JSON.parse(localStorage.getItem('allTeams'));
    allResults = JSON.parse(localStorage.getItem('allResults'));
    render();
  } else {
    doFetch();
  }
}

async function doFetch() {
  const res = await fetch("https://v2.api-football.com/teams/league/1347/", {
    "method": "GET",
    "headers": {
      "X-RapidAPI-Key": "a5156fb7b5418d9a91dd972980847808"
    }
  });
  const json = await res.json();
  allTeams = json.api.teams.map(team => {

    const { team_id, founded, logo, name, venue_city, venue_name } = team;
    return {
      id: team_id,
      name,
      year: founded,
      logo,
      city: venue_city.substring(0, venue_city.indexOf(",")),
      stadium: venue_name
    }
  });
  localStorage.setItem('allTeams', JSON.stringify(allTeams));
  await doFetchResults();
  await doFetchPosition();
  render();
}

async function doFetchResults() {
  const res = await fetch("https://v2.api-football.com/fixtures/league/1347/", {
    "method": "GET",
    "headers": {
      "X-RapidAPI-Key": "a5156fb7b5418d9a91dd972980847808"
    }
  });
  const json = await res.json();
  allResults = json.api.fixtures.map(result => {
    const { awayTeam, homeTeam, goalsAwayTeam, goalsHomeTeam, event_timestamp } = result;
    return {
      awayTeam,
      homeTeam,
      goalsHomeTeam,
      goalsAwayTeam,
      when: event_timestamp
    }
  });
  localStorage.setItem('allResults', JSON.stringify(allResults));
}

async function doFetchPosition() {
  const res = await fetch("https://v2.api-football.com/leagueTable/1347/", {
    "method": "GET",
    "headers": {
      "X-RapidAPI-Key": "a5156fb7b5418d9a91dd972980847808"
    }
  });
  const json = await res.json();
  const groups = json.api.standings;
  //mapear cada time
  //pra cada time, fazer uma busca nas tabelas
  //se ele estiver na tabela, retornar sua posição
  //e adicionar no array de times json.api.standings
  allTeams = allTeams.map(team => {
    let id = team.id;
    let positions = groups.map(group => {
      return group.find(team => {
        return team.team_id === id;
      });
    });
    positions = positions.filter(value => {
      return value !== undefined;
    })
    return {
      ...team,
      turnOne: positions[1].rank,
      turnTwo: positions[0].rank,
    }
  });
  localStorage.setItem('allTeams', JSON.stringify(allTeams));
}

async function render() {
  results.innerHTML = "";
  allTeams.sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
  await allTeams.forEach(team => {
    let div = document.createElement("div");
    div.classList.add("team");
    div.innerHTML = `
    <section class="up">
    <img src="${team.logo}">
    <section class="upright">
    <span class="name">${team.name} </span>
    <span class="year">${team.year}</span>
    </section>
    </section>
    <section class="down">
    <span class="city">${team.city}</span>
    <span class="stadium">${team.stadium}</span>
    </section>
    `;
    results.appendChild(div);



    div.addEventListener('click', () => {
      document.body.style.overflow = 'hidden';
      thisResult = allResults.filter(result => {
        return (result.homeTeam.team_id === team.id || result.awayTeam.team_id === team.id) && result.goalsHomeTeam !== null;
      });
      thisResult.sort((a, b) => {
        if (a > b) {
          return 1;
        } else {
          return -1;
        }
      });
      details.classList.add("show");
      details.innerHTML = `
      <span id="close" class="close">&#215</span>
      <section class="up">
      <img src="${team.logo}">
      <section class="upright">
      <span class="name">${team.name} </span>
      <span class="year">${team.year}</span>
      <span>1º turno: ${team.turnOne}º lugar</span>
      <span>2º turno: ${team.turnTwo}º lugar</span>
      </section>
      </section>
      <section class="teamData">
        <span class="dataTitle">Últimos resultados</span>
        ${thisResult.map(result => {
        const { homeTeam, awayTeam, goalsHomeTeam, goalsAwayTeam } = result;
        return `
          <section class="dataResult">
          <span class="homeTeam">${homeTeam.team_name}</span>
          <section class="allGoals">
          <span class="goals">${goalsHomeTeam}</span> x <span class="goals">${goalsAwayTeam}</span>
          </section>
          <span class="awayTeam">${awayTeam.team_name}</span>
          </section>`
      }).join("")}
        
      </section>
      `;

      closeSpan = document.querySelector('#close');

      closeSpan.addEventListener('click', () => {
        details.classList.remove("show");
        document.body.style.overflow = 'auto';
      });
    });
  });

  loading.classList.add("hidden");
  reload.classList.remove("hidden");
}