async function fetchData2() {
  console.debug("Start Fetch 2");

  const result = await fetch("https://jsonplaceholder.typicode.com/posts/1");
  console.log(result);

  return result;
}

fetch("https://jsonplaceholder.typicode.com/posts").then(async (res) => {
  console.debug("Start Fetch 1");

  console.log(res);

  await fetchData2();
});
