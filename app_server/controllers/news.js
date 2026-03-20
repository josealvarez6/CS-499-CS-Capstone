var fs = require('fs');
var stories = JSON.parse(fs.readFileSync('./data/stories.json', 'utf8'));

/* GET news view */
const news = (req, res) => {
    res.render('news', {title: 'Travlr Getaways', stories: stories, isNews: true});
};

module.exports = {
    news
};