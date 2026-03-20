var fs = require('fs');
var dishes = JSON.parse(fs.readFileSync('./data/dishes.json', 'utf8'));

/* GET meals view */
const meals = (req, res) => {
    res.render('meals', {title: 'Travlr Getaways', dishes, isMeals: true});
};

module.exports = {
    meals
};