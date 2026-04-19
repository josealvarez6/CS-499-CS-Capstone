var fs = require('fs');
var home = JSON.parse(fs.readFileSync('./data/home.json', 'utf8'));

/* GET Homepage */
const index = (req, res) => {
    res.render('index', { title: "Travlr Getaways", home, isHome: true});
};

module.exports = {
    index
}