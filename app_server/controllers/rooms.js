var fs = require('fs');
var rooms1 = JSON.parse(fs.readFileSync('./data/rooms.json', 'utf8'));

/* GET rooms view */
const rooms = (req, res) => {
    res.render('rooms', {title: 'Travlr Getaways', rooms1, isRooms: true});
};

module.exports = {
    rooms
};