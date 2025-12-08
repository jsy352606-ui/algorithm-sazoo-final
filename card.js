const CARD_IMAGES = [
  { src: "design studio cards-01.png", label: "Design Studio Card 01" },
  { src: "design studio cards-02.png", label: "Design Studio Card 02" },
  { src: "design studio cards-03.png", label: "Design Studio Card 03" },
  { src: "design studio cards-04.png", label: "Design Studio Card 04" },
  { src: "design studio cards-05.png", label: "Design Studio Card 05" },
  { src: "design studio cards-06.png", label: "Design Studio Card 06" },
  { src: "design studio cards-07.png", label: "Design Studio Card 07" },
  { src: "design studio cards-08.png", label: "Design Studio Card 08" },
  { src: "design studio cards-09.png", label: "Design Studio Card 09" },
];

const grid = document.getElementById("card-grid");
const reshuffleBtn = document.getElementById("reshuffle");

function drawCard() {
  if (!grid) return;

  const randomIndex = Math.floor(Math.random() * CARD_IMAGES.length);
  const { src, label } = CARD_IMAGES[randomIndex];

  grid.innerHTML = "";

  const figure = document.createElement("figure");
  figure.className = "card-slot";
  figure.setAttribute("aria-label", label);

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = label;
  img.src = encodeURI(src);

  figure.appendChild(img);
  grid.appendChild(figure);
}

if (grid) {
  drawCard();
}

if (reshuffleBtn) {
  reshuffleBtn.addEventListener("click", () => {
    reshuffleBtn.disabled = true;
    reshuffleBtn.textContent = "Shuffling...";
    setTimeout(() => {
      drawCard();
      reshuffleBtn.disabled = false;
      reshuffleBtn.textContent = "Shuffle Cards";
    }, 260);
  });
}
