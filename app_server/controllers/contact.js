var fs = require('fs');
var info = JSON.parse(fs.readFileSync('./data/info.json', 'utf8'));

/* GET contact view */
const contact = (req, res) => {
    res.render('contact', {
        title: 'Travlr Getaways',
        contact: info,
        isContact: true
    });
};

module.exports = {
    contact
};