const mongoose = require("mongoose");
const Fee = require("./Fee");
const ExchangeSettings = require("./ExchangeSettings");

const exchangeSchema = new mongoose.Schema({
  currency: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ["crypto", "money"],
    default: "crypto",
  },
  image: {
    type: String,
    allowNull: true,
  },
});

exchangeSchema.pre("findOneAndDelete", async function (next) {
  const exchangeName = this.getQuery()._id;
  await Fee.deleteMany({
    $or: [
      { firstPair: new mongoose.Types.ObjectId(exchangeName) },
      { secondPair: new mongoose.Types.ObjectId(exchangeName) },
    ],
  });
  next();
});

const Exchange = mongoose.model("Exchange", exchangeSchema);

module.exports = Exchange;
