addEventListener("DOMContentLoaded", (event) => {
    updatePage(currentPage);

    document.getElementById("left").addEventListener("click", (e) => {
        if (cardScore["left"] >= cardScore["right"]) {
            handleScore(1);
        } else if (cardScore["left"] < cardScore["right"]) {
            handleScore(0);
        } else {
            alert("error");
        }
    })
    document.getElementById("right").addEventListener("click", (e) => {
        if (cardScore["left"] <= cardScore["right"]) {
            handleScore(1);
        } else if (cardScore["left"] > cardScore["right"]) {
            handleScore(0);
        } else {
            alert("error");
        }
    })
})


// Here we define our query as a multi-line string
// Storing it in a separate .graphql/.gql file is also possible
const query = `
query ($page: Int, $perPage: Int) {
  Page (page: $page, perPage: $perPage) {
    pageInfo {
      currentPage
      hasNextPage
      perPage
    }
    media (format: TV) {
      id
      meanScore
      description
      bannerImage
      coverImage {
      extraLarge
      }
      title {
        english
        romaji
      }
    }
  }
}
`;

const ENTRYARRAY = JSON.parse(localStorage.getItem("array")) ?? [];
var SCORE = 0;
var currentPage;
var cardScore = { left: null, right: null };
if (ENTRYARRAY < 1) {
    currentPage = 1;
} else {
    currentPage = parseInt(localStorage.getItem("currentPage")) + 1 ?? 1;
}
var initDone = false;

async function handleScore(state) {
    cardScore = { left: null, right: null };
    document.body.style.pointerEvents = "none";
    const display = document.getElementById("display");
    const displayText = document.getElementById("displayText");
    const lost = document.getElementsByClassName("lost")[0];
    const lostText = document.getElementsByClassName("lostText")[0];
    const loseScore = document.getElementById("loseScore");
    // state = 1 = correct answer
    // state = 0 = false answer
    if (state === 1) {
        SCORE = SCORE + 1;
        document.getElementById("score").textContent = (SCORE > parseInt(document.getElementById("score").textContent) ? SCORE : document.getElementById("score").textContent);
        display.style.display = "block";
        await sleep(300);
        display.style.display = "none";
        await updatePage(currentPage)
    }
    if (state === 0) {
        loseScore.textContent = SCORE;
        SCORE = 0;
        lost.style.display = "block";
        await sleep(600);
        lost.style.display = "none";
        await updatePage(currentPage);
    }
    lost.textContent
    document.body.style.pointerEvents = "auto";
}

function handleResponse(response) {
    return response.json().then(function (json) {
        return response.ok ? json : Promise.reject(json);
    });
}

function handleData(data) {
    data.data.Page.media.forEach(element => {
        ENTRYARRAY.push({
            title: element.title.english ?? element.title.romaji,
            score: element.meanScore,
            description: element.description,
            cover: element.coverImage.extraLarge,
        });
    });
    localStorage.setItem("array", JSON.stringify(ENTRYARRAY));
}

function handleError(error) {
    console.error("API Error:", error);
}

async function getentries(currentPage = 1) {
    localStorage.setItem("currentPage", currentPage);
    var variables = {
        page: currentPage,
        perPage: 50
    };

    var url = 'https://graphql.anilist.co',
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        };

    await fetch(url, options).then(handleResponse)
        .then(handleData)
        .catch(handleError);
}

async function updatePage(currentPage) {
    const leftCard = document.getElementById("left");
    const rightCard = document.getElementById("right");

    var animes = JSON.parse(localStorage.getItem("array"));
    if (animes === null || animes.length < 40) {
        await getentries(currentPage);
        animes = JSON.parse(localStorage.getItem("array"));
    }

    await updateCard(leftCard, getRandomInt(animes.length));
    updateCard(rightCard, getRandomInt(animes.length));

    if (initDone === false) {
        await sleep(200);
        document.getElementsByClassName("overlay")[0].style.visibility = "hidden";
        initDone = true;
    }
}

async function updateCard(card, num) {
    animes = JSON.parse(localStorage.getItem("array"));
    const data = animes[num];
    animes.splice(num, 1);
    localStorage.setItem("array", JSON.stringify(animes));

    if (cardScore["left"] !== null) {
        cardScore["right"] = data.score;
    } else {
        cardScore["left"] = data.score;
    }

    console.log(cardScore);

    card.querySelector(".card").src = data.cover;
    card.querySelector(".cardBackground").src = data.cover;

    card.querySelector(".infoBox .infoTitle").textContent = data.title;
    card.querySelector(".infoBox .infoBody").innerhtml = data.description;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
