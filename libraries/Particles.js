// Create an array for the particles
var particles = [];

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

function CreateParticleArray(
  xPos,
  yPos,
  spd,
  rad,
  partNumber,
  life,
  innerColor,
  outerColor
) {
  // Adds particles to the array
  for (var i = 0; i < partNumber; i++) {
    particles.push(
      new create(xPos, yPos, spd, rad, life, innerColor, outerColor)
    );
  }
  RenderParticles();
}

function create(startX, startY, speed, radius, life, innerColor, outerColor) {
  // Point of touch
  this.x = startX;
  this.y = startY;

  // Add random velocity to each particle
  this.vx = RandomRange(-speed, speed);
  this.vy = RandomRange(-speed, speed);

  //color management
  this.inner = null;
  this.outer = null;
  this.innerColor = innerColor;
  this.outerColor = outerColor;

  //Random size
  this.radius = RandomRange(radius * 0.5, radius * 1.5);

  // fade value
  this.fade = 1;
  this.life = life;

  // particle dead
  this.dead = false;
}

// Render and move the particle
function RenderParticles() {
  P5.drawingContext.globalCompositeOperation = "multiply";
  // Render the particles
  for (var t = 0; t < particles.length; t++) {
    var p = particles[t];

    // Mix the colours
    var gradient = P5.drawingContext.createRadialGradient(
      p.x,
      p.y,
      0,
      p.x,
      p.y,
      p.radius
    );

    //setup particle colors
    p.inner =
      "rgba(" +
      p.innerColor.red +
      ", " +
      p.innerColor.green +
      ", " +
      p.innerColor.blue +
      ", " +
      p.innerColor.alpha * p.fade +
      ")";

    p.outer =
      "rgba(" +
      p.outerColor.red +
      ", " +
      p.outerColor.green +
      ", " +
      p.outerColor.blue +
      ", " +
      p.outerColor.alpha * p.fade +
      ")";

    gradient.addColorStop(0, p.inner);
    gradient.addColorStop(1, p.outer);

    P5.drawingContext.beginPath();
    P5.drawingContext.fillStyle = gradient;
    P5.drawingContext.arc(p.x, p.y, p.radius, Math.PI * 2, false);
    P5.drawingContext.closePath();
    P5.drawingContext.fill();

    // Add velocity
    p.x += p.vx;
    p.y += p.vy;

    // Decrease fade and if particle is dead remove it
    p.fade -= p.life * Time.deltaTime;

    if (p.fade < 0) {
      p.dead = true;
    }

    if (p.dead == true) {
      particles.splice(t, 1);
    }
  }
}
