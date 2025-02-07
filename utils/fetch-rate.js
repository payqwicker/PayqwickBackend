const axios = require("axios");
const cron = require("node-cron");

let { cryptoRate } = require("../routes/crypto-route");

// Function to fetch cryptocurrency rates
const fetchCryptoRates = async () => {
  try {
    const encodedParams = new URLSearchParams();
    encodedParams.set("from-value", "1");
    encodedParams.set("from-type", "USD");
    encodedParams.set("to-type", "NGN");

    const options = {
      method: "POST",
      url: "https://community-neutrino-currency-conversion.p.rapidapi.com/convert",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "X-RapidAPI-Key": "4a4b4da578msh3d009565c73b4e7p1dc306jsneb220659c39c",
        "X-RapidAPI-Host":
          "community-neutrino-currency-conversion.p.rapidapi.com",
      },
      data: encodedParams,
    };

    const response = await axios.request(options);

    cryptoRate = response.data;
    console.log("Fetched Crypto Rates:", cryptoRate);
    // Here you can do whatever you want with the data, like saving it to a database
  } catch (error) {
    console.error("Error fetching crypto rates:", error.message);
  }
};

// Schedule the task to run once every day at midnight
cron.schedule(
  "0 0 * * *",
  () => {
    console.log("Running task to fetch crypto rates...");
    fetchCryptoRates();
  },
  {
    scheduled: true,
    timezone: "Africa/Lagos",
  }
);

fetchCryptoRates();

module.exports = { cryptoRate };
