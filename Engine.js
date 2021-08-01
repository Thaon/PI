const P5 = this;
const Vector2 = (x, y) => {
    return P5.createVector(x, y, 0);
};

/**
 * ECS Components
 * --------------------------------------------------------------------------------------------------
 */
class Transform {
    constructor(position, rotation, momentum, rotationalMomentum) {
        this.position = position;
        this.rotation = rotation;
        this.momentum = momentum;
        this.rotationalMomentum = rotationalMomentum;
    }
    position = null;
    rotation = 0;
    scale = 1;
}

class Sprite {
    constructor(name, sprite) {
        this.name = name;
        this.sprite = sprite;
    }
    name = "";
    sprite = null;

    draw = (x, y) => {
        image(this.sprite, x, y);
    };

    drawScaled = (x, y, scale) => {
        image(this.sprite, x, y, this.sprite.width * scale, this.sprite.height * scale);
    };
}

class GameObject {
    constructor(name, position, rotation) {
        this.name = name;
        this.transform = new Transform(position, rotation);
    }
    name = "";
    transform = null;
    sprite = null;

    start = () => {};
    update = (deltaTime) => {};
    draw = (deltaTime) => {};
    onClick = () => {};
}

/**
 * Engine Architecture and Systems
 * --------------------------------------------------------------------------------------------------
 */
class Scene {
    constructor(name) {
        this.name = name;
    }
    name = "";
    objects = [];
}

class SceneManager {
    scenes = [];
    activeScene = null;

    loadScene = (name) => {
        let scene = this.scenes.find((X) => X.name == name);
        if (scene != null) this.activeScene = scene;
        else console.log("Could not load scene: " + name);
    };
}

class RenderSystem {
    render = (scene) => {
        //render only objects that have a sprite renderer attached
        let toRender = scene.objects.filter((go) => go.sprite != null);
        toRender.forEach((go) => {
            push();
            let pos = go.transform.position;
            translate(pos.x, pos.y);
            rotate(radians(go.transform.rotation));
            go.sprite.drawScaled(0, 0, go.transform.scale);
            pop();
        });
    };
}

/**
 * Game class definition and Hooks
 * --------------------------------------------------------------------------------------------------
 */
class PIGame {
    constructor(width, height) {
        this.init(width, height);
        this.startTimeMS = Date.now();
    }
    startTimeMS = 0;
    backgroundColor = new Color(255, 255, 255, 1);

    input = new Input();
    renderSystem = new RenderSystem();
    sceneManager = new SceneManager();
    sprites = [];
    fonts = [];

    //preload resources for the game in here
    init = (width, height) => {
        let canvas = P5.createCanvas(width, height);
        canvas.mouseClicked(this.checkForObjectClicks);
    };

    setBackground = (color) => {
        this.backgroundColor = color;
    }

    //check for clicks on instantiated objects
    checkForObjectClicks = () => {
        //check for clicks on GameObjects
        if (this.sceneManager.activeScene != null) {
            let toCheck = this.sceneManager.activeScene.objects.filter(
                (go) => go.sprite != null
            );
            toCheck.forEach((go) => {
                let mouseClicked = this.input.mousePressed;
                if (mouseClicked.pressed) {
                    if (
                        //AABB collision check (note: this may fail if the object is rotated)
                        mouseClicked.x / 4 >= go.transform.position.x - (go.sprite.sprite.width * go.transform.scale) / 2 &&
                        mouseClicked.x / 4 <= go.transform.position.x + (go.sprite.sprite.width * go.transform.scale) / 2 &&
                        mouseClicked.y / 4 >= go.transform.position.y - (go.sprite.sprite.height * go.transform.scale) / 2 &&
                        mouseClicked.y / 4 <= go.transform.position.y + (go.sprite.sprite.height * go.transform.scale) / 2
                    ) {
                        go.onClick();
                    }
                }
            });
        }
    }

    //general update loop, note: this is global
    gameUpdate = () => {
        //calculate deltaTime
        Time.deltaTime = (Date.now() - this.startTimeMS) / 1000;

        //update input
        this.input.updateInput();

        //update all GameObjects
        this.update(Time.deltaTime);

        //render the scene
        this.render(Time.deltaTime);

        //reset deltaTime calculations
        this.startTimeMS = Date.now();
    };

    //Sprites management --------------------------------------------------------------------------------------------------
    loadImage = (name, path) => {
        let img = P5.loadImage(path);
        P5.get();
        if (img == null) {
            console.log("Could not load the image: " + name);
            return;
        }

        P5.rectMode(CENTER);
        P5.imageMode(CENTER);
        let spr = new Sprite(name, img);
        this.sprites.push(spr);
    };

    getSprite = (name) => {
        let spr = this.sprites.find((X) => X.name == name);
        if (spr != null) return spr;
        else console.log("Could not find the image: " + name);
    };

    //Font management --------------------------------------------------------------------------------------------------
    loadFont = (name, path) => {
        let font = P5.loadFont(path);
        this.fonts.push({
            name,
            font
        });
    }

