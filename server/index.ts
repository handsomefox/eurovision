import { createApp } from "./app.js";
import { openDatabase } from "./db.js";

const db = openDatabase();
const app = createApp(db);
const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`Eurovision ranker listening on ${port}`);
});
