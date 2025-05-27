import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { title } from "process";
import axios from "axios";
import env from "dotenv";

const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
env.config();

const db = new pg.Client({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
});
db.connect();
let details = [];

app.get("/", async (req, res) => {
  const result = await db.query("select * from details order by date desc");

  details = result.rows;
  res.render("index.ejs", { books: details });
});

app.get("/add", async (req, res) => {
  res.render("new.ejs");
});
app.post("/submit", async (req, res) => {
  let title = req.body.title;
  const encodedTitle = title.replace(/ /g, "+");
  let author = req.body.author;
  const encodedAuthor = author.replace(/ /g, "+");
  let date = new Date();
  let rating = req.body.rating;
let response = await axios.get(
  `https://openlibrary.org/search.json?title=${encodedTitle}&author=${encodedAuthor}`
);

// ✅ Prefer cover_edition_key (used in cover API)
let olId =
  response.data.docs?.[0]?.cover_edition_key ||
  response.data.docs?.[0]?.edition_key?.[0] ||
  "N/A";
  console.log("Open Library ID:", olId);


  let notes = req.body.notes;

  await db.query(
    "insert into details (title, author, date, rating, notes, olid ) values ($1, $2, $3, $4, $5, $6)",
    [title, author, date, rating, notes, olId]
  );

  res.redirect("/");
});

app.get("/delete",async (req,res)=>{
  const DId=req.query.bookId;
await db.query(`delete from details where id=${DId}`);
res.redirect("/");
});

app.get("/sort",async (req,res)=>{
  const Sort_value= req.query.sortby;
  console.log("sort value recieved",Sort_value);
  const sorted_array=await db.query(`select * from details order by ${Sort_value}`);
  console.log(sorted_array);
  res.render("index.ejs", {books: sorted_array.rows});
  
  if(Sort_value=="nothing"){
    res.redirect("/");
  }
});
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
});