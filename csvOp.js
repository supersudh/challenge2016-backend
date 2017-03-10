const csvFilePath = './cities.csv'
const csv = require('csvtojson')
var jsonfile = require('jsonfile')
var fs = require('fs');

var data_array = [];
var indexed_data = { countries: [], states: [], cities: [] };

module.exports = () => {
  return new Promise(resolve => {
    csv()
      .fromFile(csvFilePath)
      .on('json', (jsonObj) => {
        data_array.push(jsonObj);
      })
      .on('done', (error) => {
        console.log("finish reading");
        data_array.forEach((t, i) => {
          flag = indexed_data.countries.some(s => { return s["country_code"] == t["Country Code"] });
          if (!flag) {
            indexed_data.countries.push({ country_code: t["Country Code"], country_name: t["Country Name"] });
          }
          flag = indexed_data.states.some(s => { return s["province_code"] == t["Province Code"] });
          if (!flag) {
            indexed_data.states.push({
              province_code: t["Province Code"],
              province_name: t["Province Name"],
              country_code: t["Country Code"]
            });
          }
          flag = indexed_data.cities.some(s => { return s["city_code"] == t["City Code"] });
          if (!flag) {
            indexed_data.cities.push({
              country_code: t["Country Code"],
              province_code: t["Province Code"],
              city_code: t["City Code"],
              city_name: t["City Name"]
            });
          }
        });
        jsonfile.writeFile(__dirname + '/database.json', indexed_data, function (err) {
          if (err)
            console.log("Error in writing", err);
          console.log("Write success!");
          setTimeout(() => {
            console.log("Resolving...");
            resolve(indexed_data);
          }, 1000)

        });

      });
  });
};