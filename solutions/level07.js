export const solution = `for (let y = 0; y < GRID_HEIGHT; y += 2) {
  for (let x = 0; x < GRID_WIDTH; x++) {
    goTo(x, y);
    plant();
    water();
  }
}`;
