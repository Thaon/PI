class ParticlesTester extends GameObject {
  Start = () => {
    console.log("start called");

    //particles color
    this.particlesInner = new Color(255, 255, 255, 1);
    this.particlesOuter = new Color(0, 255, 0, 1);

    //sprite setup
    this.sprite = Game.GetSprite("bird");
  };

  Update = (deltaTime) => {
    // console.log("update called, delta: " + deltaTime);

    //move the object to the mouse position and spawn particles
    this.transform.position = Vector2(Game.input.mouse.x, Game.input.mouse.y);

    CreateParticleArray(
      this.transform.position.x,
      this.transform.position.y,
      1,
      5,
      1,
      1,
      this.particlesInner,
      this.particlesOuter
    );
    this.transform.rotation += deltaTime;
  };
}
