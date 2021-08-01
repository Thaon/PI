/**
 * Called to initialize the game and load all the resources needed for it
 */
function preload() {

  Game = new PIGame(64, 64);
  Game.SetBackground(new Color(240, 240, 255, 1));
  Game.LoadImage("pie", "assets/pie.png");

  console.log("Preload complete");
}

function setup() {
  Game.AddScene("scene1");
  Game.LoadScene("scene1");

  let tester = new Tester("Tester");

  Game.Instantiate(tester, Vector2(10, 10), 0);
}

function draw() {
    P5.clear();
    Game.GameUpdate();
}
