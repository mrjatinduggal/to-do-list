const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.set("strictQuery", false);
mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String,
});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your to do list!",
});
const item2 = new Item({
  name: "Press + to add",
});
const item3 = new Item({
  name: "Good work",
});

const defaultItems = [item1, item2, item3];

const customSchema = new mongoose.Schema({
  name: String,
  items: [],
});

const List = mongoose.model("List", customSchema);

const day = date.getDate();

app.get("/", function (req, res) {
  Item.find({}, (err, foundItems) => {
    if (err) {
      console.log(err);
    } else if (foundItems.length == 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: day, newListItems: foundItems });
    }
  });
});

app.get("/:custom", (req, res) => {
  const custom = req.params.custom;
  const lodCustom = _.capitalize(custom);

  const customItem = new List({
    name: lodCustom,
    item: [],
  });

  List.findOne({ name: lodCustom }, (err, i) => {
    if (err) {
      console.log(err);
    } else if (!i) {
      customItem.save();
      res.redirect("/" + lodCustom);
    } else {
      res.render("list", { listTitle: lodCustom, newListItems: i.items });
    }
  });
});

app.post("/", function (req, res) {
  const item = new Item({
    name: req.body.newItem,
  });

  if (req.body.list === day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: req.body.list }, (err, i) => {
      i.items.push(item);
      i.save();
      res.redirect("/" + req.body.list);
    });
  }
});

app.post("/delete", (req, res) => {
  const itemName = req.body.checkbox;
  const itemId = req.body.hiddenId;
  const listName = req.body.hidden;

  if (listName == day) {
    Item.findByIdAndRemove(itemId, (err) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    try {
      List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: { name: itemName } } },
        function (err) {
          if (!err) {
            res.redirect("/" + listName);
          }
        }
      );
    } catch (error) {
      console.log("hi", error);
    }
  }
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
