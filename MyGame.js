var scene1;

/**
 * Called to initialize the game and load all the resources needed for it
 */
function preload() {
  console.log("Preload started");

  Game = new PIGame(64, 64);
  Game.LoadImage("jelly", "assets/jelly.png");

  console.log("Preload complete");
}

function setup() {
  scene1 = Game.AddScene("scene1");
  Game.LoadScene("scene1");

  let tester = new ParticlesTester("Tester");

  Game.Instantiate(tester, Vector2(10, 10), 0);
}

function draw() {
  Game.GameUpdate();
}
