var fs = require('fs');
var details = JSON.parse(fs.readFileSync('./data/details.json', 'utf8'));

/* GET about view */
const about = (req, res) => {
    res.render('about', {title: 'Travlr Getaways', details, isAbout: true});
};

module.exports = {
    about
};