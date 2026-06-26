fetch("http://localhost:3000/api/breakdown", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ taskTitle: "test", duration: "1" })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
