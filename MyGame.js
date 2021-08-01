/**
 * Called to initialize the game and load all the resources needed for it
 */
function preload() {

    GAME = new PIGame(64, 64);
    GAME.setBackground(new Color(240, 240, 255, 1));
    GAME.loadImage("pie", "assets/pie.png");

    console.log("Preload complete");
}

function setup() {
    GAME.addScene("scene1");
    GAME.loadScene("scene1");

    let tester = new Tester("Tester");

    GAME.instantiate(tester, Vector2(10, 10), 0);
}

function draw() {
    P5.clear();
    GAME.gameUpdate();
}
