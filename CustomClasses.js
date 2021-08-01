class Tester extends GameObject {
  start = () => {
    console.log("start called");

    //particles color
    this.particlesInner = new Color(255, 255, 255, 1);
    this.particlesOuter = new Color(0, 255, 0, 1);

    //text
    this.textTimer = 0;

    //sprite setup
    this.sprite = GAME.getSprite("pie");
  };
  
  update = (deltaTime) => {
    // console.log("update called, delta: " + deltaTime);
    
    //create a particle system
    create_particle_array(
      this.transform.position.x,
      this.transform.position.y,
      1,
      5,
      1,
      1,
      this.particlesInner,
      this.particlesOuter,
      "BACK"
      );
      
    //move, rotate and scale the object
    this.transform.position = Vector2(GAME.input.mouse.x, GAME.input.mouse.y);
    this.transform.rotation += deltaTime * 100;
    this.transform.scale = P5.abs(0.05 * P5.sin(this.transform.rotation / 100));
    
    
  };
  
  draw = (deltaTime) => {
    //draw text if clicked
    if (this.textTimer > 0)
    {
      GAME.drawText("Clicked!", Vector2(10, 10), 11, new Color(0,0,0,0), CENTER);
      this.textTimer -= deltaTime;
    }
  }

  onClick = () => {
    console.log("You clicked me!");
    this.textTimer = 1;
  }
}
