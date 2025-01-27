// async function fetchData2() {
//   const result = await fetch("https://jsonplaceholder.typicode.com/posts");
//   console.log(result);

//   return result;
// }

// fetchData2();

fetch("https://jsonplaceholder.typicode.com/posts").then((res) => {
  console.log(res);
});

console.debug("Hello WOrld");