    getFont = (name) => {
        let fnt = this.fonts.find((X) => X.name == name);
        if (fnt != null) return fnt.font;
        else console.log("Could not find the font: " + name);
    }

    drawText = (text, position, size) => {
        P5.textSize(size);
        P5.text(text, position.x, position.y);
    }

    drawTextAdv = (text, position, size, color, align) => {
        P5.textSize(size);
        P5.textAlign(align, align);
        P5.fill(color.red, color.green, color.blue);
        P5.text(text, position.x, position.y);
    }

    //Scenes management --------------------------------------------------------------------------------------------------
    addScene = (name) => {
        this.sceneManager.scenes.push(new Scene(name));
    };

    loadScene = (name) => {
        this.sceneManager.loadScene(name);
        //call start on all the GameObjects when the scene is loaded
        this.sceneManager.activeScene.objects.forEach((go) => {
            go.start();
        });
    };

    //update method, will be calling the GameObjects update, maybe deal with physics/collisions?
    update = (deltaTime) => {
        if (this.sceneManager.activeScene != null)
            this.sceneManager.activeScene.objects.forEach((go) => {
                go.update(deltaTime);
            });
    };

    //render method, can be abstracted to swap renderers
    render = (deltaTime) => {
        //clear the context
        P5.background(this.backgroundColor.red, this.backgroundColor.green, this.backgroundColor.blue);

        //first we render the particle systems on the back
        if (backgroundParticles.length > 0) {
            render_particles("BACK");
        }

        if (this.renderSystem != null) {
            //then we render all GameObjects
            this.renderSystem.render(this.sceneManager.activeScene);

            //then we render the particle systems on top
            if (particles.length > 0) {
                render_particles("FRONT");
            }

            //finally we call Draw on the GameObjects
            if (this.sceneManager.activeScene != null)
                this.sceneManager.activeScene.objects.forEach((go) => {
                    go.draw(deltaTime);
                });
        }
    };

    //GameObjects management --------------------------------------------------------------------------------------------------
    //   instantiate = (gameObject) => {
    //     this.instantiate(gameObject, Vector2(0, 0), 0);
    //   };

    instantiate = (gameObject, position, rotation) => {
        if (this.sceneManager.activeScene != null) {
            gameObject.transform.position = position;
            gameObject.transform.rotation = rotation;
            this.sceneManager.activeScene.objects.push(gameObject);
            //when an object is created, we call Start on it
            gameObject.start();
        } else
            console.log(
                "Could not instantiate object, there is no active scene selected"
            );
    };

    destroy = (gameObject) => {
        if (activeScene != null)
            activeScene.objects = activeScene.objects.filter((X) => X != gameObject);
    };
}

class Time {
    static deltaTime = 0;
}

/**
 * Input management
 * --------------------------------------------------------------------------------------------------
 */
class Input {
    updateInput = () => {
        this.mousePressed = {
            pressed: P5.mouseIsPressed,
            x: P5.mouseX,
            y: P5.mouseY,
        };
        this.mouse = {
            x: P5.mouseX / 4,
            y: P5.mouseY / 4
        };
        this.anyKeyIsPressed = P5.keyIsPressed;
        this.keyPressed = {
            pressed: P5.keyIsPressed,
            keyCode: P5.keyCode
        };
    };
    mousePressed = {
        pressed: P5.mouseIsPressed,
        x: P5.mouseX / 4,
        y: P5.mouseY / 4,
    };
    mouse = {
        x: P5.mouseX,
        y: P5.mouseY
    };
    anyKeyIsPressed = P5.keyIsPressed;
    keyPressed = {
        pressed: P5.keyIsPressed,
        keyCode: P5.keyCode
    };
}

/**
 * Audio management
 * --------------------------------------------------------------------------------------------------
 */
class AudioManager {
    //the audio manager takes care of loading, storing, playing and stopping sounds, it is explained in more detail in the blog and wiki
    constructor() {
        this.clips = [];
        this.names = [];
    }

    loadAudio(name, path) {
        var audioClip = new Audio();
        audioClip.src = path;
        this.clips.push(audioClip);
        this.names.push(name);
    }

    playAudio(name, looping) {
        for (var i = 0; i < this.clips.length; i++) {
            if (this.names[i] == name) {
                this.clips[i].loop = looping;
                this.clips[i].play();
            }
        }
    }

    stopAllAudio() {
        for (var i = 0; i < this.clips.length; i++) {
            {
                this.clips[i].pause();
                this.clips[i].currentTime = 0;
            }
        }
    }
}

/**
 * Utility
 * --------------------------------------------------------------------------------------------------
 */
//Random Range function from: https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
function random_range(min, max) {
    return Math.random() * (max - min) + min;
}

class Color {
    constructor(r, g, b, a) {
        this.red = r;
        this.green = g;
        this.blue = b;
        this.alpha = a;
    }
    red;
    green;
    blue;
    alpha;
}

//generate a global Game variable
let GAME = null;