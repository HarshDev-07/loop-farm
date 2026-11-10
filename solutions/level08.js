export const solution = `harvest();
while (canMove('right')) {
  moveRight();
  harvest();
}`;
