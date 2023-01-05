export const generateRandomString = () => {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .slice(0, 5)
}
