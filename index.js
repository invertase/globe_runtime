class Hello {
  constructor() {
    console.log("Hello");
  }

  async fetchData() {
    console.debug("Start Fetch 1");

    const result = await fetch("https://jsonplaceholder.typicode.com/posts");
    console.log(result);

    return result;
  }
}

exports.Hello = Hello;

console.log(exports.Hello);
