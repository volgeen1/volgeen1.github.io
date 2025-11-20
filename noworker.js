addEventListener("DOMContentLoaded", (event) => {
    updatePage();

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
var SCORE = 0;
var cardScore = { left: null, right: null };
if (localStorage.getItem("currentPage") === null) {
    localStorage.setItem("currentPage", 1);
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
        await updatePage();
    }
    if (state === 0) {
        loseScore.textContent = SCORE;
        SCORE = 0;
        lost.style.display = "block";
        await sleep(600);
        lost.style.display = "none";
        await updatePage();
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
    const ENTRYARRAY = JSON.parse(localStorage.getItem("array")) ?? [];
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

async function getentries() {
    const currentPage = localStorage.getItem("currentPage");
    var variables = {
        page: currentPage,
        perPage: 30
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
    localStorage.setItem("currentPage", parseInt(currentPage) + 1);

    await fetch(url, options).then(handleResponse)
        .then(handleData)
        .catch(handleError);
    console.log("currentPage:", currentPage, "data:", JSON.parse(localStorage.getItem("array")));
}

async function updatePage() {
    const leftCard = document.getElementById("left");
    const rightCard = document.getElementById("right");

    var animes1 = JSON.parse(localStorage.getItem("array"));
    if (animes1 === null || animes1.length < 20) {
        await getentries();
        animes1 = JSON.parse(localStorage.getItem("array"));
    }

    const leftNum = getRandomInt(animes1.length);
    await updateCard(leftCard, animes1[leftNum]);
    animes1.splice(leftNum, 1);

    const rightNum = getRandomInt(animes1.length);
    await updateCard(rightCard, animes1[rightNum]);
    animes1.splice(rightNum, 1);

    localStorage.setItem("array", JSON.stringify(animes1));

    if (initDone === false) {
        await sleep(200);
        document.getElementsByClassName("overlay")[0].style.visibility = "hidden";
        initDone = true;
    }
}

async function updateCard(card, data) {
    try {
        if (cardScore["left"] !== null) {
            cardScore["right"] = data.score;
        } else {
            cardScore["left"] = data.score;
        }
    } catch (error) {
        updatePage();
        return;
    }

    console.log(cardScore);

    card.querySelector(".card").src = data.cover;
    card.querySelector(".cardBackground").src = data.cover;

    card.querySelector(".infoBox .infoTitle").textContent = data.title;
    card.querySelector(".infoBox .infoBody").innerHTML = data.description;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

